import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { TaskflowApiError } from "../../core/api/envelope";
import { CommentMutationsService } from "../../core/data/comment-mutations";
import { CommentsDataService } from "../../core/data/comments-data";
import { WorkspacePermissionsService } from "../../core/data/permissions";
import { NetworkStatusService } from "../../core/realtime/network-status";
import {
  stubCommentMutations,
  stubComments,
  stubPermissions,
} from "../../testing/data-stubs";
import type { CommentWithAuthor } from "../../core/api/models";
import { TaskComments } from "./task-comments";

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

describe("TaskComments", () => {
  async function render(
    options: {
      comments?: ReturnType<typeof stubComments>;
      permissions?: ReturnType<typeof stubPermissions>;
      mutations?: ReturnType<typeof stubCommentMutations>;
      online?: boolean;
    } = {},
  ) {
    const comments = options.comments ?? stubComments({ comments: [comment], taskId: "t1" });
    comments.taskId.set("t1");
    const mutations = options.mutations ?? stubCommentMutations();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TaskComments],
      providers: [
        provideZonelessChangeDetection(),
        { provide: CommentsDataService, useValue: comments },
        { provide: CommentMutationsService, useValue: mutations },
        {
          provide: WorkspacePermissionsService,
          useValue: options.permissions ?? stubPermissions(),
        },
        {
          provide: NetworkStatusService,
          useValue: { online: signal(options.online ?? true) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TaskComments);
    fixture.detectChanges();
    return { fixture, comments, mutations };
  }

  it("renders loaded comments with author and timestamp", async () => {
    const { fixture } = await render();
    expect(fixture.nativeElement.textContent).toContain("Ship it");
    expect(fixture.nativeElement.textContent).toContain("Maya Chen");
  });

  it("shows an empty state", async () => {
    const { fixture } = await render({
      comments: stubComments({ comments: [], taskId: "t1" }),
    });
    expect(fixture.nativeElement.textContent).toContain("No comments yet");
  });

  it("shows error and retry", async () => {
    const comments = stubComments({ comments: [], taskId: "t1" });
    comments.error.set(new TaskflowApiError("nope", { status: 500, code: "INTERNAL_ERROR" }));
    comments.hasValue.set(false);
    const { fixture } = await render({ comments });
    expect(fixture.nativeElement.querySelector("[role='alert']")).toBeTruthy();
    fixture.nativeElement.querySelector("button")?.click();
    expect(comments.reload).toHaveBeenCalled();
  });

  it("validates empty create and does not submit", async () => {
    const { fixture, mutations } = await render({
      comments: stubComments({ comments: [], taskId: "t1" }),
    });
    await fixture.componentInstance.submitNew();
    expect(mutations.create).not.toHaveBeenCalled();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Enter a comment.");
  });

  it("successful create reloads via the mutation service and clears the draft", async () => {
    const { fixture, mutations } = await render({
      comments: stubComments({ comments: [], taskId: "t1" }),
    });
    fixture.componentInstance.form.controls.body.setValue("Hello team");
    await fixture.componentInstance.submitNew();
    expect(mutations.create).toHaveBeenCalledWith("t1", "Hello team");
    expect(fixture.componentInstance.form.controls.body.value).toBe("");
  });

  it("failed create preserves the draft", async () => {
    const mutations = stubCommentMutations();
    mutations.create.mockRejectedValue(
      new TaskflowApiError("server down", { status: 500, code: "INTERNAL_ERROR" }),
    );
    const { fixture } = await render({
      comments: stubComments({ comments: [], taskId: "t1" }),
      mutations,
    });
    fixture.componentInstance.form.controls.body.setValue("Keep me");
    await fixture.componentInstance.submitNew();
    expect(fixture.componentInstance.form.controls.body.value).toBe("Keep me");
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("server down");
  });

  it("hides the composer for viewers", async () => {
    const { fixture } = await render({
      permissions: stubPermissions({ role: "viewer", userId: "viewer-1" }),
    });
    expect(fixture.nativeElement.textContent).toContain(
      "Viewers can read comments but cannot post.",
    );
    expect(fixture.nativeElement.querySelector("textarea")).toBeNull();
  });

  it("blocks duplicate submits while posting", async () => {
    const mutations = stubCommentMutations();
    let resolveCreate: (value: unknown) => void = () => undefined;
    mutations.create.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    const { fixture } = await render({
      comments: stubComments({ comments: [], taskId: "t1" }),
      mutations,
    });
    fixture.componentInstance.form.controls.body.setValue("Once");
    const first = fixture.componentInstance.submitNew();
    const second = fixture.componentInstance.submitNew();
    resolveCreate({});
    await Promise.all([first, second]);
    expect(mutations.create).toHaveBeenCalledTimes(1);
  });
});
