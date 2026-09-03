import { Component, computed, inject } from "@angular/core";
import { Router } from "@angular/router";
import { userFacingLoadError } from "../../core/api/http-error";
import { formatDate } from "../../core/data/dates";
import {
  dashboardInsights,
  describeActivity,
  findMember,
  findProject,
  overdueTasks,
  projectHealth,
  recentActivity,
  upcomingDeadlines,
} from "../../core/data/read-model";
import { WorkspaceReadsService } from "../../core/data/workspace-reads";
import { ProgressBar } from "../../shared/ui/progress-bar";
import {
  EmptyState,
  QueryError,
  QueryLoading,
} from "../../shared/ui/query-states";

@Component({
  selector: "tf-dashboard-page",
  imports: [ProgressBar, EmptyState, QueryError, QueryLoading],
  templateUrl: "./dashboard-page.html",
  styleUrl: "./dashboard-page.scss",
})
export class DashboardPage {
  readonly reads = inject(WorkspaceReadsService);
  private readonly router = inject(Router);
  readonly formatDate = formatDate;
  readonly describeActivity = describeActivity;
  readonly findMember = findMember;

  readonly insights = computed(() =>
    dashboardInsights(
      this.reads.tasks.tasks(),
      this.reads.projects.projects(),
      this.reads.members.members(),
      this.reads.activity.activity(),
    ),
  );
  readonly upcoming = computed(() =>
    upcomingDeadlines(this.reads.tasks.tasks(), 5),
  );
  readonly overdue = computed(() => overdueTasks(this.reads.tasks.tasks()));
  readonly feed = computed(() =>
    recentActivity(this.reads.activity.activity(), 8),
  );
  readonly projectRows = computed(() =>
    this.reads.projects
      .projects()
      .filter((project) => !project.archived && project.status !== "done")
      .map((project) => projectHealth(project, this.reads.tasks.tasks())),
  );
  readonly loadError = computed(() => {
    const error = this.reads.error();
    return error ? userFacingLoadError(error) : null;
  });

  projectName(taskProjectId: string): string {
    return findProject(this.reads.projects.projects(), taskProjectId)?.name ?? "";
  }

  openTasks(): void {
    void this.router.navigateByUrl("/tasks");
  }

  openProjects(): void {
    void this.router.navigateByUrl("/projects");
  }
}
