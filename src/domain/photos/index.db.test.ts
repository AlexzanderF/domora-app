import { Readable } from "node:stream";
import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { requestPhotos, requireDb } from "@/db";
import type { Actor } from "@/domain/authorization";
import { UserRole, UserStatus } from "@/domain/identity/types";
import { RequestStatus } from "@/domain/requests/types";
import { createActor, insertRequest } from "../../../tests/db/factories";
import { MAX_PHOTO_BYTES } from "./limits";
import {
  addPhotos,
  addReportPhotos,
  getPhoto,
  listReportPhotoIds,
} from "./index";
import type { PhotoStore } from "./store";

class MemoryStore implements PhotoStore {
  readonly files = new Map<string, Uint8Array>();
  // Makes the n-th put (1-based) fail, to exercise cleanup.
  failOnPut: number | null = null;
  private puts = 0;

  async put(key: string, data: Uint8Array) {
    this.puts += 1;
    if (this.failOnPut === this.puts) throw new Error("disk full");
    this.files.set(key, data);
  }
  async get(key: string) {
    const data = this.files.get(key);
    return data ? Readable.from([data]) : null;
  }
  async delete(key: string) {
    this.files.delete(key);
  }
  async list() {
    return [...this.files.keys()].map((key) => ({
      key,
      modifiedAt: new Date(),
    }));
  }
}

const jpeg = (width = 40, height = 30) =>
  sharp({
    create: { width, height, channels: 3, background: "#cc3333" },
  })
    .jpeg()
    .toBuffer();
const png = () =>
  sharp({
    create: { width: 20, height: 20, channels: 3, background: "#33cc33" },
  })
    .png()
    .toBuffer();
const webp = () =>
  sharp({
    create: { width: 20, height: 20, channels: 3, background: "#3333cc" },
  })
    .webp()
    .toBuffer();

let store: MemoryStore;
let client: Actor;
let otherClient: Actor;
let specialist: Actor;
let otherSpecialist: Actor;
let pendingSpecialist: Actor;
let admin: Actor;
let requestId: number;

beforeEach(async () => {
  store = new MemoryStore();
  client = await createActor(UserRole.Client);
  otherClient = await createActor(UserRole.Client);
  specialist = await createActor(UserRole.Specialist);
  otherSpecialist = await createActor(UserRole.Specialist);
  pendingSpecialist = await createActor(
    UserRole.Specialist,
    UserStatus.Pending,
  );
  admin = await createActor(UserRole.Admin);
  requestId = await insertRequest({
    clientId: client.id,
    specialistId: specialist.id,
  });
});

async function rejection(promise: Promise<unknown>) {
  return promise.then(
    () => null,
    (error: { code?: string }) => error.code ?? "UNKNOWN",
  );
}

async function rows() {
  return requireDb().select().from(requestPhotos).orderBy(requestPhotos.id);
}

async function bytesOf(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

describe("addPhotos", () => {
  it("stores photos linked to the request and returns DTOs", async () => {
    const result = await addPhotos(
      client,
      requestId,
      [await jpeg(), await png(), await webp()],
      store,
    );

    expect(result.map((p) => p.contentType)).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
    const stored = await rows();
    expect(stored).toHaveLength(3);
    expect(stored.every((r) => r.requestId === requestId)).toBe(true);
    expect(stored.every((r) => r.uploadedById === client.id)).toBe(true);
    expect(result.map((p) => p.id)).toEqual(stored.map((r) => r.id));
    expect(store.files.size).toBe(3);
  });

  it("names files with random UUIDs, never anything from the upload", async () => {
    await addPhotos(client, requestId, [await jpeg(), await jpeg()], store);

    const keys = (await rows()).map((r) => r.storageKey);
    for (const key of keys) {
      expect(key).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/,
      );
      expect(store.files.has(key)).toBe(true);
    }
    expect(new Set(keys).size).toBe(2);
  });

  it("strips EXIF and GPS data from what is stored", async () => {
    const withGps = await sharp({
      create: { width: 40, height: 30, channels: 3, background: "#cc3333" },
    })
      .withExif({
        IFD0: { Copyright: "secret-owner" },
        IFD3: {
          GPSLatitudeRef: "N",
          GPSLatitude: "42/1 41/1 0/1",
          GPSLongitudeRef: "E",
          GPSLongitude: "23/1 19/1 0/1",
        },
      })
      .jpeg()
      .toBuffer();
    expect((await sharp(withGps).metadata()).exif).toBeDefined();

    await addPhotos(client, requestId, [withGps], store);

    const [row] = await rows();
    const out = Buffer.from(store.files.get(row.storageKey)!);
    expect((await sharp(out).metadata()).exif).toBeUndefined();
    expect(out.includes(Buffer.from("secret-owner"))).toBe(false);
  });

  it("re-encodes the upload rather than storing the original bytes", async () => {
    const original = await jpeg();

    await addPhotos(client, requestId, [original], store);

    const [row] = await rows();
    const out = Buffer.from(store.files.get(row.storageKey)!);
    expect(out.equals(original)).toBe(false);
    expect(row.sizeBytes).toBe(out.length);
    expect((await sharp(out).metadata()).format).toBe("jpeg");
  });

  it("bounds stored photos to about 1600 px", async () => {
    await addPhotos(client, requestId, [await jpeg(3200, 2400)], store);

    const [row] = await rows();
    const meta = await sharp(
      Buffer.from(store.files.get(row.storageKey)!),
    ).metadata();
    expect(meta.width).toBe(1600);
    expect(meta.height).toBe(1200);
  });

  it("rejects an actor who does not own the request", async () => {
    const photo = await jpeg();
    for (const actor of [
      otherClient,
      specialist,
      otherSpecialist,
      pendingSpecialist,
      admin,
    ]) {
      expect(await rejection(addPhotos(actor, requestId, [photo], store))).toBe(
        "FORBIDDEN",
      );
    }
    expect(await rejection(addPhotos(null, requestId, [photo], store))).toBe(
      "UNAUTHENTICATED",
    );
    expect(await rows()).toHaveLength(0);
    expect(store.files.size).toBe(0);
  });

  it("rejects an unknown request", async () => {
    expect(
      await rejection(addPhotos(client, 99999, [await jpeg()], store)),
    ).toBe("NOT_FOUND");
  });

  it("rejects an empty upload", async () => {
    expect(await rejection(addPhotos(client, requestId, [], store))).toBe(
      "NO_FILES",
    );
  });

  it("rejects more than 5 photos in one upload", async () => {
    const photo = await jpeg();

    expect(
      await rejection(
        addPhotos(client, requestId, Array(6).fill(photo), store),
      ),
    ).toBe("TOO_MANY_FILES");

    expect(await rows()).toHaveLength(0);
    expect(store.files.size).toBe(0);
  });

  it("counts photos already attached towards the limit of 5", async () => {
    const photo = await jpeg();
    await addPhotos(client, requestId, Array(3).fill(photo), store);

    expect(
      await rejection(
        addPhotos(client, requestId, Array(3).fill(photo), store),
      ),
    ).toBe("TOO_MANY_FILES");
    expect(await rows()).toHaveLength(3);

    await addPhotos(client, requestId, Array(2).fill(photo), store);
    expect(await rows()).toHaveLength(5);
  });

  it("rejects a file over 5 MB", async () => {
    const big = Buffer.alloc(MAX_PHOTO_BYTES + 1);

    expect(await rejection(addPhotos(client, requestId, [big], store))).toBe(
      "FILE_TOO_LARGE",
    );
  });

  it("rejects an upload over 15 MB in total", async () => {
    const chunk = Buffer.alloc(4 * 1024 * 1024);

    expect(
      await rejection(
        addPhotos(client, requestId, Array(4).fill(chunk), store),
      ),
    ).toBe("UPLOAD_TOO_LARGE");
  });

  it("rejects anything that is not a jpeg, png or webp by its bytes", async () => {
    const gif = Buffer.from("GIF89a\x01\x00\x01\x00\x00\x00\x00;", "latin1");
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');
    const text = Buffer.from("not an image at all");
    for (const file of [gif, svg, text, Buffer.alloc(0)]) {
      expect(await rejection(addPhotos(client, requestId, [file], store))).toBe(
        "UNSUPPORTED_TYPE",
      );
    }
  });

  it("rejects bytes that claim to be an image but cannot be decoded", async () => {
    const fake = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.from("this is not really a jpeg"),
    ]);

    expect(await rejection(addPhotos(client, requestId, [fake], store))).toBe(
      "UNSUPPORTED_TYPE",
    );
  });

  it("stores nothing when any file in the upload is rejected", async () => {
    expect(
      await rejection(
        addPhotos(
          client,
          requestId,
          [await jpeg(), Buffer.from("not an image")],
          store,
        ),
      ),
    ).toBe("UNSUPPORTED_TYPE");

    expect(await rows()).toHaveLength(0);
    expect(store.files.size).toBe(0);
  });

  it("removes already-written files when the store fails midway", async () => {
    store.failOnPut = 2;

    await expect(
      addPhotos(client, requestId, [await jpeg(), await jpeg()], store),
    ).rejects.toThrow("disk full");

    expect(await rows()).toHaveLength(0);
    expect(store.files.size).toBe(0);
  });
});

describe("getPhoto", () => {
  let photoId: number;
  let original: Buffer;

  beforeEach(async () => {
    original = await png();
    const [photo] = await addPhotos(client, requestId, [original], store);
    photoId = photo.id;
  });

  it("serves the stored bytes to the client, the assigned specialist and admins", async () => {
    const [row] = await rows();
    const stored = Buffer.from(store.files.get(row.storageKey)!);

    for (const actor of [client, specialist, admin]) {
      const photo = await getPhoto(actor, photoId, store);
      expect(photo.contentType).toBe("image/png");
      expect((await bytesOf(photo.stream)).equals(stored)).toBe(true);
    }
  });

  it("rejects everyone else", async () => {
    for (const actor of [otherClient, otherSpecialist, pendingSpecialist]) {
      expect(await rejection(getPhoto(actor, photoId, store))).toBe(
        "FORBIDDEN",
      );
    }
    expect(await rejection(getPhoto(null, photoId, store))).toBe(
      "UNAUTHENTICATED",
    );
  });

  it("does not show photos of a request to a specialist who only sees it as an opportunity", async () => {
    const openRequest = await insertRequest({ clientId: client.id });
    const [photo] = await addPhotos(client, openRequest, [original], store);

    expect(await rejection(getPhoto(otherSpecialist, photo.id, store))).toBe(
      "FORBIDDEN",
    );
    expect(await rejection(getPhoto(admin, photo.id, store))).toBeNull();
  });

  it("answers NOT_FOUND for an unknown photo", async () => {
    expect(await rejection(getPhoto(client, 99999, store))).toBe("NOT_FOUND");
  });

  it("answers NOT_FOUND when the file is missing from the store", async () => {
    const [row] = await rows();
    store.files.delete(row.storageKey);

    expect(await rejection(getPhoto(client, photoId, store))).toBe("NOT_FOUND");
  });
});

describe("addReportPhotos", () => {
  let reported: number;

  beforeEach(async () => {
    reported = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.AwaitingConfirmation,
      report: "Кранът е сменен.",
      reportSubmittedAt: new Date(),
    });
  });

  it("stores report photos for the assigned specialist, tagged as report photos", async () => {
    const result = await addReportPhotos(
      specialist,
      reported,
      [await jpeg(), await png()],
      store,
    );

    expect(result).toHaveLength(2);
    const stored = await rows();
    expect(stored.every((r) => r.kind === "REPORT")).toBe(true);
    expect(stored.every((r) => r.uploadedById === specialist.id)).toBe(true);
    expect(store.files.size).toBe(2);
  });

  it("rejects everyone but the assigned specialist, admins included", async () => {
    for (const actor of [client, otherSpecialist, pendingSpecialist, admin]) {
      expect(
        await rejection(
          addReportPhotos(actor, reported, [await jpeg()], store),
        ),
      ).toBe("FORBIDDEN");
    }
    expect(
      await rejection(addReportPhotos(null, reported, [await jpeg()], store)),
    ).toBe("UNAUTHENTICATED");
    expect(await rows()).toHaveLength(0);
  });

  it("keeps booking photos from addPhotos client-only", async () => {
    expect(
      await rejection(addPhotos(specialist, reported, [await jpeg()], store)),
    ).toBe("FORBIDDEN");
  });

  it("requires a submitted report", async () => {
    const inProgress = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.InProgress,
    });
    expect(
      await rejection(
        addReportPhotos(specialist, inProgress, [await jpeg()], store),
      ),
    ).toBe("INVALID_STATE");
  });

  it("refuses once the client has confirmed the work", async () => {
    const done = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.Completed,
      report: "Готово.",
      reportSubmittedAt: new Date(),
    });
    expect(
      await rejection(addReportPhotos(specialist, done, [await jpeg()], store)),
    ).toBe("INVALID_STATE");
  });

  it("applies the same limits, counted separately from booking photos", async () => {
    await addPhotos(client, reported, [await jpeg(), await jpeg()], store);

    expect(
      await rejection(
        addReportPhotos(
          specialist,
          reported,
          await Promise.all(Array.from({ length: 6 }, () => jpeg())),
          store,
        ),
      ),
    ).toBe("TOO_MANY_FILES");

    await addReportPhotos(
      specialist,
      reported,
      await Promise.all(Array.from({ length: 5 }, () => jpeg())),
      store,
    );
    expect(
      await rejection(
        addReportPhotos(specialist, reported, [await jpeg()], store),
      ),
    ).toBe("TOO_MANY_FILES");
  });

  it("rejects non-images by their bytes", async () => {
    expect(
      await rejection(
        addReportPhotos(
          specialist,
          reported,
          [new TextEncoder().encode("hello")],
          store,
        ),
      ),
    ).toBe("UNSUPPORTED_TYPE");
  });

  it("lets the client, the specialist and admins view report photos", async () => {
    const [photo] = await addReportPhotos(
      specialist,
      reported,
      [await png()],
      store,
    );
    for (const actor of [client, specialist, admin]) {
      expect(await rejection(getPhoto(actor, photo.id, store))).toBeNull();
    }
    expect(await rejection(getPhoto(otherClient, photo.id, store))).toBe(
      "FORBIDDEN",
    );
  });
});

describe("listReportPhotoIds", () => {
  it("maps request ids to their report photo ids only", async () => {
    const reported = await insertRequest({
      clientId: client.id,
      specialistId: specialist.id,
      status: RequestStatus.AwaitingConfirmation,
      report: "Готово.",
      reportSubmittedAt: new Date(),
    });
    await addPhotos(client, reported, [await jpeg()], store);
    const added = await addReportPhotos(
      specialist,
      reported,
      [await png(), await webp()],
      store,
    );

    const map = await listReportPhotoIds([reported, requestId]);
    expect(map.get(reported)).toEqual(added.map((p) => p.id));
    expect(map.has(requestId)).toBe(false);
  });

  it("returns an empty map for no requests", async () => {
    expect((await listReportPhotoIds([])).size).toBe(0);
  });
});
