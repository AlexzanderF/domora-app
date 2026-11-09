import type { PhotoType } from "./limits";

const startsWith = (bytes: Uint8Array, signature: readonly number[], at = 0) =>
  signature.every((value, index) => bytes[at + index] === value);

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];

// The real type of an upload from its leading bytes. The declared MIME type
// and file name are client-controlled and never trusted.
export function sniffImageType(bytes: Uint8Array): PhotoType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, PNG)) return "image/png";
  if (startsWith(bytes, RIFF) && startsWith(bytes, WEBP, 8)) {
    return "image/webp";
  }
  return null;
}
