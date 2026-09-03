import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { userFacingLoadError } from "../../core/api/http-error";
import { userFacingMutationError } from "../../core/api/mutation-error";
import type { TaskflowNotification } from "../../core/api/models";
import { formatRelativeTime } from "../../core/data/dates";
import { notificationTaskId } from "../../core/data/notification-nav";
import { NotificationMutationsService } from "../../core/data/notification-mutations";
import { NotificationsDataService } from "../../core/data/notifications-data";
import { NetworkStatusService } from "../../core/realtime/network-status";

@Component({
  selector: "tf-notification-menu",
  templateUrl: "./notification-menu.html",
  styleUrl: "./notification-menu.scss",
})
export class NotificationMenu {
  readonly notifications = inject(NotificationsDataService);
  private readonly mutations = inject(NotificationMutationsService);
  private readonly router = inject(Router);
  readonly network = inject(NetworkStatusService);

  readonly open = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly marking = signal(false);
  readonly formatRelativeTime = formatRelativeTime;

  private readonly trigger =
    viewChild<ElementRef<HTMLButtonElement>>("trigger");
  private readonly panel = viewChild<ElementRef<HTMLElement>>("panel");

  readonly loadError = computed(() => {
    const error = this.notifications.error();
    return error ? userFacingLoadError(error) : null;
  });

  readonly triggerLabel = computed(() => {
    const count = this.notifications.unreadCount();
    return count
      ? `Notifications, ${count} unread`
      : "Notifications";
  });

  toggle(): void {
    this.open.update((value) => !value);
    this.actionError.set(null);
  }

  close(): void {
    this.open.set(false);
  }

  retry(): void {
    this.notifications.reload();
  }

  heading(item: TaskflowNotification): string {
    return item.occurrenceCount > 1
      ? `${item.occurrenceCount}× ${item.title}`
      : item.title;
  }

  async onItem(item: TaskflowNotification): Promise<void> {
    this.actionError.set(null);
    const taskId = notificationTaskId(item);
    if (!item.readAt) {
      try {
        await this.mutations.markRead(item.id);
      } catch (error) {
        this.actionError.set(userFacingMutationError(error).message);
        return;
      }
    }
    if (taskId) {
      this.close();
      await this.router.navigate(["/tasks"], { queryParams: { task: taskId } });
    }
  }

  async markAll(): Promise<void> {
    if (this.marking() || this.notifications.unreadCount() === 0) return;
    this.marking.set(true);
    this.actionError.set(null);
    try {
      await this.mutations.markAllRead();
    } catch (error) {
      this.actionError.set(userFacingMutationError(error).message);
    } finally {
      this.marking.set(false);
    }
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.open()) this.close();
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (!target) return;
    if (this.trigger()?.nativeElement.contains(target)) return;
    if (this.panel()?.nativeElement.contains(target)) return;
    this.close();
  }
}
