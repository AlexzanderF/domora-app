import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalPhotoStore } from "./store";
import type { PhotoStore } from "./store";

let dir: string;
let store: PhotoStore;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "domora-photos-"));
  store = new LocalPhotoStore(dir);
});

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

async function read(stream: AsyncIterable<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

describe("LocalPhotoStore", () => {
  it("returns what was put as a stream", async () => {
    await store.put("a1.jpg", Buffer.from("photo-bytes"));

    const stream = await store.get("a1.jpg");

    expect(stream).not.toBeNull();
    expect((await read(stream!)).toString()).toBe("photo-bytes");
  });

  it("creates its directory on first put", async () => {
    const nested = new LocalPhotoStore(path.join(dir, "not", "yet"));
    await nested.put("a1.png", Buffer.from("x"));

    const stream = await nested.get("a1.png");
    expect(stream).not.toBeNull();
    stream!.destroy();
  });

  it("returns null for a missing key", async () => {
    expect(await store.get("missing.jpg")).toBeNull();
  });

  it("deletes a stored file and tolerates deleting twice", async () => {
    await store.put("a1.webp", Buffer.from("x"));

    await store.delete("a1.webp");
    await store.delete("a1.webp");

    expect(await store.get("a1.webp")).toBeNull();
  });

  it("refuses keys that could escape the directory", async () => {
    for (const key of ["../evil.jpg", "a/b.jpg", "..", "", "a\\b.jpg"]) {
      await expect(store.put(key, Buffer.from("x"))).rejects.toThrow(
        /invalid photo key/i,
      );
      await expect(store.get(key)).rejects.toThrow(/invalid photo key/i);
    }
  });

  it("never overwrites an existing key", async () => {
    await store.put("a1.jpg", Buffer.from("first"));

    await expect(store.put("a1.jpg", Buffer.from("second"))).rejects.toThrow();

    const stream = await store.get("a1.jpg");
    expect((await read(stream!)).toString()).toBe("first");
  });
});
