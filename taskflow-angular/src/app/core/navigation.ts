export type ShellNavIcon =
  | "dashboard"
  | "projects"
  | "tasks"
  | "calendar"
  | "team"
  | "audit"
  | "settings";

export type ShellNavItem = {
  path: string;
  label: string;
  icon: ShellNavIcon;
};

/** Mirrors lib/demos/taskflow/data.ts NAV_ITEMS labels and order. */
export const SHELL_NAV: readonly ShellNavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { path: "/projects", label: "Projects", icon: "projects" },
  { path: "/tasks", label: "Tasks", icon: "tasks" },
  { path: "/calendar", label: "Calendar", icon: "calendar" },
  { path: "/team", label: "Team", icon: "team" },
  { path: "/audit", label: "Audit", icon: "audit" },
  { path: "/settings", label: "Settings", icon: "settings" },
];
