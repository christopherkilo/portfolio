import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom, map } from "rxjs";
import {
  type ApiFailure,
  type ApiSuccess,
  unwrapTaskflowEnvelope,
} from "../api/envelope";
import { catchTaskflowHttp, isStaleVersionError } from "../api/http-rx";
import { mapTask } from "../api/mappers";
import type { Task, TaskRow, TaskStatus } from "../api/models";
import { AuthService } from "../auth/auth";
import { MutationQueueService } from "../offline/mutation-queue";
import { assertOnlineForUnsafeAction } from "../offline/offline-unsafe";
import { taskQueueType } from "../offline/policy";
import {
  assigneeListsDiffer,
  isBrowserOffline,
  isTransportFailure,
} from "../offline/transport";
import { WorkspaceContextService } from "./workspace-context";
import type { TaskWriteBody } from "./task-form";
import { ActivityDataService } from "./activity-data";
import { TasksDataService } from "./tasks-data";

export type TaskMutationResult = Task | "queued";

function latestTask(error: unknown): Task | null {
  if (!isStaleVersionError(error) || !error.data?.latest) return null;
  const latest = error.data.latest;
  if (typeof latest !== "object" || latest === null) return null;
  if ("project_id" in latest) return mapTask(latest as TaskRow);
  return latest as Task;
}

@Injectable({ providedIn: "root" })
export class TaskMutationsService {
  private readonly http = inject(HttpClient);
  private readonly tasks = inject(TasksDataService);
  private readonly activity = inject(ActivityDataService);
  private readonly auth = inject(AuthService);
  private readonly workspace = inject(WorkspaceContextService);
  private readonly queue = inject(MutationQueueService);

  async create(
    body: TaskWriteBody & { workspaceId: string },
    extraAssigneeIds: string[] = [],
  ): Promise<Task> {
    assertOnlineForUnsafeAction("task_create");
    const row = await this.post<TaskRow>("/api/tasks", body);
    const created = mapTask(row);
    const extras = extraAssigneeIds.filter((id) => id && id !== body.assigneeId);
    if (extras.length) {
      await Promise.all(extras.map((userId) => this.assign(created.id, userId)));
    }
    this.reloadAfterTaskWrite();
    return created;
  }

  /**
   * Reviewed conflict resolution. Never queues, never retries 409.
   * Caller must pass expectedVersion = latest reviewed server version.
   */
  async updateResolved(
    id: string,
    expectedVersion: number,
    body: TaskWriteBody,
    assigneeSync?: { previousIds: string[]; nextIds: string[] },
    extra?: { archived?: boolean },
  ): Promise<Task> {
    const payload: Record<string, unknown> = { ...body, expectedVersion };
    if (extra?.archived !== undefined) payload["archived"] = extra.archived;
    const row = await this.patchTask(id, payload);
    if (assigneeSync) {
      await this.syncAssignees(
        id,
        assigneeSync.previousIds,
        assigneeSync.nextIds,
      );
    }
    this.reloadAfterTaskWrite();
    return mapTask(row);
  }

  async update(
    id: string,
    expectedVersion: number,
    body: TaskWriteBody,
    assigneeSync?: { previousIds: string[]; nextIds: string[] },
  ): Promise<TaskMutationResult> {
    if (
      assigneeSync &&
      assigneeListsDiffer(assigneeSync.previousIds, assigneeSync.nextIds)
    ) {
      assertOnlineForUnsafeAction("task_assign");
    }
    const queued = await this.patchTaskOrQueue(id, {
      ...body,
      expectedVersion,
    });
    if (queued === "queued") return "queued";
    if (assigneeSync) {
      await this.syncAssignees(
        id,
        assigneeSync.previousIds,
        assigneeSync.nextIds,
      );
    }
    this.reloadAfterTaskWrite();
    return mapTask(queued);
  }

  async changeStatus(
    id: string,
    expectedVersion: number,
    status: TaskStatus,
  ): Promise<TaskMutationResult> {
    const queued = await this.patchTaskOrQueue(id, {
      status,
      expectedVersion,
    });
    if (queued === "queued") return "queued";
    this.reloadAfterTaskWrite();
    return mapTask(queued);
  }

  async archive(
    id: string,
    expectedVersion: number,
  ): Promise<TaskMutationResult> {
    const queued = await this.patchTaskOrQueue(id, {
      archived: true,
      expectedVersion,
    });
    if (queued === "queued") return "queued";
    this.reloadAfterTaskWrite();
    return mapTask(queued);
  }

  async delete(id: string): Promise<void> {
    assertOnlineForUnsafeAction("destructive_delete");
    await this.del(`/api/tasks/${id}`);
    this.reloadAfterTaskWrite();
  }

  async assign(taskId: string, userId: string): Promise<void> {
    assertOnlineForUnsafeAction("task_assign");
    await this.post(`/api/taskflow/tasks/${taskId}/assignees`, { userId });
  }

  async unassign(taskId: string, userId: string): Promise<void> {
    assertOnlineForUnsafeAction("task_assign");
    await this.del(`/api/taskflow/tasks/${taskId}/assignees/${userId}`);
  }

  async syncAssignees(
    taskId: string,
    previousIds: string[],
    nextIds: string[],
  ): Promise<void> {
    const prev = new Set(previousIds);
    const toAdd = nextIds.filter((id) => !prev.has(id));
    const toRemove = previousIds.filter((id) => !nextIds.includes(id));
    await Promise.all([
      ...toAdd.map((userId) => this.assign(taskId, userId)),
      ...toRemove.map((userId) => this.unassign(taskId, userId)),
    ]);
  }

  latestFromError(error: unknown): Task | null {
    return latestTask(error);
  }

  private reloadAfterTaskWrite(): void {
    this.tasks.reload();
    this.activity.reload();
  }

  private async patchTaskOrQueue(
    id: string,
    body: Record<string, unknown>,
  ): Promise<TaskRow | "queued"> {
    const expectedVersion = body["expectedVersion"];
    const payload = { ...body };
    delete payload["expectedVersion"];
    if (isBrowserOffline()) {
      await this.enqueuePatch(id, payload, expectedVersion);
      return "queued";
    }
    try {
      return await this.patchTask(id, body);
    } catch (error) {
      if (isTransportFailure(error)) {
        await this.enqueuePatch(id, payload, expectedVersion);
        return "queued";
      }
      throw error;
    }
  }

  private async enqueuePatch(
    id: string,
    payload: Record<string, unknown>,
    expectedVersion: unknown,
  ): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    const workspaceId = this.workspace.currentWorkspaceId();
    if (!userId || !workspaceId) {
      throw new Error("Cannot queue a mutation without an authenticated workspace.");
    }
    await this.queue.enqueue({
      type: taskQueueType(payload),
      userId,
      workspaceId,
      entityId: id,
      payload,
      expectedVersion:
        typeof expectedVersion === "number" ? expectedVersion : undefined,
    });
  }

  private post<T>(url: string, body: unknown): Promise<T> {
    return firstValueFrom(
      this.http.post<ApiSuccess<T> | ApiFailure>(url, body).pipe(
        map((payload) => unwrapTaskflowEnvelope(payload, 201)),
        catchTaskflowHttp(),
      ),
    );
  }

  private patchTask(id: string, body: Record<string, unknown>): Promise<TaskRow> {
    return firstValueFrom(
      this.http
        .patch<ApiSuccess<TaskRow> | ApiFailure>(`/api/tasks/${id}`, body)
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
  }

  private del(url: string): Promise<unknown> {
    return firstValueFrom(
      this.http.delete<ApiSuccess<unknown> | ApiFailure>(url).pipe(
        map((payload) => unwrapTaskflowEnvelope(payload, 200)),
        catchTaskflowHttp(),
      ),
    );
  }
}
