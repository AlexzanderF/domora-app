import { inArray } from "drizzle-orm";
import { requestPhotos, requireDb } from "@/db";
import { getPhotoStore } from "./store";
import type { PhotoStore } from "./store";

// An upload is written to the store before its row is committed, so a crash
// (or a failed cleanup) can leave bytes that no request_photos row points at.
// The age guard keeps the sweep away from uploads still being attached.
export const ORPHAN_UPLOAD_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface SweepOptions {
  store?: PhotoStore;
  now?: Date;
}

// Deletes stored photos older than 24 hours that no request references. Runs
// as the worker's system actor; rows are never touched, so attached photos
// are never removed.
export async function sweepOrphanUploads({
  store = getPhotoStore(),
  now = new Date(),
}: SweepOptions = {}): Promise<{ deleted: number }> {
  const cutoff = now.getTime() - ORPHAN_UPLOAD_MAX_AGE_MS;
  const stale = (await store.list()).filter(
    (file) => file.modifiedAt.getTime() < cutoff,
  );
  if (stale.length === 0) return { deleted: 0 };

  // Read after listing: a row committed in between still protects its file.
  const attached = new Set(
    (
      await requireDb()
        .select({ key: requestPhotos.storageKey })
        .from(requestPhotos)
        .where(
          inArray(
            requestPhotos.storageKey,
            stale.map((file) => file.key),
          ),
        )
    ).map((row) => row.key),
  );

  // One stuck file must not keep the rest from being cleaned.
  let deleted = 0;
  for (const { key } of stale) {
    if (attached.has(key)) continue;
    try {
      await store.delete(key);
      deleted += 1;
    } catch (error) {
      console.error("[sweep] could not delete orphan upload:", key, error);
    }
  }
  return { deleted };
}
