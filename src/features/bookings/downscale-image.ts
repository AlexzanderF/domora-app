import { MAX_PHOTO_DIMENSION } from "@/domain/photos/limits";

// The size an image should be drawn at so its long side is at most `max`.
export function fitWithin(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

const JPEG_QUALITY = 0.85;

// Browser-only. Shrinks a photo to about MAX_PHOTO_DIMENSION and re-encodes it
// as JPEG, which keeps phone photos far below the upload limits. Rejects when
// the browser cannot decode the file.
export async function downscaleImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  try {
    const { width, height } = fitWithin(
      bitmap.width,
      bitmap.height,
      MAX_PHOTO_DIMENSION,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available.");
    // JPEG has no transparency: flatten PNG/WebP alpha onto white.
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) throw new Error("The image could not be encoded.");
    const name = file.name.replace(/\.[^.]*$/, "") || "photo";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
