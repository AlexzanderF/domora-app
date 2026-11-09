import fs from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";

// Where photo bytes live. The beta uses a Docker named volume; an
// S3-compatible driver can implement the same interface later.
export interface PhotoStore {
  // Fails if the key already exists: stored photos are never overwritten.
  put(key: string, data: Uint8Array): Promise<void>;
  // Null when the key does not exist.
  get(key: string): Promise<Readable | null>;
  // Deleting a missing key is not an error.
  delete(key: string): Promise<void>;
}

// Keys are generated server-side (UUID + extension); this only guards the
// filesystem against anything else.
const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function fileFor(root: string, key: string): string {
  if (!SAFE_KEY.test(key) || key.includes("..")) {
    throw new Error(`Invalid photo key: ${JSON.stringify(key)}`);
  }
  return path.join(root, key);
}

export class LocalPhotoStore implements PhotoStore {
  constructor(private readonly root: string) {}

  async put(key: string, data: Uint8Array): Promise<void> {
    const file = fileFor(this.root, key);
    await fs.mkdir(this.root, { recursive: true });
    // "wx" refuses to overwrite.
    await fs.writeFile(file, data, { flag: "wx" });
  }

  async get(key: string): Promise<Readable | null> {
    const file = fileFor(this.root, key);
    try {
      const handle = await fs.open(file, "r");
      return handle.createReadStream();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await fs.rm(fileFor(this.root, key), { force: true });
  }
}

let defaultStore: PhotoStore | undefined;

// The store the app uses. PHOTO_STORAGE_DIR is the mounted volume in Compose;
// the fallback keeps local development working without configuration.
export function getPhotoStore(): PhotoStore {
  defaultStore ??= new LocalPhotoStore(
    process.env.PHOTO_STORAGE_DIR?.trim() ||
      path.join(process.cwd(), ".data", "photos"),
  );
  return defaultStore;
}
