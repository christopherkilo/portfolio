import { Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { SHELL_NAV } from "../navigation";
import { UiStateService } from "../state/ui-state";
import { WorkspaceContextService } from "../data/workspace-context";
import { TaskflowMark } from "../../shared/brand/taskflow-mark";
import { NavIcon } from "../../shared/ui/nav-icon";

@Component({
  selector: "tf-sidebar",
  imports: [RouterLink, RouterLinkActive, TaskflowMark, NavIcon],
  templateUrl: "./sidebar.html",
  styleUrl: "./sidebar.scss",
})
export class Sidebar {
  private readonly ui = inject(UiStateService);
  readonly workspace = inject(WorkspaceContextService);
  readonly items = SHELL_NAV;

  onNavigate(): void {
    this.ui.closeMobileSidebar();
  }

  onWorkspaceChange(id: string): void {
    this.workspace.setWorkspaceId(id || null);
  }
}
