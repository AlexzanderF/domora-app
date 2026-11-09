import { PhotoError } from "@/domain/photos";
import type { PhotoErrorCode } from "@/domain/photos";

const RESPONSES: Record<PhotoErrorCode, { status: number; message: string }> = {
  UNAUTHENTICATED: {
    status: 401,
    message: "Влезте в профила си, за да продължите.",
  },
  FORBIDDEN: {
    status: 403,
    message: "Нямате право да добавяте снимки към тази заявка.",
  },
  NOT_FOUND: { status: 404, message: "Снимката или заявката не е намерена." },
  NO_FILES: { status: 400, message: "Изберете поне една снимка." },
  TOO_MANY_FILES: {
    status: 400,
    message: "Можете да добавите най-много 5 снимки към една заявка.",
  },
  FILE_TOO_LARGE: {
    status: 413,
    message: "Всяка снимка трябва да е до 5 MB.",
  },
  UPLOAD_TOO_LARGE: {
    status: 413,
    message: "Снимките трябва да са общо до 15 MB.",
  },
  UNSUPPORTED_TYPE: {
    status: 415,
    message: "Поддържат се само снимки във формат JPEG, PNG или WebP.",
  },
};

// The client-facing response for a domain rejection, or null when the error
// is not one of ours (let it surface as a 500).
export function photoErrorResponse(error: unknown): Response | null {
  if (!(error instanceof PhotoError)) return null;
  const { status, message } = RESPONSES[error.code];
  return Response.json({ error: message }, { status });
}
