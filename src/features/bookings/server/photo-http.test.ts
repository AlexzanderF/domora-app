import { describe, expect, it } from "vitest";
import { PhotoError } from "@/domain/photos";
import type { PhotoErrorCode } from "@/domain/photos";
import { photoErrorResponse } from "./photo-http";

async function bodyOf(response: Response) {
  return (await response.json()) as { error: string };
}

describe("photoErrorResponse", () => {
  const cases: [PhotoErrorCode, number, RegExp][] = [
    ["UNAUTHENTICATED", 401, /Влезте/],
    ["FORBIDDEN", 403, /право/],
    ["NOT_FOUND", 404, /не е намерен/],
    ["NO_FILES", 400, /поне една/],
    ["TOO_MANY_FILES", 400, /5 снимки/],
    ["FILE_TOO_LARGE", 413, /5 MB/],
    ["UPLOAD_TOO_LARGE", 413, /15 MB/],
    ["UNSUPPORTED_TYPE", 415, /JPEG, PNG или WebP/],
  ];

  it.each(cases)(
    "maps %s to HTTP %i with a Bulgarian message",
    async (code, status, message) => {
      const response = photoErrorResponse(new PhotoError(code, "internal"));

      expect(response?.status).toBe(status);
      expect((await bodyOf(response!)).error).toMatch(message);
    },
  );

  it("never sends the internal English message to the client", async () => {
    const response = photoErrorResponse(
      new PhotoError("FILE_TOO_LARGE", "A photo is too large."),
    );

    expect((await bodyOf(response!)).error).not.toContain("too large");
  });

  it("returns null for errors it does not own", () => {
    expect(photoErrorResponse(new Error("boom"))).toBeNull();
  });
});
