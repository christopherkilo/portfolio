import { TestBed } from "@angular/core/testing";
import { ApplicationRef, provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { CommentsDataService } from "./comments-data";
import { CommentMutationsService } from "./comment-mutations";
import { ActivityDataService } from "./activity-data";
import { TaskHistoryDataService } from "./task-history-data";
import { MutationQueueService } from "../offline/mutation-queue";
import { resetAngularOfflineMemory } from "../offline/queue-backend";
import type { CommentWithAuthor } from "../api/models";
import { stubAuth, stubWorkspaceContext } from "../../testing/data-stubs";
import { AuthService } from "../auth/auth";
import { WorkspaceContextService } from "./workspace-context";

const comment: CommentWithAuthor = {
  id: "c1",
  workspace_id: "ws-1",
  task_id: "t1",
  author_id: "user-1",
  body: "Ship it",
  created_at: "2026-09-01T12:00:00.000Z",
  updated_at: "2026-09-01T12:00:00.000Z",
  deleted_at: null,
  author: {
    id: "user-1",
    email: "maya@example.com",
    display_name: "Maya Chen",
    avatar_url: null,
  },
};

describe("CommentsDataService", () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        CommentsDataService,
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("does not fetch until a task is selected", () => {
    TestBed.inject(CommentsDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectNone(() => true);
  });

  it("loads comments for the active task", async () => {
    const service = TestBed.inject(CommentsDataService);
    service.setActiveTask("t1");
    TestBed.inject(ApplicationRef).tick();
    const req = http.expectOne("/api/taskflow/tasks/t1/comments");
    req.flush({ success: true, data: [comment] });
    await Promise.resolve();
    expect(service.comments()[0]?.body).toBe("Ship it");
  });

  it("treats an empty list as empty", async () => {
    const service = TestBed.inject(CommentsDataService);
    service.setActiveTask("t1");
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/taskflow/tasks/t1/comments").flush({
      success: true,
      data: [],
    });
    await Promise.resolve();
    expect(service.comments()).toEqual([]);
  });

  it("surfaces an error so retry can reload", async () => {
    const service = TestBed.inject(CommentsDataService);
    service.setActiveTask("t1");
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/taskflow/tasks/t1/comments").flush(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "nope", fieldErrors: {} },
      },
      { status: 500, statusText: "Server Error" },
    );
    await Promise.resolve();
    expect(service.error()).toBeTruthy();
    service.reload();
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/taskflow/tasks/t1/comments").flush({
      success: true,
      data: [],
    });
  });
});

describe("CommentMutationsService", () => {
  let http: HttpTestingController;
  let service: CommentMutationsService;
  const commentsReload = vi.fn();
  const activityReload = vi.fn();
  const historyReload = vi.fn();

  beforeEach(() => {
    commentsReload.mockReset();
    activityReload.mockReset();
    historyReload.mockReset();
    resetAngularOfflineMemory();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        CommentMutationsService,
        MutationQueueService,
        { provide: AuthService, useValue: stubAuth() },
        { provide: WorkspaceContextService, useValue: stubWorkspaceContext() },
        { provide: CommentsDataService, useValue: { reload: commentsReload } },
        { provide: ActivityDataService, useValue: { reload: activityReload } },
        { provide: TaskHistoryDataService, useValue: { reload: historyReload } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(CommentMutationsService);
  });

  afterEach(() => {
    http.verify();
    vi.unstubAllGlobals();
  });

  it("POSTs a trimmed body and reloads comments plus activity", async () => {
    const pending = service.create("t1", "  Hello  ");
    const req = http.expectOne("/api/taskflow/tasks/t1/comments");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ body: "Hello" });
    req.flush({ success: true, data: comment }, { status: 201, statusText: "Created" });
    await pending;
    expect(commentsReload).toHaveBeenCalledTimes(1);
    expect(activityReload).toHaveBeenCalledTimes(1);
    expect(historyReload).toHaveBeenCalledTimes(1);
  });

  it("rejects empty comments before HTTP", async () => {
    await expect(service.create("t1", "   ")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    http.verify();
  });

  it("keeps comments online-only", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const queue = TestBed.inject(MutationQueueService);
    await expect(service.create("t1", "Hello")).rejects.toMatchObject({
      code: "OFFLINE_UNSAFE_ACTION",
    });
    expect(queue.list()).toEqual([]);
  });
});
