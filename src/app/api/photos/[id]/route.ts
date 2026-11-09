import { Readable } from "node:stream";
import { PhotoError, getPhoto } from "@/domain/photos";
import { getActor } from "@/features/auth/server/actor";
import { photoErrorResponse } from "@/features/bookings/server/photo-http";

// The only way to read a stored photo: authenticated, and authorized per
// request by can(). Nothing is served from public/.
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/photos/[id]">,
) {
  try {
    const photoId = Number((await ctx.params).id);
    if (!Number.isSafeInteger(photoId) || photoId < 1) {
      throw new PhotoError("NOT_FOUND", "Photo not found.");
    }
    const photo = await getPhoto(await getActor(), photoId);
    return new Response(Readable.toWeb(photo.stream) as ReadableStream, {
      headers: {
        "Content-Type": photo.contentType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Do not reveal that a photo exists to someone who may not see it.
    if (error instanceof PhotoError && error.code === "FORBIDDEN") {
      return photoErrorResponse(new PhotoError("NOT_FOUND", error.message))!;
    }
    const response = photoErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
