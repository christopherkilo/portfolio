import { Component, computed, effect, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { map } from "rxjs";
import { userFacingLoadError } from "../../core/api/http-error";
import type { Project, ProjectStatus } from "../../core/api/models";
import { formatDate } from "../../core/data/dates";
import { WorkspacePermissionsService } from "../../core/data/permissions";
import { projectHealth, projectTasks } from "../../core/data/read-model";
import { WorkspaceReadsService } from "../../core/data/workspace-reads";
import { ProgressBar } from "../../shared/ui/progress-bar";
import { ReadDialog } from "../../shared/ui/read-dialog";
import {
  EmptyState,
  QueryError,
  QueryLoading,
} from "../../shared/ui/query-states";
import { ProjectEditor } from "./project-editor";

@Component({
  selector: "tf-projects-page",
  imports: [
    ProgressBar,
    ReadDialog,
    EmptyState,
    QueryError,
    QueryLoading,
    ProjectEditor,
  ],
  templateUrl: "./projects-page.html",
  styleUrl: "./projects-page.scss",
})
export class ProjectsPage {
  readonly reads = inject(WorkspaceReadsService);
  readonly permissions = inject(WorkspacePermissionsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly formatDate = formatDate;

  readonly status = signal("all");
  readonly sort = signal("progress");
  readonly createOpen = signal(false);
  readonly editSnapshot = signal<Project | null>(null);

  private readonly query = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => ({
        q: params.get("q") ?? "",
        projectId: params.get("project"),
      })),
    ),
    { initialValue: { q: "", projectId: null as string | null } },
  );

  readonly loadError = computed(() => {
    const error = this.reads.error();
    return error ? userFacingLoadError(error) : null;
  });

  readonly healthRows = computed(() =>
    this.reads.projects
      .projects()
      .filter((project) => !project.archived)
      .map((project) => ({
        project,
        health: projectHealth(project, this.reads.tasks.tasks()),
      })),
  );

  readonly filtered = computed(() => {
    let list = [...this.healthRows()];
    const q = this.query().q.trim().toLowerCase();
    if (q) {
      list = list.filter(
        ({ project }) =>
          project.name.toLowerCase().includes(q) ||
          project.description.toLowerCase().includes(q),
      );
    }
    if (this.status() !== "all") {
      list = list.filter(({ project }) => project.status === this.status());
    }
    switch (this.sort()) {
      case "name":
        list.sort((a, b) => a.project.name.localeCompare(b.project.name));
        break;
      case "due":
        list.sort((a, b) => a.project.dueDate.localeCompare(b.project.dueDate));
        break;
      default:
        list.sort((a, b) => b.health.completion - a.health.completion);
    }
    return list;
  });

  readonly selected = computed((): Project | null => {
    const id = this.query().projectId;
    if (!id) return null;
    return (
      this.reads.projects.projects().find((project) => project.id === id) ??
      null
    );
  });

  readonly selectedHealth = computed(() => {
    const project = this.selected();
    return project
      ? projectHealth(project, this.reads.tasks.tasks())
      : null;
  });

  readonly searchValue = computed(() => this.query().q);

  constructor() {
    effect(() => {
      const id = this.query().projectId;
      if (!id) {
        this.editSnapshot.set(null);
        return;
      }
      if (this.editSnapshot()?.id === id) return;
      const live =
        this.reads.projects.projects().find((project) => project.id === id) ??
        null;
      this.editSnapshot.set(live ? { ...live } : null);
    });
  }

  statusClass(status: ProjectStatus): string {
    return `status status-${status}`;
  }

  openTaskCount(projectId: string): number {
    return projectTasks(this.reads.tasks.tasks(), projectId).filter(
      (task) => task.status !== "done",
    ).length;
  }

  onSearch(value: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value || null },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  onStatus(value: string): void {
    this.status.set(value);
  }

  onSort(value: string): void {
    this.sort.set(value);
  }

  openProject(id: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { project: id },
      queryParamsHandling: "merge",
    });
  }

  closeProject(): void {
    this.editSnapshot.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { project: null },
      queryParamsHandling: "merge",
    });
  }

  openCreate(): void {
    this.createOpen.set(true);
  }

  closeCreate(): void {
    this.createOpen.set(false);
  }

  onProjectCreated(id: string): void {
    this.createOpen.set(false);
    this.openProject(id);
  }

  onProjectEdited(id: string): void {
    const live = this.reads.projects.projects().find((project) => project.id === id);
    if (!live || live.archived) {
      this.closeProject();
    }
  }

  clearSearch(): void {
    this.onSearch("");
  }
}
