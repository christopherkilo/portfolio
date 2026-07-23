export type ProjectStatus = "active" | "planning" | "paused" | "done";
export type TaskStatus = "backlog" | "todo" | "in-progress" | "review" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  status: "online" | "away" | "offline";
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
  members: string[];
  color: string;
  taskCount: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId: string;
  assigneeId: string;
  dueDate: string;
  labels: string[];
}

export interface ActivityItem {
  id: string;
  userId: string;
  action: string;
  target: string;
  timestamp: string;
}

export const TEAM: TeamMember[] = [
  {
    id: "u1",
    name: "Maya Chen",
    role: "Product Lead",
    email: "maya@taskflow.app",
    avatar: "MC",
    status: "online",
  },
  {
    id: "u2",
    name: "Jordan Blake",
    role: "Engineering",
    email: "jordan@taskflow.app",
    avatar: "JB",
    status: "online",
  },
  {
    id: "u3",
    name: "Sam Ortiz",
    role: "Design",
    email: "sam@taskflow.app",
    avatar: "SO",
    status: "away",
  },
  {
    id: "u4",
    name: "Riley Park",
    role: "QA",
    email: "riley@taskflow.app",
    avatar: "RP",
    status: "offline",
  },
  {
    id: "u5",
    name: "Avery Kim",
    role: "Operations",
    email: "avery@taskflow.app",
    avatar: "AK",
    status: "online",
  },
];

export const PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Atlas Redesign",
    description: "Refresh navigation, density, and onboarding for the core product.",
    status: "active",
    progress: 68,
    dueDate: "2026-08-28",
    members: ["u1", "u2", "u3"],
    color: "#60A5FA",
    taskCount: 18,
  },
  {
    id: "p2",
    name: "Billing Pipeline",
    description: "Invoices, dunning, and usage-based pricing instrumentation.",
    status: "active",
    progress: 42,
    dueDate: "2026-09-12",
    members: ["u2", "u5"],
    color: "#34D399",
    taskCount: 12,
  },
  {
    id: "p3",
    name: "Mobile Preview",
    description: "Responsive shells and touch-friendly task triage.",
    status: "planning",
    progress: 18,
    dueDate: "2026-10-01",
    members: ["u3", "u4"],
    color: "#FBBF24",
    taskCount: 9,
  },
  {
    id: "p4",
    name: "Security Hardening",
    description: "SSO polish, audit logs, and session controls.",
    status: "paused",
    progress: 55,
    dueDate: "2026-09-30",
    members: ["u2", "u4", "u5"],
    color: "#F87171",
    taskCount: 14,
  },
  {
    id: "p5",
    name: "Launch Checklist",
    description: "Go-live readiness for the Q3 release train.",
    status: "done",
    progress: 100,
    dueDate: "2026-07-15",
    members: ["u1", "u5"],
    color: "#A78BFA",
    taskCount: 7,
  },
  {
    id: "p6",
    name: "Docs Site",
    description: "Public documentation with searchable API references.",
    status: "active",
    progress: 31,
    dueDate: "2026-09-20",
    members: ["u1", "u3"],
    color: "#22D3EE",
    taskCount: 11,
  },
];

export const TASKS: Task[] = [
  {
    id: "t1",
    title: "Refine sidebar information architecture",
    description: "Collapse secondary routes and validate keyboard flows.",
    status: "in-progress",
    priority: "high",
    projectId: "p1",
    assigneeId: "u3",
    dueDate: "2026-07-24",
    labels: ["design", "ux"],
  },
  {
    id: "t2",
    title: "Ship command palette shortcuts",
    description: "Wire navigation actions and empty-state copy.",
    status: "review",
    priority: "medium",
    projectId: "p1",
    assigneeId: "u2",
    dueDate: "2026-07-22",
    labels: ["frontend"],
  },
  {
    id: "t3",
    title: "Invoice PDF export",
    description: "Generate branded PDFs for closed invoices.",
    status: "todo",
    priority: "high",
    projectId: "p2",
    assigneeId: "u2",
    dueDate: "2026-07-26",
    labels: ["billing"],
  },
  {
    id: "t4",
    title: "Dunning email templates",
    description: "Draft and review retry cadence messaging.",
    status: "backlog",
    priority: "medium",
    projectId: "p2",
    assigneeId: "u5",
    dueDate: "2026-08-02",
    labels: ["ops"],
  },
  {
    id: "t5",
    title: "Touch targets audit",
    description: "Ensure 44px minimum for primary actions on mobile.",
    status: "todo",
    priority: "low",
    projectId: "p3",
    assigneeId: "u3",
    dueDate: "2026-08-05",
    labels: ["mobile", "a11y"],
  },
  {
    id: "t6",
    title: "Session revocation API",
    description: "Allow admins to invalidate remote sessions.",
    status: "in-progress",
    priority: "urgent",
    projectId: "p4",
    assigneeId: "u2",
    dueDate: "2026-07-21",
    labels: ["security"],
  },
  {
    id: "t7",
    title: "QA regression pack",
    description: "Cover kanban, filters, and settings persistence.",
    status: "todo",
    priority: "high",
    projectId: "p1",
    assigneeId: "u4",
    dueDate: "2026-07-25",
    labels: ["qa"],
  },
  {
    id: "t8",
    title: "Docs search indexing",
    description: "Index markdown pages for client-side search.",
    status: "backlog",
    priority: "medium",
    projectId: "p6",
    assigneeId: "u1",
    dueDate: "2026-08-10",
    labels: ["docs"],
  },
  {
    id: "t9",
    title: "Progress chart polish",
    description: "Animate dashboard progress bars on mount.",
    status: "done",
    priority: "low",
    projectId: "p1",
    assigneeId: "u3",
    dueDate: "2026-07-18",
    labels: ["frontend"],
  },
  {
    id: "t10",
    title: "SSO metadata validation",
    description: "Reject malformed IdP certificates with clear errors.",
    status: "review",
    priority: "high",
    projectId: "p4",
    assigneeId: "u4",
    dueDate: "2026-07-23",
    labels: ["security"],
  },
  {
    id: "t11",
    title: "Calendar deadline sync",
    description: "Map task due dates into monthly grid cells.",
    status: "in-progress",
    priority: "medium",
    projectId: "p6",
    assigneeId: "u5",
    dueDate: "2026-07-27",
    labels: ["product"],
  },
  {
    id: "t12",
    title: "Empty state illustrations",
    description: "Lightweight SVG empties for projects and team.",
    status: "backlog",
    priority: "low",
    projectId: "p3",
    assigneeId: "u3",
    dueDate: "2026-08-12",
    labels: ["design"],
  },
];

export const ACTIVITY: ActivityItem[] = [
  {
    id: "a1",
    userId: "u2",
    action: "moved",
    target: "Ship command palette shortcuts → Review",
    timestamp: "2026-07-20T14:20:00",
  },
  {
    id: "a2",
    userId: "u3",
    action: "commented on",
    target: "Refine sidebar information architecture",
    timestamp: "2026-07-20T13:05:00",
  },
  {
    id: "a3",
    userId: "u1",
    action: "created",
    target: "Docs Site project",
    timestamp: "2026-07-20T11:40:00",
  },
  {
    id: "a4",
    userId: "u4",
    action: "completed",
    target: "Progress chart polish",
    timestamp: "2026-07-19T17:15:00",
  },
  {
    id: "a5",
    userId: "u5",
    action: "updated",
    target: "Billing Pipeline due date",
    timestamp: "2026-07-19T15:50:00",
  },
  {
    id: "a6",
    userId: "u2",
    action: "assigned",
    target: "Session revocation API → Jordan Blake",
    timestamp: "2026-07-19T10:12:00",
  },
];

export const TASK_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "Todo" },
  { id: "in-progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

export function getMember(id: string) {
  return TEAM.find((m) => m.id === id);
}

export function getProject(id: string) {
  return PROJECTS.find((p) => p.id === id);
}

export function getTask(id: string) {
  return TASKS.find((t) => t.id === id);
}

export const DEMO_BASE = "/demos/taskflow";

export const NAV_ITEMS = [
  { href: `${DEMO_BASE}/dashboard`, label: "Dashboard", icon: "LayoutDashboard" },
  { href: `${DEMO_BASE}/projects`, label: "Projects", icon: "FolderKanban" },
  { href: `${DEMO_BASE}/tasks`, label: "Tasks", icon: "CheckSquare" },
  { href: `${DEMO_BASE}/calendar`, label: "Calendar", icon: "CalendarDays" },
  { href: `${DEMO_BASE}/team`, label: "Team", icon: "Users" },
  { href: `${DEMO_BASE}/settings`, label: "Settings", icon: "Settings" },
] as const;
