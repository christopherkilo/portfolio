import { Component, computed, inject, input } from "@angular/core";
import { AuthService } from "../../core/auth/auth";
import { RealtimeService } from "../../core/realtime/realtime";
import type { PresenceUser } from "../../core/realtime/presence";

@Component({
  selector: "tf-presence-avatars",
  template: `
    @if (visible().length) {
      <div class="row" [attr.aria-label]="groupLabel()">
        @for (user of visible(); track user.userId) {
          <span
            class="avatar"
            [class.self]="user.userId === meId()"
            [attr.title]="tooltip(user)"
            [attr.aria-label]="tooltip(user)"
          >
            {{ initials(user.displayName) }}
          </span>
        }
        @if (overflow() > 0) {
          <span class="more">+{{ overflow() }}</span>
        }
      </div>
    }
  `,
  styles: `
    .row {
      display: flex;
      align-items: center;
    }
    .avatar {
      display: inline-flex;
      width: 1.75rem;
      height: 1.75rem;
      margin-left: -0.35rem;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--tf-surface);
      border-radius: 999px;
      background: color-mix(in srgb, var(--tf-accent) 20%, transparent);
      color: var(--tf-ink);
      font-size: 0.625rem;
      font-weight: 600;
    }
    .avatar:first-child {
      margin-left: 0;
    }
    .avatar.self {
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--tf-accent) 40%, transparent);
    }
    .more {
      padding-left: 0.4rem;
      font-size: 0.6875rem;
      color: var(--tf-muted);
    }
  `,
})
export class PresenceAvatars {
  private readonly realtime = inject(RealtimeService);
  private readonly auth = inject(AuthService);

  readonly max = input(5);
  readonly entityId = input<string | null>(null);

  readonly meId = computed(() => this.auth.currentUser()?.id ?? null);

  readonly visible = computed(() => {
    const entityId = this.entityId();
    const users = this.realtime.presenceUsers();
    const scoped = entityId
      ? users.filter((user) => user.currentEntityId === entityId)
      : users;
    return scoped.slice(0, this.max());
  });

  readonly overflow = computed(() => {
    if (this.entityId()) return 0;
    return Math.max(0, this.realtime.presenceUsers().length - this.max());
  });

  groupLabel(): string {
    const names = this.visible().map((user) => user.displayName).join(", ");
    if (this.entityId()) {
      return `${names} viewing this task`;
    }
    return `${this.visible().length} online in workspace`;
  }

  tooltip(user: PresenceUser): string {
    return user.currentView
      ? `${user.displayName} · ${user.currentView}`
      : user.displayName;
  }

  initials(name: string): string {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "TF";
  }
}

@Component({
  selector: "tf-entity-presence",
  template: `
    @if (label(); as text) {
      <p class="line">{{ text }}</p>
    }
  `,
  styles: `
    .line {
      margin: 0 0 0.75rem;
      font-size: 0.75rem;
      color: var(--tf-muted);
    }
  `,
})
export class EntityPresenceLine {
  private readonly realtime = inject(RealtimeService);
  private readonly auth = inject(AuthService);
  readonly entityId = input.required<string>();

  readonly label = computed(() => {
    const meId = this.auth.currentUser()?.id;
    const viewers = this.realtime
      .presenceUsers()
      .filter(
        (user) =>
          user.currentEntityId === this.entityId() && user.userId !== meId,
      );
    if (!viewers.length) return null;
    const names = viewers.map((user) => user.displayName);
    if (names.length === 1) return `${names[0]} is viewing this task.`;
    if (names.length === 2) {
      return `${names[0]} and ${names[1]} are viewing this task.`;
    }
    return `${names[0]}, ${names[1]}, and ${names.length - 2} others are viewing this task.`;
  });
}
