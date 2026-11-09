import { PhotoError, addReportPhotos } from "@/domain/photos";
import { getActor } from "@/features/auth/server/actor";
import {
  photoErrorResponse,
  readPhotoFiles,
} from "@/features/bookings/server/photo-http";

// Multipart upload of a work completion report's photos (form field "photos"). A Route
// Handler rather than a Server Action: it carries a large binary body and
// needs real HTTP status codes.
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/requests/[id]/report-photos">,
) {
  try {
    const actor = await getActor();
    if (!actor) throw new PhotoError("UNAUTHENTICATED", "Sign-in is required.");

    const requestId = Number((await ctx.params).id);
    if (!Number.isSafeInteger(requestId) || requestId < 1) {
      throw new PhotoError("NOT_FOUND", "Request not found.");
    }

    const photos = await addReportPhotos(
      actor,
      requestId,
      await readPhotoFiles(request),
    );
    return Response.json({ photos }, { status: 201 });
  } catch (error) {
    const response = photoErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
