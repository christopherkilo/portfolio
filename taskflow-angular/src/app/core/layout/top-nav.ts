import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { UiStateService } from "../state/ui-state";
import { AuthService } from "../auth/auth";
import { ConnectionIndicator } from "../../shared/ui/connection-indicator";
import { PresenceAvatars } from "../../shared/ui/presence-avatars";
import { NotificationMenu } from "../../shared/ui/notification-menu";

@Component({
  selector: "tf-top-nav",
  imports: [ConnectionIndicator, PresenceAvatars, NotificationMenu],
  templateUrl: "./top-nav.html",
  styleUrl: "./top-nav.scss",
})
export class TopNav {
  readonly ui = inject(UiStateService);
  readonly auth = inject(AuthService);
  readonly pageTitle = input.required<string>();
  readonly signingOut = signal(false);

  readonly displayName = computed(() => {
    const user = this.auth.currentUser();
    return user?.profile.display_name || user?.email || "TaskFlow user";
  });

  readonly initials = computed(() => initialsFromName(this.displayName()));

  private readonly menuButton =
    viewChild<ElementRef<HTMLButtonElement>>("menuButton");
  private wasSidebarOpen = false;

  constructor() {
    effect(() => {
      const open = this.ui.mobileSidebarOpen();
      if (this.wasSidebarOpen && !open) {
        this.menuButton()?.nativeElement.focus();
      }
      this.wasSidebarOpen = open;
    });
  }

  async onSignOut(): Promise<void> {
    if (this.signingOut()) return;
    this.signingOut.set(true);
    await this.auth.signOut();
    this.signingOut.set(false);
  }
}

function initialsFromName(source: string): string {
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase() || "TF";
}
