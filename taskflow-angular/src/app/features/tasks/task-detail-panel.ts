import { Component, input, output } from "@angular/core";
import type { Task, TaskPriority } from "../../core/api/models";
import { EntityPresenceLine } from "../../shared/ui/presence-avatars";
import { TaskAttachments } from "./task-attachments";
import { TaskComments } from "./task-comments";
import { TaskHistory } from "./task-history";

@Component({
  selector: "tf-task-detail-panel",
  imports: [EntityPresenceLine, TaskComments, TaskAttachments, TaskHistory],
  templateUrl: "./task-detail-panel.html",
  styleUrl: "./task-detail-panel.scss",
})
export class TaskDetailPanel {
  readonly task = input.required<Task>();
  readonly statusLabel = input("");
  readonly projectName = input("");
  readonly assigneeName = input("");
  readonly dueLabel = input("");
  readonly canEdit = input(false);
  readonly edit = output<void>();
  readonly archive = output<void>();
  readonly delete = output<void>();
  readonly close = output<void>();

  priorityClass(priority: TaskPriority): string {
    return `priority priority-${priority}`;
  }
}
