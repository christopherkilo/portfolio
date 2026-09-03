import { TestBed } from "@angular/core/testing";
import { ApplicationRef, provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { mapAttachment } from "../api/mappers";
import type { TaskAttachmentRow } from "../api/models";
import { AuthService } from "../auth/auth";
import { MutationQueueService } from "../offline/mutation-queue";
import { resetAngularOfflineMemory } from "../offline/queue-backend";
import { ActivityDataService } from "./activity-data";
import {
  ATTACHMENT_PUT,
  AttachmentMutationsService,
  isSafeDownloadUrl,
} from "./attachment-mutations";
import { AttachmentsDataService } from "./attachments-data";
import { validateAttachmentFile } from "./attachment-limits";
import { TaskHistoryDataService } from "./task-history-data";
import { WorkspaceContextService } from "./workspace-context";
import { stubAuth, stubWorkspaceContext } from "../../testing/data-stubs";

const row: TaskAttachmentRow = {
  id: "a1",
  workspace_id: "ws-1",
  task_id: "t1",
  uploaded_by: "user-1",
  storage_path: "ws-1/t1/a1/secret.pdf",
  file_name: "brief.pdf",
  mime_type: "application/pdf",
  size_bytes: 1200,
  status: "ready",
  created_at: "2026-09-01T12:00:00.000Z",
};

function pdfFile(name = "brief.pdf"): File {
  return new File(["hello"], name, { type: "application/pdf" });
}

describe("attachment mapping and validation", () => {
  it("omits storage_path from the UI model", () => {
    const mapped = mapAttachment(row);
    expect(mapped).toEqual({
      id: "a1",
      taskId: "t1",
      fileName: "brief.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1200,
      uploadedBy: "user-1",
      createdAt: "2026-09-01T12:00:00.000Z",
    });
    expect(mapped).not.toHaveProperty("storage_path");
    expect(JSON.stringify(mapped)).not.toContain("ws-1/t1");
  });

  it("rejects disallowed types even when the name looks safe", () => {
    expect(
      validateAttachmentFile({
        name: "note.exe",
        type: "application/x-msdownload",
        size: 10,
      }),
    ).toBe("That file type is not allowed.");
  });

  it("rejects MIME/extension mismatches", () => {
    expect(
      validateAttachmentFile({
        name: "note.exe",
        type: "application/pdf",
        size: 10,
      }),
    ).toBe("That file type is not allowed.");
  });

  it("rejects files over 10 MB", () => {
    expect(
      validateAttachmentFile({
        name: "huge.pdf",
        type: "application/pdf",
        size: 11 * 1024 * 1024,
      }),
    ).toBe("File must be 10 MB or smaller.");
  });

  it("rejects javascript download URLs", () => {
    expect(isSafeDownloadUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeDownloadUrl("https://example.supabase.co/storage/v1/object/sign/x")).toBe(
      true,
    );
  });
});

describe("AttachmentsDataService", () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AttachmentsDataService,
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("loads attachments only for the active task", async () => {
    const service = TestBed.inject(AttachmentsDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectNone(() => true);
    service.setActiveTask("t1");
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/taskflow/tasks/t1/attachments").flush({
      success: true,
      data: [row],
    });
    await Promise.resolve();
    expect(service.attachments()[0]?.fileName).toBe("brief.pdf");
  });
});

describe("AttachmentMutationsService", () => {
  let http: HttpTestingController;
  let service: AttachmentMutationsService;
  const put = vi.fn();
  const attachmentsReload = vi.fn();
  const activityReload = vi.fn();
  const historyReload = vi.fn();

  beforeEach(() => {
    put.mockReset();
    put.mockResolvedValue({ ok: true });
    attachmentsReload.mockReset();
    activityReload.mockReset();
    historyReload.mockReset();
    resetAngularOfflineMemory();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AttachmentMutationsService,
        MutationQueueService,
        { provide: ATTACHMENT_PUT, useValue: put },
        { provide: AuthService, useValue: stubAuth() },
        { provide: WorkspaceContextService, useValue: stubWorkspaceContext() },
        { provide: AttachmentsDataService, useValue: { reload: attachmentsReload } },
        { provide: ActivityDataService, useValue: { reload: activityReload } },
        { provide: TaskHistoryDataService, useValue: { reload: historyReload } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AttachmentMutationsService);
  });

  afterEach(() => {
    http.verify();
    vi.unstubAllGlobals();
  });

  it("initiates, PUTs the signed URL, completes, and reloads", async () => {
    const pending = service.upload("t1", pdfFile());
    const initiate = http.expectOne(
      "/api/taskflow/tasks/t1/attachments/initiate",
    );
    expect(initiate.request.body.fileName).toBe("brief.pdf");
    expect(initiate.request.body.mimeType).toBe("application/pdf");
    initiate.flush(
      {
        success: true,
        data: {
          attachment: row,
          upload: {
            signedUrl: "https://storage.example/upload",
            path: "should-not-be-used",
          },
        },
      },
      { status: 201, statusText: "Created" },
    );
    await Promise.resolve();
    await Promise.resolve();
    expect(put).toHaveBeenCalledWith(
      "https://storage.example/upload",
      expect.objectContaining({ method: "PUT" }),
    );
    const complete = http.expectOne(
      "/api/taskflow/tasks/t1/attachments/complete",
    );
    expect(complete.request.body).toEqual({ attachmentId: "a1" });
    expect(complete.request.body).not.toHaveProperty("storage_path");
    complete.flush({ success: true, data: row });
    await pending;
    expect(attachmentsReload).toHaveBeenCalled();
    expect(activityReload).toHaveBeenCalled();
  });

  it("does not complete when the signed PUT fails", async () => {
    put.mockResolvedValue({ ok: false });
    const pending = service.upload("t1", pdfFile());
    http.expectOne("/api/taskflow/tasks/t1/attachments/initiate").flush(
      {
        success: true,
        data: {
          attachment: row,
          upload: { signedUrl: "https://storage.example/upload" },
        },
      },
      { status: 201, statusText: "Created" },
    );
    await expect(pending).rejects.toMatchObject({ code: "UPLOAD_FAILED" });
    http.verify();
  });

  it("surfaces a server error from initiate", async () => {
    const pending = service.upload("t1", pdfFile());
    http.expectOne("/api/taskflow/tasks/t1/attachments/initiate").flush(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "not allowed", fieldErrors: {} },
      },
      { status: 403, statusText: "Forbidden" },
    );
    await expect(pending).rejects.toMatchObject({ status: 403 });
  });

  it("deletes online and reloads", async () => {
    const pending = service.delete("a1");
    const req = http.expectOne("/api/taskflow/attachments/a1");
    expect(req.request.method).toBe("DELETE");
    req.flush({ success: true, data: { id: "a1" } });
    await pending;
    expect(attachmentsReload).toHaveBeenCalled();
  });

  it("rejects offline upload and delete without queueing file bytes", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const queue = TestBed.inject(MutationQueueService);
    await expect(service.upload("t1", pdfFile())).rejects.toMatchObject({
      code: "OFFLINE_UNSAFE_ACTION",
    });
    await expect(service.delete("a1")).rejects.toMatchObject({
      code: "OFFLINE_UNSAFE_ACTION",
    });
    expect(queue.list()).toEqual([]);
    expect(JSON.stringify(queue.list())).not.toContain("hello");
  });
});
