// Pure constants, shared by the server rules and the booking dialog.

export const MAX_PHOTOS_PER_REQUEST = 5;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
// The browser downscales to about this before uploading; the server also
// bounds stored photos to it.
export const MAX_PHOTO_DIMENSION = 1600;

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number];

// Ceiling on the whole multipart body, photos plus form overhead. Keep in sync
// with `request_body max_size` (16MiB) in caddy/Caddyfile.
export const MAX_BODY_BYTES = 16 * 1024 * 1024;
