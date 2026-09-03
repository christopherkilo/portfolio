import { DOCUMENT } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Injectable, InjectionToken, inject } from "@angular/core";
import { firstValueFrom, map } from "rxjs";
import {
  type ApiFailure,
  type ApiSuccess,
  TaskflowApiError,
  unwrapTaskflowEnvelope,
} from "../api/envelope";
import { catchTaskflowHttp } from "../api/http-rx";
import { mapAttachment } from "../api/mappers";
import type { TaskAttachment, TaskAttachmentRow } from "../api/models";
import { assertOnlineForUnsafeAction } from "../offline/offline-unsafe";
import { ActivityDataService } from "./activity-data";
import { validateAttachmentFile } from "./attachment-limits";
import { AttachmentsDataService } from "./attachments-data";
import { TaskHistoryDataService } from "./task-history-data";

export const ATTACHMENT_PUT = new InjectionToken<typeof fetch>(
  "tf.attachmentPut",
  {
    factory: () => globalThis.fetch.bind(globalThis),
  },
);

type InitiateResponse = {
  attachment: TaskAttachmentRow;
  upload: { signedUrl: string; path?: string; token?: string };
};

@Injectable({ providedIn: "root" })
export class AttachmentMutationsService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly put = inject(ATTACHMENT_PUT);
  private readonly attachments = inject(AttachmentsDataService);
  private readonly activity = inject(ActivityDataService);
  private readonly history = inject(TaskHistoryDataService);

  async upload(taskId: string, file: File): Promise<TaskAttachment> {
    assertOnlineForUnsafeAction("attachment_upload");
    const invalid = validateAttachmentFile(file);
    if (invalid) {
      throw new TaskflowApiError(invalid, {
        status: 400,
        code: "VALIDATION_ERROR",
      });
    }
    const initiated = await firstValueFrom(
      this.http
        .post<ApiSuccess<InitiateResponse> | ApiFailure>(
          `/api/taskflow/tasks/${taskId}/attachments/initiate`,
          {
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          },
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 201)),
          catchTaskflowHttp(),
        ),
    );

    const signedUrl = initiated.upload.signedUrl;
    const putResponse = await this.put(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: file,
    });
    if (!putResponse.ok) {
      throw new TaskflowApiError("Upload failed. Try again.", {
        status: 502,
        code: "UPLOAD_FAILED",
      });
    }

    const row = await firstValueFrom(
      this.http
        .post<ApiSuccess<TaskAttachmentRow> | ApiFailure>(
          `/api/taskflow/tasks/${taskId}/attachments/complete`,
          { attachmentId: initiated.attachment.id },
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    this.reloadAfterWrite();
    return mapAttachment(row);
  }

  async delete(attachmentId: string): Promise<void> {
    assertOnlineForUnsafeAction("attachment_delete");
    await firstValueFrom(
      this.http
        .delete<ApiSuccess<unknown> | ApiFailure>(
          `/api/taskflow/attachments/${attachmentId}`,
        )
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    this.reloadAfterWrite();
  }

  async download(attachmentId: string): Promise<void> {
    const result = await firstValueFrom(
      this.http
        .get<
          | ApiSuccess<{ url: string; fileName: string; expiresInSeconds: number }>
          | ApiFailure
        >(`/api/taskflow/attachments/${attachmentId}/download`)
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    if (!isSafeDownloadUrl(result.url)) {
      throw new TaskflowApiError("Couldn’t open that file.", {
        status: 400,
        code: "VALIDATION_ERROR",
      });
    }
    this.document.defaultView?.open(result.url, "_blank", "noopener,noreferrer");
  }

  private reloadAfterWrite(): void {
    this.attachments.reload();
    this.activity.reload();
    this.history.reload();
  }
}

export function isSafeDownloadUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
