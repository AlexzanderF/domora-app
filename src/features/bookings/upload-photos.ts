// Browser-only: sends a booked request's photos to the upload Route Handler.
export async function uploadRequestPhotos(
  requestId: number,
  files: readonly File[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const body = new FormData();
  for (const file of files) body.append("photos", file);
  try {
    const response = await fetch(`/api/requests/${requestId}/photos`, {
      method: "POST",
      body,
    });
    if (response.ok) return { ok: true };
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    return {
      ok: false,
      error: data?.error ?? "Снимките не можаха да бъдат качени.",
    };
  } catch {
    return { ok: false, error: "Снимките не можаха да бъдат качени." };
  }
}
