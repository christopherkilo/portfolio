import { Injectable, computed, inject } from "@angular/core";
import { ActivityDataService } from "./activity-data";
import { MembersDataService } from "./members-data";
import { ProjectsDataService } from "./projects-data";
import { TasksDataService } from "./tasks-data";
import { WorkspaceContextService } from "./workspace-context";

/**
 * Combined load/error for the four workspace-scoped reads React loads together.
 * Not a cache — each domain resource remains the owner.
 */
@Injectable({ providedIn: "root" })
export class WorkspaceReadsService {
  readonly workspace = inject(WorkspaceContextService);
  readonly projects = inject(ProjectsDataService);
  readonly tasks = inject(TasksDataService);
  readonly members = inject(MembersDataService);
  readonly activity = inject(ActivityDataService);

  readonly isLoading = computed(() => {
    if (this.workspace.isLoading() && !this.workspace.hasValue()) return true;
    if (!this.workspace.currentWorkspaceId()) return false;
    return (
      (this.projects.isLoading() && !this.projects.hasValue()) ||
      (this.tasks.isLoading() && !this.tasks.hasValue()) ||
      (this.members.isLoading() && !this.members.hasValue()) ||
      (this.activity.isLoading() && !this.activity.hasValue())
    );
  });

  readonly error = computed(
    () =>
      this.workspace.error() ||
      this.projects.error() ||
      this.tasks.error() ||
      this.members.error() ||
      this.activity.error(),
  );

  reloadAll(): void {
    this.workspace.reload();
    this.projects.reload();
    this.tasks.reload();
    this.members.reload();
    this.activity.reload();
  }
}
