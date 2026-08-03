/** Client-side attachment limits (server enforces the same). */
export const MAX_ATTACHMENT_BYTES_CLIENT = 10 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIME_CLIENT = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
]);
