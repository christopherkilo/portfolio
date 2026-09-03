import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom, map } from "rxjs";
import {
  type ApiFailure,
  type ApiSuccess,
  TaskflowApiError,
  unwrapTaskflowEnvelope,
} from "../api/envelope";
import { catchTaskflowHttp } from "../api/http-rx";
import type { CommentWithAuthor } from "../api/models";
import { assertOnlineForUnsafeAction } from "../offline/offline-unsafe";
import { ActivityDataService } from "./activity-data";
import { CommentsDataService } from "./comments-data";
import { TaskHistoryDataService } from "./task-history-data";

const COMMENT_MAX = 4000;

@Injectable({ providedIn: "root" })
export class CommentMutationsService {
  private readonly http = inject(HttpClient);
  private readonly comments = inject(CommentsDataService);
  private readonly activity = inject(ActivityDataService);
  private readonly history = inject(TaskHistoryDataService);

  async create(taskId: string, body: string): Promise<CommentWithAuthor> {
    assertOnlineForUnsafeAction("comment_create");
    const trimmed = body.trim();
    if (!trimmed) {
      throw new TaskflowApiError("Enter a comment.", {
        status: 400,
        code: "VALIDATION_ERROR",
      });
    }
    if (trimmed.length > COMMENT_MAX) {
      throw new TaskflowApiError("Enter a comment.", {
        status: 400,
        code: "VALIDATION_ERROR",
      });
    }
    const row = await firstValueFrom(
      this.http
        .post<ApiSuccess<CommentWithAuthor> | ApiFailure>(
          `/api/taskflow/tasks/${taskId}/comments`,
          { body: trimmed },
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 201)),
          catchTaskflowHttp(),
        ),
    );
    this.reloadAfterWrite();
    return row;
  }

  async update(commentId: string, body: string): Promise<CommentWithAuthor> {
    assertOnlineForUnsafeAction("comment_update");
    const trimmed = body.trim();
    if (!trimmed) {
      throw new TaskflowApiError("Enter a comment.", {
        status: 400,
        code: "VALIDATION_ERROR",
      });
    }
    const row = await firstValueFrom(
      this.http
        .patch<ApiSuccess<CommentWithAuthor> | ApiFailure>(
          `/api/taskflow/comments/${commentId}`,
          { body: trimmed },
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    this.reloadAfterWrite();
    return row;
  }

  async delete(commentId: string): Promise<void> {
    assertOnlineForUnsafeAction("comment_delete");
    await firstValueFrom(
      this.http
        .delete<ApiSuccess<unknown> | ApiFailure>(
          `/api/taskflow/comments/${commentId}`,
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    this.reloadAfterWrite();
  }

  private reloadAfterWrite(): void {
    this.comments.reload();
    this.activity.reload();
    this.history.reload();
  }
}
