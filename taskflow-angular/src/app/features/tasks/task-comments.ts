import {
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { userFacingLoadError } from "../../core/api/http-error";
import { userFacingMutationError } from "../../core/api/mutation-error";
import type { CommentAuthor, CommentWithAuthor } from "../../core/api/models";
import { CommentMutationsService } from "../../core/data/comment-mutations";
import { CommentsDataService } from "../../core/data/comments-data";
import { formatRelativeTime } from "../../core/data/dates";
import { WorkspacePermissionsService } from "../../core/data/permissions";
import { NetworkStatusService } from "../../core/realtime/network-status";

const COMMENT_MAX = 4000;

@Component({
  selector: "tf-task-comments",
  imports: [ReactiveFormsModule],
  templateUrl: "./task-comments.html",
  styleUrl: "./task-comments.scss",
})
export class TaskComments {
  readonly comments = inject(CommentsDataService);
  readonly permissions = inject(WorkspacePermissionsService);
  private readonly mutations = inject(CommentMutationsService);
  readonly network = inject(NetworkStatusService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    body: ["", [Validators.required, Validators.maxLength(COMMENT_MAX)]],
  });
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly editBody = signal("");
  readonly editBusy = signal(false);

  readonly loadError = computed(() => {
    const error = this.comments.error();
    return error ? userFacingLoadError(error) : null;
  });

  readonly formatRelativeTime = formatRelativeTime;

  authorLabel(author: CommentAuthor | null | undefined): string {
    return author?.display_name?.trim() || author?.email?.trim() || "Member";
  }

  authorInitials(author: CommentAuthor | null | undefined): string {
    const source =
      author?.display_name?.trim() || author?.email?.trim() || "TF";
    const parts = source.split(/[\s@._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  }

  canManage(comment: CommentWithAuthor): boolean {
    return this.permissions.canManageComment(comment.author_id);
  }

  retry(): void {
    this.comments.reload();
  }

  startEdit(comment: CommentWithAuthor): void {
    this.editingId.set(comment.id);
    this.editBody.set(comment.body);
    this.submitError.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editBody.set("");
  }

  async submitNew(): Promise<void> {
    this.submitted.set(true);
    const taskId = this.comments.taskId();
    const body = this.form.controls.body.value.trim();
    if (!taskId || !body || this.submitting() || !this.permissions.canComment()) {
      return;
    }
    this.submitting.set(true);
    this.submitError.set(null);
    try {
      await this.mutations.create(taskId, body);
      this.form.reset({ body: "" });
      this.submitted.set(false);
    } catch (error) {
      this.submitError.set(userFacingMutationError(error).message);
    } finally {
      this.submitting.set(false);
    }
  }

  async submitEdit(commentId: string): Promise<void> {
    const body = this.editBody().trim();
    if (!body || this.editBusy()) return;
    this.editBusy.set(true);
    this.submitError.set(null);
    try {
      await this.mutations.update(commentId, body);
      this.cancelEdit();
    } catch (error) {
      this.submitError.set(userFacingMutationError(error).message);
    } finally {
      this.editBusy.set(false);
    }
  }

  async remove(commentId: string): Promise<void> {
    if (this.editBusy()) return;
    this.editBusy.set(true);
    this.submitError.set(null);
    try {
      await this.mutations.delete(commentId);
      if (this.editingId() === commentId) this.cancelEdit();
    } catch (error) {
      this.submitError.set(userFacingMutationError(error).message);
    } finally {
      this.editBusy.set(false);
    }
  }
}
