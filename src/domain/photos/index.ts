import { randomUUID } from "node:crypto";
import type { Readable } from "node:stream";
import { count, eq } from "drizzle-orm";
import sharp from "sharp";
import { requestPhotos, requireDb, requests } from "@/db";
import type { RequestPhotoSelect } from "@/db";
import { can } from "@/domain/authorization";
import type { Actor } from "@/domain/authorization";
import {
  MAX_PHOTOS_PER_REQUEST,
  MAX_PHOTO_BYTES,
  MAX_PHOTO_DIMENSION,
  MAX_UPLOAD_BYTES,
} from "./limits";
import type { PhotoType } from "./limits";
import { sniffImageType } from "./sniff";
import { getPhotoStore } from "./store";
import type { PhotoStore } from "./store";

// Framework-free (no next/*). Every function takes the Actor first and
// enforces it via can(); callers pass null for an unauthenticated visitor.
// Route Handlers parse the multipart body and map PhotoError codes to
// Bulgarian messages.

export type PhotoErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "NO_FILES"
  | "TOO_MANY_FILES"
  | "FILE_TOO_LARGE"
  | "UPLOAD_TOO_LARGE"
  | "UNSUPPORTED_TYPE";

export class PhotoError extends Error {
  constructor(
    readonly code: PhotoErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PhotoError";
  }
}

export interface PhotoDto {
  id: number;
  requestId: number;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

function toDto(row: RequestPhotoSelect): PhotoDto {
  return {
    id: row.id,
    requestId: row.requestId,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
  };
}

function requireActor(actor: Actor | null): Actor {
  if (!actor) throw new PhotoError("UNAUTHENTICATED", "Sign-in is required.");
  return actor;
}

const forbidden = () =>
  new PhotoError("FORBIDDEN", "This actor may not do that.");

// Never decode an absurdly large image into memory.
const MAX_INPUT_PIXELS = 50_000_000;

const EXTENSIONS: Record<PhotoType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Decodes and re-encodes the upload. sharp drops all metadata (EXIF, GPS, ICC)
// on output; rotate() applies the EXIF orientation first so the picture stays
// upright once that tag is gone.
async function reencode(
  bytes: Uint8Array,
  type: PhotoType,
): Promise<Uint8Array> {
  try {
    const image = sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize({
        width: MAX_PHOTO_DIMENSION,
        height: MAX_PHOTO_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });
    if (type === "image/png") return await image.png().toBuffer();
    if (type === "image/webp") return await image.webp().toBuffer();
    return await image.jpeg({ quality: 85 }).toBuffer();
  } catch {
    throw new PhotoError("UNSUPPORTED_TYPE", "The file is not a valid image.");
  }
}

// Validates and sanitises every file before anything is written, so a
// rejected upload leaves nothing behind.
async function prepare(files: readonly Uint8Array[]) {
  if (files.length === 0) {
    throw new PhotoError("NO_FILES", "No photos were uploaded.");
  }
  if (files.length > MAX_PHOTOS_PER_REQUEST) {
    throw new PhotoError(
      "TOO_MANY_FILES",
      `At most ${MAX_PHOTOS_PER_REQUEST} photos per request.`,
    );
  }
  const total = files.reduce((sum, file) => sum + file.byteLength, 0);
  if (total > MAX_UPLOAD_BYTES) {
    throw new PhotoError("UPLOAD_TOO_LARGE", "The upload is too large.");
  }
  if (files.some((file) => file.byteLength > MAX_PHOTO_BYTES)) {
    throw new PhotoError("FILE_TOO_LARGE", "A photo is too large.");
  }
  // One at a time: decoding all five in parallel would multiply peak memory.
  const prepared: { type: PhotoType; data: Uint8Array }[] = [];
  for (const file of files) {
    const type = sniffImageType(file);
    if (!type) {
      throw new PhotoError(
        "UNSUPPORTED_TYPE",
        "Only JPEG, PNG and WebP photos are accepted.",
      );
    }
    prepared.push({ type, data: await reencode(file, type) });
  }
  return prepared;
}

// Attaches photos to a request. Only the request's client may; the request
// keeps at most MAX_PHOTOS_PER_REQUEST in total. All or nothing.
export async function addPhotos(
  actorOrNull: Actor | null,
  requestId: number,
  files: readonly Uint8Array[],
  store: PhotoStore = getPhotoStore(),
): Promise<PhotoDto[]> {
  const actor = requireActor(actorOrNull);
  const db = requireDb();

  const [request] = await db
    .select({
      clientId: requests.clientId,
      specialistId: requests.specialistId,
    })
    .from(requests)
    .where(eq(requests.id, requestId));
  if (!request) throw new PhotoError("NOT_FOUND", "Request not found.");
  if (!can(actor, "request.attach_photo", request)) throw forbidden();

  const prepared = await prepare(files);

  const written: string[] = [];
  try {
    return await db.transaction(async (tx) => {
      // Serialises concurrent uploads so the count below cannot race.
      await tx
        .select({ id: requests.id })
        .from(requests)
        .where(eq(requests.id, requestId))
        .for("update");
      const [{ existing }] = await tx
        .select({ existing: count() })
        .from(requestPhotos)
        .where(eq(requestPhotos.requestId, requestId));
      if (existing + prepared.length > MAX_PHOTOS_PER_REQUEST) {
        throw new PhotoError(
          "TOO_MANY_FILES",
          `At most ${MAX_PHOTOS_PER_REQUEST} photos per request.`,
        );
      }

      const rows: RequestPhotoSelect[] = [];
      for (const { type, data } of prepared) {
        const storageKey = `${randomUUID()}.${EXTENSIONS[type]}`;
        await store.put(storageKey, data);
        written.push(storageKey);
        const [row] = await tx
          .insert(requestPhotos)
          .values({
            requestId,
            storageKey,
            contentType: type,
            sizeBytes: data.byteLength,
            uploadedById: actor.id,
          })
          .returning();
        rows.push(row);
      }
      return rows.map(toDto);
    });
  } catch (error) {
    await Promise.allSettled(written.map((key) => store.delete(key)));
    throw error;
  }
}

export interface PhotoFile {
  contentType: string;
  stream: Readable;
}

// Opens a stored photo for the client, the assigned specialist or an admin.
export async function getPhoto(
  actorOrNull: Actor | null,
  photoId: number,
  store: PhotoStore = getPhotoStore(),
): Promise<PhotoFile> {
  const actor = requireActor(actorOrNull);
  const [found] = await requireDb()
    .select({
      storageKey: requestPhotos.storageKey,
      contentType: requestPhotos.contentType,
      clientId: requests.clientId,
      specialistId: requests.specialistId,
    })
    .from(requestPhotos)
    .innerJoin(requests, eq(requests.id, requestPhotos.requestId))
    .where(eq(requestPhotos.id, photoId));
  if (!found) throw new PhotoError("NOT_FOUND", "Photo not found.");
  if (!can(actor, "request.view_photo", found)) throw forbidden();

  const stream = await store.get(found.storageKey);
  if (!stream) throw new PhotoError("NOT_FOUND", "Photo not found.");
  return { contentType: found.contentType, stream };
}
