import { PhotoError, addPhotos } from "@/domain/photos";
import { MAX_BODY_BYTES } from "@/domain/photos/limits";
import { getActor } from "@/features/auth/server/actor";
import { photoErrorResponse } from "@/features/bookings/server/photo-http";

// Multipart upload of a request's photos (form field "photos"). A Route
// Handler rather than a Server Action: it carries a large binary body and
// needs real HTTP status codes.
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/requests/[id]/photos">,
) {
  try {
    const actor = await getActor();
    if (!actor) throw new PhotoError("UNAUTHENTICATED", "Sign-in is required.");

    const requestId = Number((await ctx.params).id);
    if (!Number.isSafeInteger(requestId) || requestId < 1) {
      throw new PhotoError("NOT_FOUND", "Request not found.");
    }

    // Cheap early refusal; Caddy enforces the same cap in front of us.
    const declared = Number(request.headers.get("content-length"));
    if (declared > MAX_BODY_BYTES) {
      throw new PhotoError("UPLOAD_TOO_LARGE", "The upload is too large.");
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new PhotoError("NO_FILES", "The upload could not be read.");
    }
    const files = await Promise.all(
      form
        .getAll("photos")
        .filter((entry): entry is File => entry instanceof File)
        .map(async (file) => new Uint8Array(await file.arrayBuffer())),
    );

    const photos = await addPhotos(actor, requestId, files);
    return Response.json({ photos }, { status: 201 });
  } catch (error) {
    const response = photoErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
