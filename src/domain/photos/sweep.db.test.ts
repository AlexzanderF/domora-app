import { Readable } from "node:stream";
import { beforeEach, describe, expect, it } from "vitest";
import { requestPhotos, requireDb } from "@/db";
import { UserRole } from "@/domain/identity/types";
import { createActor, insertRequest } from "../../../tests/db/factories";
import { ORPHAN_UPLOAD_MAX_AGE_MS, sweepOrphanUploads } from "./sweep";
import type { PhotoStore } from "./store";

const NOW = new Date("2026-06-10T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000);

class MemoryStore implements PhotoStore {
  readonly files = new Map<string, Date>();
  async put(key: string) {
    this.files.set(key, NOW);
  }
  async get() {
    return Readable.from([]);
  }
  async delete(key: string) {
    this.files.delete(key);
  }
  async list() {
    return [...this.files].map(([key, modifiedAt]) => ({ key, modifiedAt }));
  }
}

describe("sweepOrphanUploads", () => {
  let store: MemoryStore;
  beforeEach(() => {
    store = new MemoryStore();
  });

  it("removes unattached uploads older than 24 hours", async () => {
    store.files.set("old-orphan.jpg", hoursAgo(25));

    const result = await sweepOrphanUploads({ store, now: NOW });

    expect(result).toEqual({ deleted: 1 });
    expect(store.files.size).toBe(0);
  });

  it("keeps unattached uploads that are not yet 24 hours old", async () => {
    store.files.set("fresh.jpg", hoursAgo(23));
    store.files.set(
      "boundary.jpg",
      new Date(NOW.getTime() - ORPHAN_UPLOAD_MAX_AGE_MS),
    );

    const result = await sweepOrphanUploads({ store, now: NOW });

    expect(result).toEqual({ deleted: 0 });
    expect([...store.files.keys()].sort()).toEqual([
      "boundary.jpg",
      "fresh.jpg",
    ]);
  });

  it("never removes photos attached to a request, however old", async () => {
    const client = await createActor(UserRole.Client);
    const request = await insertRequest({ clientId: client.id });
    await requireDb()
      .insert(requestPhotos)
      .values([
        {
          requestId: request,
          kind: "BOOKING",
          storageKey: "attached.jpg",
          contentType: "image/jpeg",
          sizeBytes: 1,
        },
        {
          requestId: request,
          kind: "REPORT",
          storageKey: "report.png",
          contentType: "image/png",
          sizeBytes: 1,
        },
      ]);
    store.files.set("attached.jpg", hoursAgo(24 * 90));
    store.files.set("report.png", hoursAgo(24 * 90));
    store.files.set("orphan.webp", hoursAgo(48));

    const result = await sweepOrphanUploads({ store, now: NOW });

    expect(result).toEqual({ deleted: 1 });
    expect([...store.files.keys()].sort()).toEqual([
      "attached.jpg",
      "report.png",
    ]);
  });
});
