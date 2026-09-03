import { Component, computed, inject, signal, viewChild, ElementRef } from "@angular/core";
import { userFacingLoadError } from "../../core/api/http-error";
import { userFacingMutationError } from "../../core/api/mutation-error";
import {
  ATTACHMENT_ACCEPT,
  formatBytes,
} from "../../core/data/attachment-limits";
import { AttachmentMutationsService } from "../../core/data/attachment-mutations";
import { AttachmentsDataService } from "../../core/data/attachments-data";
import { formatRelativeTime } from "../../core/data/dates";
import { WorkspacePermissionsService } from "../../core/data/permissions";
import { findMember } from "../../core/data/read-model";
import { WorkspaceReadsService } from "../../core/data/workspace-reads";
import { NetworkStatusService } from "../../core/realtime/network-status";

@Component({
  selector: "tf-task-attachments",
  templateUrl: "./task-attachments.html",
  styleUrl: "./task-attachments.scss",
})
export class TaskAttachments {
  readonly attachments = inject(AttachmentsDataService);
  readonly permissions = inject(WorkspacePermissionsService);
  readonly network = inject(NetworkStatusService);
  private readonly mutations = inject(AttachmentMutationsService);
  private readonly reads = inject(WorkspaceReadsService);

  readonly accept = ATTACHMENT_ACCEPT;
  readonly formatBytes = formatBytes;
  readonly formatRelativeTime = formatRelativeTime;
  readonly uploading = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedName = signal<string | null>(null);

  private readonly fileInput =
    viewChild<ElementRef<HTMLInputElement>>("fileInput");

  readonly loadError = computed(() => {
    const error = this.attachments.error();
    return error ? userFacingLoadError(error) : null;
  });

  readonly offline = computed(() => this.network.online() === false);

  uploaderName(userId: string): string {
    return findMember(this.reads.members.members(), userId)?.name ?? "Member";
  }

  retry(): void {
    this.attachments.reload();
  }

  openPicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    const taskId = this.attachments.taskId();
    if (!file || !taskId || this.uploading()) return;
    this.selectedName.set(file.name);
    this.errorMessage.set(null);
    this.uploading.set(true);
    try {
      await this.mutations.upload(taskId, file);
      this.selectedName.set(null);
    } catch (error) {
      this.errorMessage.set(userFacingMutationError(error).message);
    } finally {
      this.uploading.set(false);
    }
  }

  async download(id: string): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.mutations.download(id);
    } catch (error) {
      this.errorMessage.set(userFacingMutationError(error).message);
    }
  }

  async remove(id: string): Promise<void> {
    if (this.deletingId()) return;
    this.deletingId.set(id);
    this.errorMessage.set(null);
    try {
      await this.mutations.delete(id);
    } catch (error) {
      this.errorMessage.set(userFacingMutationError(error).message);
    } finally {
      this.deletingId.set(null);
    }
  }
}
