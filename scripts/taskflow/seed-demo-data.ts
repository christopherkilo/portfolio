/**
 * Deterministic TaskFlow demo dataset.
 * Fixed UUIDs make the seed idempotent across runs.
 *
 * Note: task priority "Critical" maps to schema enum `urgent`.
 */

export const SEED_NAMESPACE = "a0000001";

/** Stable IDs — do not change once shipped (idempotent upserts). */
export const IDS = {
  workspace: "a0000001-0000-4000-8000-000000000001",
  projects: {
    eventHorizon: "a0000001-0000-4000-8000-000000000010",
    novaTech: "a0000001-0000-4000-8000-000000000011",
  },
  invitationMaya: "a0000001-0000-4000-8000-0000000000a1",
  tasks: {
    addEventCategories: "a0000001-0000-4000-8000-000000000101",
    improveMobileNav: "a0000001-0000-4000-8000-000000000102",
    accessibilityAudit: "a0000001-0000-4000-8000-000000000103",
    interactiveEventMap: "a0000001-0000-4000-8000-000000000104",
    googleAuthImprovements: "a0000001-0000-4000-8000-000000000105",
    reservationApi: "a0000001-0000-4000-8000-000000000106",
    postgresMigration: "a0000001-0000-4000-8000-000000000107",
    favoritesSystem: "a0000001-0000-4000-8000-000000000108",
    searchFilters: "a0000001-0000-4000-8000-000000000109",
    addPricingPage: "a0000001-0000-4000-8000-000000000201",
    caseStudyLayout: "a0000001-0000-4000-8000-000000000202",
    hubspotLeadPipeline: "a0000001-0000-4000-8000-000000000203",
    spamProtection: "a0000001-0000-4000-8000-000000000204",
    confirmationEmails: "a0000001-0000-4000-8000-000000000205",
    contactForm: "a0000001-0000-4000-8000-000000000206",
    heroAnimation: "a0000001-0000-4000-8000-000000000207",
  },
  comments: {
    mapChristopher: "a0000001-0000-4000-8000-000000000301",
    mapMaya: "a0000001-0000-4000-8000-000000000302",
    mapAlex: "a0000001-0000-4000-8000-000000000303",
    reservationJordan: "a0000001-0000-4000-8000-000000000304",
  },
  attachments: {
    wireframePdf: "a0000001-0000-4000-8000-000000000401",
    mapLayoutPng: "a0000001-0000-4000-8000-000000000402",
    apiResponseJson: "a0000001-0000-4000-8000-000000000403",
    emailWireframe: "a0000001-0000-4000-8000-000000000404",
    mobilePreview: "a0000001-0000-4000-8000-000000000405",
  },
} as const;

export type SeedMemberKey =
  | "christopher"
  | "maya"
  | "alex"
  | "jordan"
  | "sarah";

export type SeedMemberDef = {
  key: SeedMemberKey;
  email: string;
  displayName: string;
  role: "owner" | "admin" | "member" | "viewer";
  title: string;
  /** Initials avatar via Dicebear (remote URL, not hardcoded in UI). */
  avatarSeed: string;
};

/**
 * Demo teammates use @taskflow.demo emails (created via Auth Admin API).
 * Christopher is resolved to an existing Auth user when possible
 * (see TASKFLOW_SEED_OWNER_EMAIL / heuristics in seed-demo.ts).
 */
export const DEMO_MEMBERS: SeedMemberDef[] = [
  {
    key: "christopher",
    email: "christopher@taskflow.demo",
    displayName: "Christopher",
    role: "owner",
    title: "Owner",
    avatarSeed: "Christopher",
  },
  {
    key: "maya",
    email: "maya.rodriguez@taskflow.demo",
    displayName: "Maya Rodriguez",
    role: "admin",
    title: "Frontend / UX Designer",
    avatarSeed: "Maya Rodriguez",
  },
  {
    key: "alex",
    email: "alex.chen@taskflow.demo",
    displayName: "Alex Chen",
    role: "member",
    title: "Backend Developer",
    avatarSeed: "Alex Chen",
  },
  {
    key: "jordan",
    email: "jordan.patel@taskflow.demo",
    displayName: "Jordan Patel",
    role: "member",
    title: "QA Engineer",
    avatarSeed: "Jordan Patel",
  },
  {
    key: "sarah",
    email: "sarah.kim@taskflow.demo",
    displayName: "Sarah Kim",
    role: "viewer",
    title: "Product Manager",
    avatarSeed: "Sarah Kim",
  },
];

export const WORKSPACE = {
  id: IDS.workspace,
  name: "Portfolio Demo Workspace",
  description:
    "Internal workspace used to manage software projects for Christopher's development portfolio.",
} as const;

export function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e293b&textColor=e2e8f0`;
}

/** Days ago → ISO timestamp (spread activity over recent history). */
export function daysAgo(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function daysFromNow(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type SeedTaskDef = {
  id: string;
  project: "eventHorizon" | "novaTech";
  title: string;
  description: string;
  status: "backlog" | "todo" | "in-progress" | "review" | "done";
  /** Schema uses `urgent` for Critical. */
  priority: "low" | "medium" | "high" | "urgent";
  assignees: SeedMemberKey[];
  createdBy: SeedMemberKey;
  dueDate: string | null;
  version: number;
  labels?: string[];
  createdAt: string;
  updatedAt: string;
};

export const PROJECTS = [
  {
    id: IDS.projects.eventHorizon,
    key: "eventHorizon" as const,
    name: "Event Horizon v2",
    description:
      "Modern event discovery platform with authentication, reservations, maps, accessibility improvements, and backend enhancements.",
    status: "active" as const,
    color: "#38BDF8",
    version: 4,
    createdBy: "christopher" as SeedMemberKey,
    createdAt: daysAgo(18, 9, 15),
    updatedAt: daysAgo(1, 16, 40),
  },
  {
    id: IDS.projects.novaTech,
    key: "novaTech" as const,
    name: "NovaTech Website",
    description:
      "Marketing website with CRM integration, automated inquiry pipeline, and customer communication.",
    status: "active" as const,
    color: "#34D399",
    version: 3,
    createdBy: "christopher" as SeedMemberKey,
    createdAt: daysAgo(14, 11, 0),
    updatedAt: daysAgo(1, 14, 20),
  },
];

function checklist(items: string[]): string {
  return items.map((item) => `- [ ] ${item}`).join("\n");
}

export const TASKS: SeedTaskDef[] = [
  // —— Event Horizon ——
  {
    id: IDS.tasks.addEventCategories,
    project: "eventHorizon",
    title: "Add Event Categories",
    description: "Introduce browsable category taxonomy for concerts, meetups, and workshops.",
    status: "backlog",
    priority: "medium",
    assignees: ["christopher"],
    createdBy: "christopher",
    dueDate: daysFromNow(21),
    version: 1,
    labels: ["feature"],
    createdAt: daysAgo(12, 10, 0),
    updatedAt: daysAgo(12, 10, 0),
  },
  {
    id: IDS.tasks.improveMobileNav,
    project: "eventHorizon",
    title: "Improve Mobile Navigation",
    description: "Tighten mobile IA and reduce tap targets that fail accessibility contrast checks.",
    status: "backlog",
    priority: "high",
    assignees: ["christopher"],
    createdBy: "christopher",
    dueDate: daysFromNow(10),
    version: 2,
    labels: ["mobile", "ux"],
    createdAt: daysAgo(11, 11, 30),
    updatedAt: daysAgo(5, 9, 0),
  },
  {
    id: IDS.tasks.accessibilityAudit,
    project: "eventHorizon",
    title: "Accessibility Audit",
    description: "Full WCAG 2.2 AA pass on discovery, reservation, and account flows.",
    status: "backlog",
    priority: "medium",
    assignees: ["maya"],
    createdBy: "maya",
    dueDate: null,
    version: 1,
    labels: ["a11y"],
    createdAt: daysAgo(10, 14, 0),
    updatedAt: daysAgo(10, 14, 0),
  },
  {
    id: IDS.tasks.interactiveEventMap,
    project: "eventHorizon",
    title: "Interactive Event Map",
    description:
      "Replace the existing list-first browsing experience with an interactive map while preserving all filtering functionality.",
    status: "in-progress",
    priority: "high",
    assignees: ["christopher", "maya"],
    createdBy: "maya",
    dueDate: daysFromNow(5),
    version: 6,
    labels: ["maps", "feature"],
    createdAt: daysAgo(9, 10, 0),
    updatedAt: daysAgo(1, 15, 20),
  },
  {
    id: IDS.tasks.googleAuthImprovements,
    project: "eventHorizon",
    title: "Google Authentication Improvements",
    description: "Harden OAuth callback cookie handling and surface provider errors clearly.",
    status: "in-progress",
    priority: "high",
    assignees: ["christopher"],
    createdBy: "christopher",
    dueDate: daysFromNow(3),
    version: 4,
    labels: ["auth"],
    createdAt: daysAgo(8, 9, 0),
    updatedAt: daysAgo(2, 11, 0),
  },
  {
    id: IDS.tasks.reservationApi,
    project: "eventHorizon",
    title: "Reservation API",
    description: [
      "Transactional reservation endpoint with inventory guards.",
      "",
      "Checklist:",
      checklist([
        "Database transactions",
        "Duplicate reservation protection",
        "Inventory validation",
      ]),
    ].join("\n"),
    status: "review",
    priority: "high",
    assignees: ["jordan"],
    createdBy: "jordan",
    dueDate: daysFromNow(2),
    version: 7,
    labels: ["api", "backend"],
    createdAt: daysAgo(13, 13, 0),
    updatedAt: daysAgo(1, 17, 5),
  },
  {
    id: IDS.tasks.postgresMigration,
    project: "eventHorizon",
    title: "PostgreSQL Migration",
    description: "Migrated primary data store to PostgreSQL with zero-downtime cutover.",
    status: "done",
    priority: "urgent",
    assignees: ["christopher"],
    createdBy: "christopher",
    dueDate: daysAgo(6).slice(0, 10),
    version: 8,
    labels: ["infra"],
    createdAt: daysAgo(16, 9, 0),
    updatedAt: daysAgo(6, 18, 0),
  },
  {
    id: IDS.tasks.favoritesSystem,
    project: "eventHorizon",
    title: "Favorites System",
    description: "Persisted favorites with optimistic UI and conflict-safe writes.",
    status: "done",
    priority: "medium",
    assignees: ["alex"],
    createdBy: "alex",
    dueDate: daysAgo(8).slice(0, 10),
    version: 5,
    labels: ["feature"],
    createdAt: daysAgo(15, 12, 0),
    updatedAt: daysAgo(8, 16, 30),
  },
  {
    id: IDS.tasks.searchFilters,
    project: "eventHorizon",
    title: "Search Filters",
    description: "Composable filters for date, category, price, and accessibility tags.",
    status: "done",
    priority: "low",
    assignees: ["maya", "christopher"],
    createdBy: "maya",
    dueDate: null,
    version: 3,
    labels: ["search"],
    createdAt: daysAgo(14, 10, 0),
    updatedAt: daysAgo(9, 14, 0),
  },
  // —— NovaTech ——
  {
    id: IDS.tasks.addPricingPage,
    project: "novaTech",
    title: "Add Pricing Page",
    description: "Ship tiered pricing with FAQ and CTA into the HubSpot inquiry flow.",
    status: "backlog",
    priority: "medium",
    assignees: ["christopher"],
    createdBy: "christopher",
    dueDate: daysFromNow(14),
    version: 1,
    createdAt: daysAgo(7, 10, 0),
    updatedAt: daysAgo(7, 10, 0),
  },
  {
    id: IDS.tasks.caseStudyLayout,
    project: "novaTech",
    title: "Case Study Layout",
    description: "Flexible case-study template with metrics strip and gallery.",
    status: "backlog",
    priority: "low",
    assignees: ["maya"],
    createdBy: "maya",
    dueDate: null,
    version: 1,
    labels: ["design"],
    createdAt: daysAgo(7, 11, 0),
    updatedAt: daysAgo(7, 11, 0),
  },
  {
    id: IDS.tasks.hubspotLeadPipeline,
    project: "novaTech",
    title: "HubSpot Lead Pipeline",
    description:
      "Connect website inquiries directly into HubSpot while creating leads automatically.",
    status: "in-progress",
    priority: "high",
    assignees: ["christopher"],
    createdBy: "christopher",
    dueDate: daysFromNow(7),
    version: 3,
    labels: ["crm", "integration"],
    createdAt: daysAgo(6, 9, 30),
    updatedAt: daysAgo(1, 12, 0),
  },
  {
    id: IDS.tasks.spamProtection,
    project: "novaTech",
    title: "Spam Protection",
    description: "Bot scoring + honeypot + rate limits on the public contact endpoint.",
    status: "in-progress",
    priority: "urgent",
    assignees: ["alex"],
    createdBy: "alex",
    dueDate: daysFromNow(4),
    version: 2,
    labels: ["security"],
    createdAt: daysAgo(5, 15, 0),
    updatedAt: daysAgo(0, 11, 45),
  },
  {
    id: IDS.tasks.confirmationEmails,
    project: "novaTech",
    title: "Confirmation Emails",
    description: [
      "Transactional confirmation emails for new inquiries.",
      "",
      "Checklist:",
      checklist(["Responsive", "Accessible", "Plain text version"]),
    ].join("\n"),
    status: "review",
    priority: "medium",
    assignees: ["maya"],
    createdBy: "maya",
    dueDate: daysFromNow(1),
    version: 4,
    labels: ["email"],
    createdAt: daysAgo(9, 13, 0),
    updatedAt: daysAgo(2, 16, 0),
  },
  {
    id: IDS.tasks.contactForm,
    project: "novaTech",
    title: "Contact Form",
    description: "Validated multi-field contact form with server-side Zod parsing.",
    status: "done",
    priority: "high",
    assignees: ["christopher"],
    createdBy: "christopher",
    dueDate: daysAgo(4).slice(0, 10),
    version: 5,
    createdAt: daysAgo(12, 10, 0),
    updatedAt: daysAgo(4, 17, 0),
  },
  {
    id: IDS.tasks.heroAnimation,
    project: "novaTech",
    title: "Hero Animation",
    description: "Subtle motion on the marketing hero without hurting LCP.",
    status: "done",
    priority: "low",
    assignees: ["maya"],
    createdBy: "maya",
    dueDate: daysAgo(3).slice(0, 10),
    version: 3,
    labels: ["motion"],
    createdAt: daysAgo(11, 14, 0),
    updatedAt: daysAgo(3, 15, 30),
  },
];

export type SeedCommentDef = {
  id: string;
  taskId: string;
  author: SeedMemberKey;
  body: string;
  createdAt: string;
};

export const COMMENTS: SeedCommentDef[] = [
  {
    id: IDS.comments.mapChristopher,
    taskId: IDS.tasks.interactiveEventMap,
    author: "christopher",
    body: "We should keep the filtering logic separate so both the map and list reuse the same data.",
    createdAt: daysAgo(2, 14, 10),
  },
  {
    id: IDS.comments.mapMaya,
    taskId: IDS.tasks.interactiveEventMap,
    author: "maya",
    body: "Agreed. The map should just become another presentation layer.",
    createdAt: daysAgo(2, 14, 35),
  },
  {
    id: IDS.comments.mapAlex,
    taskId: IDS.tasks.interactiveEventMap,
    author: "alex",
    body: "I'll expose coordinates from the API instead of changing the data model.",
    createdAt: daysAgo(2, 15, 5),
  },
  {
    id: IDS.comments.reservationJordan,
    taskId: IDS.tasks.reservationApi,
    author: "jordan",
    body: "Inventory locking looks good. I'd like one more transaction test before merging.",
    createdAt: daysAgo(1, 17, 20),
  },
];

export type SeedAttachmentDef = {
  id: string;
  taskId: string;
  uploadedBy: SeedMemberKey;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

/** Metadata-only placeholders — storage_path is under seed-placeholder/ and status=failed. */
export const ATTACHMENTS: SeedAttachmentDef[] = [
  {
    id: IDS.attachments.wireframePdf,
    taskId: IDS.tasks.interactiveEventMap,
    uploadedBy: "maya",
    fileName: "wireframe-v2.pdf",
    mimeType: "application/pdf",
    sizeBytes: 482_112,
    createdAt: daysAgo(4, 11, 0),
  },
  {
    id: IDS.attachments.mapLayoutPng,
    taskId: IDS.tasks.interactiveEventMap,
    uploadedBy: "maya",
    fileName: "map-layout.png",
    mimeType: "image/png",
    sizeBytes: 312_400,
    createdAt: daysAgo(4, 11, 5),
  },
  {
    id: IDS.attachments.apiResponseJson,
    taskId: IDS.tasks.interactiveEventMap,
    uploadedBy: "alex",
    fileName: "api-response-example.json",
    mimeType: "application/json",
    sizeBytes: 8_192,
    createdAt: daysAgo(3, 16, 0),
  },
  {
    id: IDS.attachments.emailWireframe,
    taskId: IDS.tasks.confirmationEmails,
    uploadedBy: "maya",
    fileName: "email-wireframe.pdf",
    mimeType: "application/pdf",
    sizeBytes: 256_000,
    createdAt: daysAgo(5, 10, 0),
  },
  {
    id: IDS.attachments.mobilePreview,
    taskId: IDS.tasks.confirmationEmails,
    uploadedBy: "maya",
    fileName: "mobile-preview.png",
    mimeType: "image/png",
    sizeBytes: 198_400,
    createdAt: daysAgo(5, 10, 8),
  },
];

export type SeedActivityDef = {
  id: string;
  actor: SeedMemberKey;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  summary: string;
  oldValue?: string | null;
  newValue?: string | null;
  changes?: Record<string, { from: unknown; to: unknown }>;
  createdAt: string;
  source?: string;
};

export const ACTIVITY: SeedActivityDef[] = [
  {
    id: "a0000001-0000-4000-8000-000000000501",
    actor: "christopher",
    action: "created",
    entityType: "workspace",
    entityId: IDS.workspace,
    entityTitle: WORKSPACE.name,
    summary: `created workspace ${WORKSPACE.name}`,
    createdAt: daysAgo(18, 9, 0),
  },
  {
    id: "a0000001-0000-4000-8000-000000000502",
    actor: "christopher",
    action: "created",
    entityType: "project",
    entityId: IDS.projects.eventHorizon,
    entityTitle: "Event Horizon v2",
    summary: "created Event Horizon v2",
    createdAt: daysAgo(18, 9, 15),
  },
  {
    id: "a0000001-0000-4000-8000-000000000503",
    actor: "christopher",
    action: "created",
    entityType: "project",
    entityId: IDS.projects.novaTech,
    entityTitle: "NovaTech Website",
    summary: "created NovaTech Website",
    createdAt: daysAgo(14, 11, 0),
  },
  {
    id: "a0000001-0000-4000-8000-000000000504",
    actor: "sarah",
    action: "invited",
    entityType: "invitation",
    entityId: IDS.invitationMaya,
    entityTitle: "maya.rodriguez@taskflow.demo",
    summary: "Sarah invited Maya to Portfolio Demo Workspace",
    newValue: "admin",
    createdAt: daysAgo(17, 10, 0),
  },
  {
    id: "a0000001-0000-4000-8000-000000000505",
    actor: "maya",
    action: "joined",
    entityType: "invitation",
    entityId: IDS.invitationMaya,
    entityTitle: "maya.rodriguez@taskflow.demo",
    summary: "Maya accepted invitation",
    createdAt: daysAgo(17, 10, 45),
  },
  {
    id: "a0000001-0000-4000-8000-000000000506",
    actor: "maya",
    action: "created",
    entityType: "task",
    entityId: IDS.tasks.interactiveEventMap,
    entityTitle: "Interactive Event Map",
    summary: "Maya created Interactive Event Map",
    createdAt: daysAgo(9, 10, 0),
  },
  {
    id: "a0000001-0000-4000-8000-000000000507",
    actor: "alex",
    action: "assigned",
    entityType: "task",
    entityId: IDS.tasks.interactiveEventMap,
    entityTitle: "Interactive Event Map",
    summary: "Alex assigned Christopher",
    newValue: "Christopher",
    changes: {
      assignees: { from: ["Maya Rodriguez"], to: ["Maya Rodriguez", "Christopher"] },
    },
    createdAt: daysAgo(8, 11, 0),
  },
  {
    id: "a0000001-0000-4000-8000-000000000508",
    actor: "christopher",
    action: "moved",
    entityType: "task",
    entityId: IDS.tasks.interactiveEventMap,
    entityTitle: "Interactive Event Map",
    summary: "Christopher moved Interactive Event Map to In Progress",
    oldValue: "backlog",
    newValue: "in-progress",
    changes: {
      status: { from: "backlog", to: "in-progress" },
    },
    createdAt: daysAgo(7, 13, 20),
  },
  {
    id: "a0000001-0000-4000-8000-000000000509",
    actor: "maya",
    action: "commented",
    entityType: "task",
    entityId: IDS.tasks.interactiveEventMap,
    entityTitle: "Interactive Event Map",
    summary: "Maya commented",
    createdAt: daysAgo(2, 14, 35),
  },
  {
    id: "a0000001-0000-4000-8000-000000000510",
    actor: "alex",
    action: "completed",
    entityType: "task",
    entityId: IDS.tasks.favoritesSystem,
    entityTitle: "Favorites System",
    summary: "Alex completed Favorites System",
    oldValue: "review",
    newValue: "done",
    changes: {
      status: { from: "review", to: "done" },
    },
    createdAt: daysAgo(8, 16, 30),
  },
  {
    id: "a0000001-0000-4000-8000-000000000511",
    actor: "jordan",
    action: "moved",
    entityType: "task",
    entityId: IDS.tasks.reservationApi,
    entityTitle: "Reservation API",
    summary: "Jordan moved Reservation API to Review",
    oldValue: "in-progress",
    newValue: "review",
    changes: {
      status: { from: "in-progress", to: "review" },
    },
    createdAt: daysAgo(1, 17, 5),
  },
  {
    id: "a0000001-0000-4000-8000-000000000512",
    actor: "christopher",
    action: "completed",
    entityType: "task",
    entityId: IDS.tasks.postgresMigration,
    entityTitle: "PostgreSQL Migration",
    summary: "Christopher completed PostgreSQL Migration",
    oldValue: "review",
    newValue: "done",
    changes: {
      status: { from: "review", to: "done" },
    },
    createdAt: daysAgo(6, 18, 0),
  },
  // Structured audit-style events
  {
    id: "a0000001-0000-4000-8000-000000000513",
    actor: "christopher",
    action: "updated",
    entityType: "task",
    entityId: IDS.tasks.improveMobileNav,
    entityTitle: "Improve Mobile Navigation",
    summary: "Christopher changed priority Medium → High",
    oldValue: "medium",
    newValue: "high",
    changes: {
      priority: { from: "medium", to: "high" },
    },
    createdAt: daysAgo(5, 9, 0),
    source: "api",
  },
  {
    id: "a0000001-0000-4000-8000-000000000514",
    actor: "maya",
    action: "assigned",
    entityType: "task",
    entityId: IDS.tasks.spamProtection,
    entityTitle: "Spam Protection",
    summary: "Maya assigned Alex",
    newValue: "Alex Chen",
    changes: {
      assignees: { from: [], to: ["Alex Chen"] },
    },
    createdAt: daysAgo(5, 14, 30),
  },
  {
    id: "a0000001-0000-4000-8000-000000000515",
    actor: "alex",
    action: "moved",
    entityType: "task",
    entityId: IDS.tasks.spamProtection,
    entityTitle: "Spam Protection",
    summary: "Alex moved task Backlog → In Progress",
    oldValue: "backlog",
    newValue: "in-progress",
    changes: {
      status: { from: "backlog", to: "in-progress" },
    },
    createdAt: daysAgo(5, 15, 0),
  },
  {
    id: "a0000001-0000-4000-8000-000000000516",
    actor: "christopher",
    action: "updated",
    entityType: "task",
    entityId: IDS.tasks.hubspotLeadPipeline,
    entityTitle: "HubSpot Lead Pipeline",
    summary: "Christopher edited description",
    changes: {
      description: {
        from: "Wire HubSpot.",
        to: "Connect website inquiries directly into HubSpot while creating leads automatically.",
      },
    },
    createdAt: daysAgo(3, 12, 15),
  },
  {
    id: "a0000001-0000-4000-8000-000000000517",
    actor: "jordan",
    action: "moved",
    entityType: "task",
    entityId: IDS.tasks.reservationApi,
    entityTitle: "Reservation API",
    summary: "Jordan moved task to Review",
    oldValue: "in-progress",
    newValue: "review",
    changes: {
      status: { from: "in-progress", to: "review" },
    },
    createdAt: daysAgo(1, 17, 0),
  },
  {
    id: "a0000001-0000-4000-8000-000000000518",
    actor: "maya",
    action: "attachment_added",
    entityType: "task",
    entityId: IDS.tasks.interactiveEventMap,
    entityTitle: "Interactive Event Map",
    summary: "Maya attached wireframe-v2.pdf (seed placeholder metadata)",
    newValue: "wireframe-v2.pdf",
    createdAt: daysAgo(4, 11, 0),
  },
];

export type SeedNotificationDef = {
  id: string;
  /** Recipient member key */
  user: SeedMemberKey;
  type:
    | "task_assigned"
    | "comment_added"
    | "invitation_received"
    | "project_due_soon"
    | "task_due_soon"
    | "task_completed"
    | "role_changed"
    | "member_removed";
  entityType: string;
  entityId: string;
  actor: SeedMemberKey;
  title: string;
  message: string;
  dedupeKey: string;
  groupKey?: string | null;
  readAt: string | null;
  createdAt: string;
};

/** Notifications primarily for the owner (Christopher) so the dashboard feels alive. */
export const NOTIFICATIONS: SeedNotificationDef[] = [
  {
    id: "a0000001-0000-4000-8000-000000000601",
    user: "christopher",
    type: "comment_added",
    entityType: "task",
    entityId: IDS.tasks.interactiveEventMap,
    actor: "maya",
    title: "New comment",
    message: "Maya commented on Interactive Event Map",
    dedupeKey: "seed:comment:map:maya",
    groupKey: `comment:${IDS.tasks.interactiveEventMap}`,
    readAt: null,
    createdAt: daysAgo(2, 14, 36),
  },
  {
    id: "a0000001-0000-4000-8000-000000000602",
    user: "christopher",
    type: "task_completed",
    entityType: "task",
    entityId: IDS.tasks.favoritesSystem,
    actor: "alex",
    title: "Task completed",
    message: "Alex completed Favorites System",
    dedupeKey: "seed:completed:favorites",
    readAt: null,
    createdAt: daysAgo(8, 16, 31),
  },
  {
    id: "a0000001-0000-4000-8000-000000000609",
    user: "christopher",
    type: "task_assigned",
    entityType: "task",
    entityId: IDS.tasks.spamProtection,
    actor: "alex",
    title: "Task updated",
    message: "Alex moved Spam Protection to In Progress",
    dedupeKey: "seed:moved:spam",
    readAt: null,
    createdAt: daysAgo(0, 11, 46),
  },
  {
    id: "a0000001-0000-4000-8000-000000000603",
    user: "christopher",
    type: "task_assigned",
    entityType: "task",
    entityId: IDS.tasks.reservationApi,
    actor: "jordan",
    title: "Task updated",
    message: "Jordan moved Reservation API to Review",
    dedupeKey: "seed:moved:reservation",
    readAt: null,
    createdAt: daysAgo(1, 17, 6),
  },
  {
    id: "a0000001-0000-4000-8000-000000000604",
    user: "christopher",
    type: "task_assigned",
    entityType: "task",
    entityId: IDS.tasks.googleAuthImprovements,
    actor: "maya",
    title: "You were assigned",
    message: "You were assigned Google Authentication Improvements",
    dedupeKey: "seed:assigned:google-auth",
    readAt: null,
    createdAt: daysAgo(8, 9, 5),
  },
  {
    id: "a0000001-0000-4000-8000-000000000605",
    user: "christopher",
    type: "invitation_received",
    entityType: "invitation",
    entityId: IDS.invitationMaya,
    actor: "sarah",
    title: "Invitation activity",
    message: "Sarah invited Maya to Portfolio Demo Workspace",
    dedupeKey: "seed:invite:maya",
    readAt: daysAgo(16, 12, 0),
    createdAt: daysAgo(17, 10, 1),
  },
  {
    id: "a0000001-0000-4000-8000-000000000606",
    user: "christopher",
    type: "comment_added",
    entityType: "task",
    entityId: IDS.tasks.reservationApi,
    actor: "jordan",
    title: "New comment",
    message: "Jordan commented on Reservation API",
    dedupeKey: "seed:comment:reservation:jordan",
    readAt: daysAgo(1, 18, 0),
    createdAt: daysAgo(1, 17, 21),
  },
  {
    id: "a0000001-0000-4000-8000-000000000607",
    user: "maya",
    type: "comment_added",
    entityType: "task",
    entityId: IDS.tasks.interactiveEventMap,
    actor: "christopher",
    title: "New comment",
    message: "Christopher commented on Interactive Event Map",
    dedupeKey: "seed:comment:map:christopher:for-maya",
    readAt: null,
    createdAt: daysAgo(2, 14, 12),
  },
  {
    id: "a0000001-0000-4000-8000-000000000608",
    user: "jordan",
    type: "task_assigned",
    entityType: "task",
    entityId: IDS.tasks.reservationApi,
    actor: "christopher",
    title: "You were assigned",
    message: "You were assigned Reservation API",
    dedupeKey: "seed:assigned:reservation:jordan",
    readAt: daysAgo(10, 9, 0),
    createdAt: daysAgo(13, 13, 5),
  },
];

export const PREFERENCE_DEFAULTS: Record<
  SeedMemberKey,
  {
    assignments: boolean;
    comments: boolean;
    mentions: boolean;
    due_dates: boolean;
    project_changes: boolean;
  }
> = {
  christopher: {
    assignments: true,
    comments: true,
    mentions: true,
    due_dates: true,
    project_changes: true,
  },
  maya: {
    assignments: true,
    comments: true,
    mentions: true,
    due_dates: true,
    project_changes: false,
  },
  alex: {
    assignments: true,
    comments: true,
    mentions: false,
    due_dates: true,
    project_changes: true,
  },
  jordan: {
    assignments: true,
    comments: true,
    mentions: true,
    due_dates: true,
    project_changes: true,
  },
  sarah: {
    assignments: false,
    comments: true,
    mentions: true,
    due_dates: false,
    project_changes: true,
  },
};
