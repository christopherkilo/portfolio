import { describe, expect, it } from "vitest";
import {
  AttachmentTooLargeError,
  AttachmentTypeNotAllowedError,
  AuditAccessDeniedError,
  OfflineUnsafeActionError,
  StaleVersionError,
} from "@/server/taskflow/errors";
import { handleTaskflowRouteError } from "@/server/taskflow/errors/http";

describe("TaskFlow Phase 3 errors", () => {
  it("maps StaleVersionError to 409 with latest payload", async () => {
    const latest = { id: "t1", version: 9 };
    const error = new StaleVersionError(latest);
    expect(error.status).toBe(409);
    expect(error.code).toBe("STALE_VERSION");

    const response = handleTaskflowRouteError(error);
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error.code).toBe("STALE_VERSION");
    expect(body.data.latest).toEqual(latest);
  });

  it("maps AttachmentTooLargeError to 413", () => {
    const error = new AttachmentTooLargeError();
    expect(error.status).toBe(413);
    expect(error.code).toBe("ATTACHMENT_TOO_LARGE");
    expect(handleTaskflowRouteError(error).status).toBe(413);
  });

  it("maps AttachmentTypeNotAllowedError to 415", () => {
    const error = new AttachmentTypeNotAllowedError();
    expect(error.status).toBe(415);
    expect(error.code).toBe("ATTACHMENT_TYPE_NOT_ALLOWED");
    expect(handleTaskflowRouteError(error).status).toBe(415);
  });

  it("maps AuditAccessDeniedError to 403", () => {
    const error = new AuditAccessDeniedError();
    expect(error.status).toBe(403);
    expect(error.code).toBe("AUDIT_ACCESS_DENIED");
    expect(handleTaskflowRouteError(error).status).toBe(403);
  });

  it("maps OfflineUnsafeActionError to 503", () => {
    const error = new OfflineUnsafeActionError();
    expect(error.status).toBe(503);
    expect(error.code).toBe("OFFLINE_UNSAFE_ACTION");
    expect(handleTaskflowRouteError(error).status).toBe(503);
  });
});
