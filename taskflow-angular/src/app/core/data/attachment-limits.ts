/** Client UX limits. Server remains authoritative. */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

const EXTENSIONS_BY_MIME: Record<string, readonly string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
};

export const ATTACHMENT_ACCEPT =
  "image/png,image/jpeg,image/webp,application/pdf,text/plain";

export function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0 || dot === fileName.length - 1) return "";
  return fileName.slice(dot).toLowerCase();
}

export function validateAttachmentFile(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return "File must be 10 MB or smaller.";
  }
  if (!ALLOWED_ATTACHMENT_MIME.has(file.type)) {
    return "That file type is not allowed.";
  }
  const ext = fileExtension(file.name);
  const allowed = EXTENSIONS_BY_MIME[file.type] ?? [];
  if (ext && !allowed.includes(ext)) {
    return "That file type is not allowed.";
  }
  return null;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
