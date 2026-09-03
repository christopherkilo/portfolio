import { Component, computed, effect, inject, signal, untracked } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { map } from "rxjs";
import { userFacingLoadError } from "../../core/api/http-error";
import type { Task } from "../../core/api/models";
import {
  calendarCells,
  formatCalendarMonth,
  formatDate,
  parseCalendarMonth,
  todayDateOnly,
} from "../../core/data/dates";
import {
  activeTasks,
  findMember,
  findProject,
  upcomingDeadlines,
} from "../../core/data/read-model";
import { WorkspaceReadsService } from "../../core/data/workspace-reads";
import { UiStateService } from "../../core/state/ui-state";
import { ReadDialog } from "../../shared/ui/read-dialog";
import {
  EmptyState,
  QueryError,
  QueryLoading,
} from "../../shared/ui/query-states";

@Component({
  selector: "tf-calendar-page",
  imports: [ReadDialog, EmptyState, QueryError, QueryLoading],
  templateUrl: "./calendar-page.html",
  styleUrl: "./calendar-page.scss",
})
export class CalendarPage {
  readonly reads = inject(WorkspaceReadsService);
  readonly ui = inject(UiStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly formatDate = formatDate;
  readonly today = todayDateOnly();
  readonly selected = signal<Task | null>(null);

  private readonly monthParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get("month"))),
    { initialValue: null as string | null },
  );

  readonly loadError = computed(() => {
    const error = this.reads.error();
    return error ? userFacingLoadError(error) : null;
  });

  readonly cursor = computed(() => {
    return parseCalendarMonth(this.monthParam()) ?? startOfCurrentMonth();
  });

  readonly label = computed(() =>
    this.cursor().toLocaleString("en-US", { month: "long", year: "numeric" }),
  );

  readonly weekdays = computed(() =>
    this.ui.weekStart() === "monday"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  );

  readonly liveTasks = computed(() => activeTasks(this.reads.tasks.tasks()));

  readonly cells = computed(() => {
    const cursor = this.cursor();
    const tasks = this.liveTasks();
    return calendarCells(
      cursor.getFullYear(),
      cursor.getMonth(),
      this.ui.weekStart(),
    ).map((cell) =>
      cell
        ? {
            ...cell,
            dayTasks: tasks.filter((task) => task.dueDate === cell.iso),
          }
        : null,
    );
  });

  readonly upcoming = computed(() => upcomingDeadlines(this.liveTasks(), 6));

  constructor() {
    effect(() => {
      if (this.monthParam()) return;
      untracked(() => this.setMonth(startOfCurrentMonth()));
    });
  }

  projectName(id: string): string {
    return findProject(this.reads.projects.projects(), id)?.name ?? "";
  }

  assigneeName(task: Task): string {
    return findMember(this.reads.members.members(), task.assigneeId)?.name ?? "Unassigned";
  }

  setMonth(date: Date): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { month: formatCalendarMonth(date) },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  goToday(): void {
    this.setMonth(startOfCurrentMonth());
  }

  moveMonth(delta: number): void {
    const cursor = this.cursor();
    this.setMonth(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  }

  openTask(task: Task): void {
    this.selected.set(task);
  }

  closeTask(): void {
    this.selected.set(null);
  }

  openOnBoard(): void {
    const task = this.selected();
    if (!task) return;
    void this.router.navigate(["/tasks"], { queryParams: { task: task.id } });
  }
}

function startOfCurrentMonth(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}
