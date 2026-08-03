import "server-only";

/** Thin re-exports so route handlers stay import-stable after the service split. */
export {
  listWorkspaces,
  createWorkspace,
  renameWorkspace,
  ensureDefaultWorkspace,
  getCurrentUser,
  listWorkspaceMembers,
} from "@/server/taskflow/services/workspaceService";

export {
  listProjects,
  createProject,
  updateProject,
} from "@/server/taskflow/services/projectService";

export {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  unassignTask,
  listTaskAssignees,
} from "@/server/taskflow/services/taskService";

export {
  listActivity,
  recordActivity,
} from "@/server/taskflow/services/activityService";

export {
  listMembers,
  updateMemberRole,
  removeMember,
} from "@/server/taskflow/services/memberService";

export {
  listComments,
  createComment,
  updateComment,
  deleteComment,
} from "@/server/taskflow/services/commentService";

export {
  listInvitations,
  createInvitation,
  revokeInvitation,
  acceptInvitation,
} from "@/server/taskflow/services/invitationService";

export {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  notifyUser,
} from "@/server/taskflow/services/notificationService";

export {
  listAttachments,
  initiateAttachment,
  completeAttachment,
  getAttachmentDownloadUrl,
  deleteAttachment,
  abandonPendingAttachment,
  ATTACHMENT_BUCKET,
  MAX_ATTACHMENT_BYTES,
  ALLOWED_ATTACHMENT_MIME,
} from "@/server/taskflow/services/attachmentService";

export {
  getTaskHistory,
  getWorkspaceAudit,
} from "@/server/taskflow/services/auditService";

export {
  getNotificationPreferences,
  updateNotificationPreferences,
  maybeCreateDueDateNotifications,
} from "@/server/taskflow/services/notificationPreferenceService";
