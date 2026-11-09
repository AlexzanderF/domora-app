type UploadResult = { ok: true } | { ok: false; error: string };

// Browser-only: sends a booked request's photos to the upload Route Handler.
export function uploadRequestPhotos(
  requestId: number,
  files: readonly File[],
): Promise<UploadResult> {
  return upload(`/api/requests/${requestId}/photos`, files);
}

// Browser-only: sends the specialist's work completion report photos.
export function uploadReportPhotos(
  requestId: number,
  files: readonly File[],
): Promise<UploadResult> {
  return upload(`/api/requests/${requestId}/report-photos`, files);
}

async function upload(
  url: string,
  files: readonly File[],
): Promise<UploadResult> {
  const body = new FormData();
  for (const file of files) body.append("photos", file);
  try {
    const response = await fetch(url, {
      method: "POST",
      body,
    });
    if (response.ok) return { ok: true };
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    return {
      ok: false,
      error:
        data?.error ??
        // The proxy refuses an oversized body before the app can answer.
        (response.status === 413
          ? "Снимките са твърде големи."
          : "Снимките не можаха да бъдат качени."),
    };
  } catch {
    return { ok: false, error: "Снимките не можаха да бъдат качени." };
  }
}
