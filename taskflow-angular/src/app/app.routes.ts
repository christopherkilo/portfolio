import { Type } from "@angular/core";
import { Route, Routes } from "@angular/router";
import { ChromelessShell } from "./core/layout/chromeless-shell";
import { TaskflowShell } from "./core/layout/taskflow-shell";
import { authGuard } from "./core/auth/auth.guard";
import { guestGuard } from "./core/auth/guest.guard";

function page(
  path: string,
  title: string,
  load: () => Promise<Type<unknown>>,
  extras: Pick<Route, "canActivate"> = {},
): Route {
  return {
    path,
    title,
    data: { title },
    loadComponent: load,
    ...extras,
  };
}

export const routes: Routes = [
  {
    path: "",
    component: TaskflowShell,
    canActivate: [authGuard],
    children: [
      { path: "", pathMatch: "full", redirectTo: "dashboard" },
      page("dashboard", "Dashboard", () =>
        import("./features/dashboard/dashboard-page").then((m) => m.DashboardPage),
      ),
      page("projects", "Projects", () =>
        import("./features/projects/projects-page").then((m) => m.ProjectsPage),
      ),
      page("tasks", "Tasks", () =>
        import("./features/tasks/tasks-page").then((m) => m.TasksPage),
      ),
      page("calendar", "Calendar", () =>
        import("./features/calendar/calendar-page").then((m) => m.CalendarPage),
      ),
      page("team", "Team", () =>
        import("./features/team/team-page").then((m) => m.TeamPage),
      ),
      page("audit", "Audit", () =>
        import("./features/audit/audit-page").then((m) => m.AuditPage),
      ),
      page("settings", "Settings", () =>
        import("./features/settings/settings-page").then((m) => m.SettingsPage),
      ),
    ],
  },
  {
    path: "",
    component: ChromelessShell,
    children: [
      page(
        "signin",
        "Sign in",
        () => import("./features/auth/sign-in-page").then((m) => m.SignInPage),
        { canActivate: [guestGuard] },
      ),
      page("invite", "Invite", () =>
        import("./features/invitations/invite-page").then((m) => m.InvitePage),
      ),
    ],
  },
  {
    path: "**",
    title: "Not found",
    data: { title: "Not found" },
    loadComponent: () =>
      import("./features/not-found/not-found-page").then((m) => m.NotFoundPage),
  },
];
