import { DOCUMENT } from "@angular/common";
import { Component, HostListener, effect, inject, untracked } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { CdkTrapFocus } from "@angular/cdk/a11y";
import { filter, map, startWith } from "rxjs";
import { titleFromRouterState } from "../route-title";
import { UiStateService } from "../state/ui-state";
import { AuthService } from "../auth/auth";
import { WorkspaceContextService } from "../data/workspace-context";
import { RealtimeService } from "../realtime/realtime";
import { RealtimeCoordinatorService } from "../realtime/realtime-coordinator";
import { NetworkStatusService } from "../realtime/network-status";
import { OfflineReplayService } from "../offline/replay";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { ConflictDialog } from "../../shared/ui/conflict-dialog";

@Component({
  selector: "tf-shell",
  imports: [RouterOutlet, CdkTrapFocus, Sidebar, TopNav, ConflictDialog],
  templateUrl: "./taskflow-shell.html",
  styleUrl: "./taskflow-shell.scss",
})
export class TaskflowShell {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  readonly ui = inject(UiStateService);

  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => titleFromRouterState(this.router.routerState.snapshot)),
    ),
    { initialValue: "TaskFlow" },
  );

  constructor() {
    inject(RealtimeCoordinatorService);
    const realtime = inject(RealtimeService);
    const auth = inject(AuthService);
    const workspace = inject(WorkspaceContextService);
    const network = inject(NetworkStatusService);
    const replay = inject(OfflineReplayService);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.ui.closeMobileSidebar();
        void realtime.updatePresence({
          currentView: event.urlAfterRedirects.split("?")[0],
        });
      });

    effect((onCleanup) => {
      if (!this.ui.mobileSidebarOpen()) return;
      const body = this.document.body;
      const previousOverflow = body.style.overflow;
      body.style.overflow = "hidden";
      onCleanup(() => {
        body.style.overflow = previousOverflow;
      });
    });

    effect((onCleanup) => {
      const user = auth.currentUser();
      const workspaceId = workspace.currentWorkspaceId();
      const authenticated = auth.isAuthenticated();
      if (!authenticated || !user || !workspaceId) {
        untracked(() => {
          void realtime.stop();
        });
        return;
      }
      const self = {
        userId: user.id,
        displayName:
          user.profile.display_name || user.email || "TaskFlow user",
        avatarUrl: user.profile.avatar_url,
        workspaceId,
        currentView: untracked(() => this.router.url.split("?")[0]),
        currentEntityId: null as string | null,
      };
      untracked(() => {
        void realtime.start(workspaceId, user.id, self);
      });
      onCleanup(() => {
        void realtime.stop();
      });
    });

    effect(() => {
      const authenticated = auth.isAuthenticated();
      const user = auth.currentUser();
      const online = network.online();
      if (!authenticated || !user || online === false) return;
      untracked(() => {
        void replay.tryReplay();
      });
    });
  }

  @HostListener("document:keydown.escape", ["$event"])
  onEscape(event: Event): void {
    if (!this.ui.mobileSidebarOpen()) return;
    event.preventDefault();
    this.ui.closeMobileSidebar();
  }
}
