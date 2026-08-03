import { describe, expect, it } from "vitest";
import {
  ALLOWED_ATTACHMENT_MIME,
  ATTACHMENT_BUCKET,
  MAX_ATTACHMENT_BYTES,
} from "@/server/taskflow/services/attachmentService";
import {
  ALLOWED_ATTACHMENT_MIME_CLIENT,
  MAX_ATTACHMENT_BYTES_CLIENT,
} from "@/lib/demos/taskflow/attachments/limits";

describe("TaskFlow attachment limits", () => {
  it("caps uploads at 10 MB", () => {
    expect(MAX_ATTACHMENT_BYTES).toBe(10 * 1024 * 1024);
    expect(MAX_ATTACHMENT_BYTES_CLIENT).toBe(MAX_ATTACHMENT_BYTES);
  });

  it("allowlists MIME types and uses a private bucket name", () => {
    expect(ATTACHMENT_BUCKET).toBe("taskflow-attachments");
    expect([...ALLOWED_ATTACHMENT_MIME].sort()).toEqual(
      [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "text/plain",
      ].sort(),
    );
    expect([...ALLOWED_ATTACHMENT_MIME_CLIENT].sort()).toEqual(
      [...ALLOWED_ATTACHMENT_MIME].sort(),
    );
    expect(ALLOWED_ATTACHMENT_MIME.has("application/zip")).toBe(false);
    expect(ALLOWED_ATTACHMENT_MIME.has("image/svg+xml")).toBe(false);
  });
});
