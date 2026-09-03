import { computed, signal } from "@angular/core";
import { Subject } from "rxjs";
import type {
  ActivityItem,
  PendingInvitation,
  Project,
  Task,
  TeamMember,
  Workspace,
} from "../core/api/models";
import type { PresenceUser } from "../core/realtime/presence";
import { OfflineReplayService } from "../core/offline/replay";
import { MembersDataService } from "../core/data/members-data";
import { NetworkStatusService } from "../core/realtime/network-status";
import { TasksDataService } from "../core/data/tasks-data";
import { ProjectsDataService } from "../core/data/projects-data";
import { ActivityDataService } from "../core/data/activity-data";
import { AttachmentsDataService } from "../core/data/attachments-data";
import { AttachmentMutationsService } from "../core/data/attachment-mutations";
import { AuditDataService } from "../core/data/audit-data";
import { CommentsDataService } from "../core/data/comments-data";
import { CommentMutationsService } from "../core/data/comment-mutations";
import { NotificationsDataService } from "../core/data/notifications-data";
import { NotificationMutationsService } from "../core/data/notification-mutations";
import { NotificationPreferencesDataService } from "../core/data/notification-preferences-data";
import { NotificationPreferenceMutationsService } from "../core/data/notification-preference-mutations";
import { TaskHistoryDataService } from "../core/data/task-history-data";
import type { NotificationPreferenceRow } from "../core/api/models";

export const sampleWorkspace: Workspace = {
  id: "ws-1",
  name: "Portfolio Demo Workspace",
  description: "Demo",
  created_by: "user-1",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  archived_at: null,
};

export const sampleProject: Project = {
  id: "p1",
  name: "Atlas Launch",
  description: "Ship the portfolio demo",
  status: "active",
  progress: 0,
  dueDate: "2026-12-01",
  members: [],
  color: "#60A5FA",
  taskCount: 0,
  archived: false,
  version: 1,
};

export const sampleTask: Task = {
  id: "t1",
  title: "Write launch checklist",
  description: "Cover auth and dashboard",
  status: "todo",
  priority: "high",
  projectId: "p1",
  assigneeId: "user-1",
  dueDate: "2026-12-01",
  labels: ["launch"],
  archived: false,
  version: 3,
};

export const sampleMember: TeamMember = {
  id: "user-1",
  name: "Maya Chen",
  role: "owner",
  email: "maya@example.com",
  avatar: "MC",
};

export const sampleActivity: ActivityItem = {
  id: "a1",
  userId: "user-1",
  action: "created",
  target: "Write launch checklist",
  timestamp: "2026-09-01T12:00:00.000Z",
  entityType: "task",
  summary: "created Write launch checklist",
};

export function stubWorkspaceContext(overrides: Partial<{
  workspaces: Workspace[];
  loading: boolean;
  error: unknown;
}> = {}) {
  const workspaces = signal(overrides.workspaces ?? [sampleWorkspace]);
  const current = computed(() => workspaces()[0] ?? null);
  return {
    workspaces,
    currentWorkspace: current,
    currentWorkspaceId: computed(() => current()?.id ?? null),
    isLoading: signal(overrides.loading ?? false),
    error: signal(overrides.error ?? null),
    hasValue: signal(!overrides.loading),
    reload: vi.fn(),
    setWorkspaceId: vi.fn(),
    resource: { reload: vi.fn() },
  };
}

export function stubWorkspaceReads(options?: {
  projects?: Project[];
  tasks?: Task[];
  members?: TeamMember[];
  activity?: ActivityItem[];
  loading?: boolean;
  error?: unknown;
  workspaceId?: string | null;
}) {
  const projects = signal(options?.projects ?? [sampleProject]);
  const tasks = signal(options?.tasks ?? [sampleTask]);
  const members = signal(options?.members ?? [sampleMember]);
  const activity = signal(options?.activity ?? [sampleActivity]);
  const workspaceId = options?.workspaceId === undefined ? "ws-1" : options.workspaceId;
  return {
    workspace: {
      currentWorkspaceId: signal(workspaceId),
      currentWorkspace: signal(
        workspaceId ? sampleWorkspace : null,
      ),
      workspaces: signal(workspaceId ? [sampleWorkspace] : []),
      isLoading: signal(false),
      error: signal(null),
      hasValue: signal(true),
      reload: vi.fn(),
      setWorkspaceId: vi.fn(),
    },
    projects: {
      projects,
      isLoading: signal(false),
      error: signal(null),
      hasValue: signal(true),
      reload: vi.fn(),
    },
    tasks: {
      tasks,
      isLoading: signal(false),
      error: signal(null),
      hasValue: signal(true),
      reload: vi.fn(),
    },
    members: {
      members,
      isLoading: signal(false),
      error: signal(null),
      hasValue: signal(true),
      reload: vi.fn(),
    },
    activity: {
      activity,
      isLoading: signal(false),
      error: signal(null),
      hasValue: signal(true),
      reload: vi.fn(),
    },
    isLoading: signal(options?.loading ?? false),
    error: signal(options?.error ?? null),
    reloadAll: vi.fn(),
  };
}

export function stubPermissions(
  options: {
    role?: TeamMember["role"];
    userId?: string;
    canEditTask?: boolean;
    canManageProjects?: boolean;
    canInviteMembers?: boolean;
  } = {},
) {
  const userId = options.userId ?? "user-1";
  const role =
    options.role ?? (options.canManageProjects === false ? "member" : "owner");
  const manage =
    options.canInviteMembers ?? (role === "owner" || role === "admin");
  return {
    currentUserId: signal(userId),
    currentRole: signal(role),
    canEditTask: signal(options.canEditTask ?? role !== "viewer"),
    canComment: signal(options.canEditTask ?? role !== "viewer"),
    canUploadAttachment: signal(options.canEditTask ?? role !== "viewer"),
    canDeleteAttachment: signal(options.canEditTask ?? role !== "viewer"),
    canManageProjects: signal(options.canManageProjects ?? manage),
    canManageMembers: signal(manage),
    canInviteMembers: signal(manage),
    canViewAudit: signal(manage),
    canManageComment: (authorId: string) =>
      authorId === userId || role === "owner" || role === "admin",
    canChangeMemberRole: (member: TeamMember) => {
      if (!manage) return false;
      if (member.role === "owner") return false;
      if (role === "admin" && member.role === "admin") return false;
      return true;
    },
    canRemoveMember: (member: TeamMember) => {
      if (!manage) return false;
      if (member.id === userId) return false;
      if (member.role === "owner") return false;
      if (role === "admin" && member.role === "admin") return false;
      return true;
    },
    roleSelectOptions: () =>
      role === "owner" ? ["admin", "member", "viewer"] : ["member", "viewer"],
    inviteRoleOptions: () => ["admin", "member", "viewer"],
  };
}

export function stubInvitations(
  options: {
    invitations?: PendingInvitation[];
    loading?: boolean;
    error?: unknown;
  } = {},
) {
  return {
    invitations: signal(options.invitations ?? []),
    isLoading: signal(options.loading ?? false),
    error: signal(options.error ?? null),
    hasValue: signal(true),
    reload: vi.fn(),
    resource: { reload: vi.fn() },
  };
}

export function stubInvitationMutations() {
  return {
    invite: vi.fn().mockResolvedValue({
      invitation: {
        id: "inv-1",
        workspace_id: "ws-1",
        email: "new@example.com",
        role: "member",
        expires_at: "2026-09-08T00:00:00.000Z",
        created_at: "2026-09-01T00:00:00.000Z",
      },
    }),
    revoke: vi.fn().mockResolvedValue(undefined),
    accept: vi.fn().mockResolvedValue({
      invitation_id: "inv-1",
      workspace_id: "ws-1",
      role: "member",
    }),
  };
}

export function stubMemberMutations() {
  return {
    updateRole: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  };
}

export function stubTaskMutations() {
  return {
    create: vi.fn(),
    update: vi.fn(),
    changeStatus: vi.fn(),
    archive: vi.fn(),
    delete: vi.fn(),
    assign: vi.fn(),
    unassign: vi.fn(),
    syncAssignees: vi.fn(),
    latestFromError: vi.fn().mockReturnValue(null),
    updateResolved: vi.fn(),
  };
}

export function stubProjectMutations() {
  return {
    create: vi.fn(),
    rename: vi.fn(),
    setArchived: vi.fn(),
    updateResolved: vi.fn(),
    latestFromError: vi.fn().mockReturnValue(null),
  };
}

export function stubMutationQueue(
  options: {
    pending?: number;
    failed?: number;
    conflicted?: number;
  } = {},
) {
  const pending = signal(options.pending ?? 0);
  const failed = signal(options.failed ?? 0);
  const conflicted = signal(options.conflicted ?? 0);
  return {
    pendingCount: pending,
    failedCount: failed,
    conflictedCount: conflicted,
    hasPendingChanges: computed(() => pending() > 0),
    needsAttention: computed(() => failed() + conflicted() > 0),
    counts: computed(() => ({
      pending: pending(),
      failed: failed(),
      conflicted: conflicted(),
      totalNeedsAttention: failed() + conflicted(),
    })),
    list: vi.fn().mockReturnValue([]),
    listForUser: vi.fn().mockReturnValue([]),
    replayableForUser: vi.fn().mockReturnValue([]),
    conflictedForUser: vi.fn().mockReturnValue([]),
    enqueue: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    refresh: vi.fn(),
    whenReady: vi.fn().mockResolvedValue(undefined),
  };
}

export function stubOfflineReplay() {
  return {
    tryReplay: vi.fn().mockResolvedValue(undefined),
  };
}

const stubMe = {
  id: "user-1",
  email: "maya@example.com",
  profile: { display_name: "Maya Chen", avatar_url: null },
};

export function stubAuth(
  options: {
    status?: "checking" | "authenticated" | "unauthenticated";
    user?: typeof stubMe | null;
  } = {},
) {
  const status = signal(options.status ?? "authenticated");
  const currentUser = signal(
    options.user === undefined
      ? status() === "authenticated"
        ? stubMe
        : null
      : options.user,
  );
  return {
    status,
    currentUser,
    isAuthenticated: () => status() === "authenticated",
    logoutError: signal<string | null>(null),
    initialize: () => Promise.resolve(),
    ensureInitialized: () => Promise.resolve(),
    refreshUser: () => Promise.resolve(),
    signInWithGoogle: () => undefined,
    signOut: () => Promise.resolve(),
    handleUnauthorized: () => undefined,
  };
}

export function stubRealtime() {
  return {
    connectionStatus: signal<"offline" | "online" | "connecting" | "reconnecting" | "failed">(
      "offline",
    ),
    presenceUsers: signal([] as PresenceUser[]),
    invalidations$: new Subject(),
    reconnects$: new Subject<{ workspaceId: string }>(),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    updatePresence: vi.fn().mockResolvedValue(undefined),
    hasChannel: vi.fn().mockReturnValue(false),
    activeWorkspaceId: vi.fn().mockReturnValue(null),
    getSelfPayload: vi.fn().mockReturnValue(null),
    notifyBrowserOffline: vi.fn(),
    notifyBrowserOnline: vi.fn(),
  };
}

export function stubConflictResolution() {
  const session = signal(null as unknown);
  return {
    session,
    dialogOpen: signal(false),
    submitting: signal(false),
    refreshing: signal(false),
    discardConfirming: signal(false),
    errorMessage: signal<string | null>(null),
    completion: signal(null as unknown),
    diffs: computed(() => [] as unknown[]),
    visibleDiffs: computed(() => [] as unknown[]),
    summary: computed(() => ({ changed: 0, autoMerged: 0, needsDecision: 0 })),
    canSave: computed(() => false),
    openFromTaskConflict: vi.fn(),
    openFromProjectConflict: vi.fn(),
    openFromQueue: vi.fn(),
    openNextQueueConflict: vi.fn(),
    showDialog: vi.fn(),
    hideDialog: vi.fn(),
    choose: vi.fn(),
    chooseRemaining: vi.fn(),
    setOverride: vi.fn(),
    submit: vi.fn(),
    startDiscard: vi.fn(),
    cancelDiscard: vi.fn(),
    discard: vi.fn(),
    refreshLatest: vi.fn(),
    resolvedTaskDraft: vi.fn(),
    resolvedProjectDraft: vi.fn(),
  };
}

export function conflictResolutionDeps() {
  return [
    { provide: OfflineReplayService, useValue: stubOfflineReplay() },
    {
      provide: MembersDataService,
      useValue: { members: signal([] as TeamMember[]), reload: vi.fn() },
    },
    { provide: NetworkStatusService, useValue: { online: signal(true) } },
    { provide: TasksDataService, useValue: { reload: vi.fn() } },
    { provide: ProjectsDataService, useValue: { reload: vi.fn() } },
    { provide: ActivityDataService, useValue: { reload: vi.fn() } },
  ];
}

export function stubRealtimeCoordinator() {
  return {};
}

export function stubComments(
  options: { comments?: import("../core/api/models").CommentWithAuthor[]; taskId?: string | null } = {},
) {
  const taskId = signal(options.taskId ?? null);
  return {
    taskId,
    comments: signal(options.comments ?? []),
    isLoading: signal(false),
    error: signal<unknown>(null),
    hasValue: signal(true),
    setActiveTask: vi.fn((id: string | null) => taskId.set(id)),
    reload: vi.fn(),
  };
}

export function stubAttachments(
  options: { attachments?: import("../core/api/models").TaskAttachment[] } = {},
) {
  return {
    taskId: signal<string | null>(null),
    attachments: signal(options.attachments ?? []),
    isLoading: signal(false),
    error: signal(null),
    hasValue: signal(true),
    setActiveTask: vi.fn(),
    reload: vi.fn(),
  };
}

export function stubHistory(
  options: { events?: import("../core/api/models").ActivityEventRow[] } = {},
) {
  return {
    taskId: signal<string | null>(null),
    events: signal(options.events ?? []),
    isLoading: signal(false),
    error: signal(null),
    hasValue: signal(true),
    setActiveTask: vi.fn(),
    reload: vi.fn(),
  };
}

export function stubNotifications(
  options: {
    notifications?: import("../core/api/models").TaskflowNotification[];
    loading?: boolean;
    error?: unknown;
  } = {},
) {
  const notifications = signal(options.notifications ?? []);
  return {
    notifications,
    unreadCount: computed(() => notifications().filter((item) => !item.readAt).length),
    isLoading: signal(options.loading ?? false),
    error: signal(options.error ?? null),
    hasValue: signal(true),
    reload: vi.fn(),
  };
}

export function stubAudit(
  options: {
    events?: import("../core/api/models").ActivityEventRow[];
    error?: unknown;
    loading?: boolean;
  } = {},
) {
  return {
    entityType: signal(""),
    action: signal(""),
    events: signal(options.events ?? []),
    isLoading: signal(options.loading ?? false),
    error: signal(options.error ?? null),
    hasValue: signal(!(options.loading ?? false)),
    setFilters: vi.fn(),
    reload: vi.fn(),
  };
}

export function stubCommentMutations() {
  return {
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

export function stubAttachmentMutations() {
  return {
    upload: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
    download: vi.fn().mockResolvedValue(undefined),
  };
}

export function stubNotificationMutations() {
  return {
    markRead: vi.fn().mockResolvedValue({}),
    markAllRead: vi.fn().mockResolvedValue({ count: 0 }),
  };
}

export const sampleNotificationPrefs: NotificationPreferenceRow = {
  user_id: "user-1",
  assignments: true,
  comments: true,
  mentions: true,
  due_dates: true,
  project_changes: true,
  updated_at: "2026-09-01T12:00:00.000Z",
};

export function stubNotificationPreferences(
  options: {
    preferences?: NotificationPreferenceRow | null;
    loading?: boolean;
    error?: unknown;
  } = {},
) {
  return {
    preferences: signal(options.preferences ?? sampleNotificationPrefs),
    isLoading: signal(options.loading ?? false),
    error: signal(options.error ?? null),
    hasValue: signal(!(options.loading ?? false)),
    reload: vi.fn(),
  };
}

export function stubNotificationPreferenceMutations() {
  return {
    save: vi.fn().mockResolvedValue(sampleNotificationPrefs),
  };
}

export function productSurfaceProviders() {
  return [
    { provide: CommentsDataService, useValue: stubComments() },
    { provide: AttachmentsDataService, useValue: stubAttachments() },
    { provide: TaskHistoryDataService, useValue: stubHistory() },
    { provide: NotificationsDataService, useValue: stubNotifications() },
    { provide: AuditDataService, useValue: stubAudit() },
    { provide: CommentMutationsService, useValue: stubCommentMutations() },
    { provide: AttachmentMutationsService, useValue: stubAttachmentMutations() },
    { provide: NotificationMutationsService, useValue: stubNotificationMutations() },
    {
      provide: NotificationPreferencesDataService,
      useValue: stubNotificationPreferences(),
    },
    {
      provide: NotificationPreferenceMutationsService,
      useValue: stubNotificationPreferenceMutations(),
    },
  ];
}
