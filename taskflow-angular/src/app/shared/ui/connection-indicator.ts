import { Component, computed, inject } from "@angular/core";
import { ConflictResolutionService } from "../../core/conflict/conflict-resolution";
import { MutationQueueService } from "../../core/offline/mutation-queue";
import { RealtimeService } from "../../core/realtime/realtime";
import { NetworkStatusService } from "../../core/realtime/network-status";
import { displayConnectionStatus } from "../../core/realtime/connection-status";

@Component({
  selector: "tf-connection-indicator",
  template: `
    <div
      class="status"
      role="status"
      aria-live="polite"
      [attr.title]="titleText()"
      [attr.aria-label]="titleText()"
    >
      <span class="dot" [attr.data-state]="visualState()" aria-hidden="true"></span>
      <span class="label">{{ label() }}</span>
      @if (pendingText(); as pending) {
        <span class="extra">· {{ pending }}</span>
      }
      @if (attentionText(); as attention) {
        <span class="attention">· {{ attention }}</span>
      }
      @if (canReview()) {
        <button type="button" class="review" (click)="openConflicts()">
          Review
        </button>
      }
    </div>
  `,
  styles: `
    .status {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      color: var(--tf-muted);
      white-space: nowrap;
    }
    .dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 999px;
      background: var(--tf-danger);
    }
    .dot[data-state="online"] {
      background: #10b981;
    }
    .dot[data-state="pending"] {
      background: #fbbf24;
    }
    .label,
    .extra,
    .attention {
      display: none;
    }
    .attention {
      color: #d97706;
    }
    .review {
      height: 1.5rem;
      border: 1px solid var(--tf-border);
      border-radius: 999px;
      background: var(--tf-surface);
      color: var(--tf-ink);
      padding: 0 0.5rem;
      font-size: 0.6875rem;
      font-weight: 600;
      cursor: pointer;
    }
    @media (min-width: 40rem) {
      .label {
        display: inline;
      }
    }
    @media (min-width: 48rem) {
      .extra,
      .attention {
        display: inline;
      }
    }
  `,
})
export class ConnectionIndicator {
  private readonly realtime = inject(RealtimeService);
  private readonly network = inject(NetworkStatusService);
  private readonly queue = inject(MutationQueueService);
  private readonly conflicts = inject(ConflictResolutionService);

  readonly label = computed(() => {
    if (this.network.online() === false) return "Offline";
    return displayConnectionStatus(this.realtime.connectionStatus());
  });

  readonly pendingText = computed(() => {
    const pending = this.queue.pendingCount();
    return pending > 0 ? `${pending} pending` : null;
  });

  readonly attentionText = computed(() => {
    const conflicted = this.queue.conflictedCount();
    const failed = this.queue.failedCount();
    if (conflicted > 0) {
      return conflicted === 1
        ? "1 offline change needs conflict resolution."
        : `${conflicted} offline changes need conflict resolution.`;
    }
    if (this.conflicts.session()) {
      return "Unsaved conflict to review";
    }
    if (failed > 0) {
      return `${failed} need attention`;
    }
    return null;
  });

  readonly titleText = computed(() =>
    [this.label(), this.pendingText(), this.attentionText()]
      .filter(Boolean)
      .join(" · "),
  );

  visualState(): "online" | "pending" | "offline" {
    if (this.network.online() === false) return "offline";
    const status = this.realtime.connectionStatus();
    if (status === "online" || status === "connected") return "online";
    if (status === "reconnecting" || status === "connecting") return "pending";
    return "offline";
  }

  canReview(): boolean {
    return Boolean(this.conflicts.session()) || this.queue.conflictedCount() > 0;
  }

  openConflicts(): void {
    if (this.conflicts.session()) {
      this.conflicts.showDialog();
      return;
    }
    this.conflicts.openNextQueueConflict();
  }
}
