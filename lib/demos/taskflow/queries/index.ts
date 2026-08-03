export { taskflowKeys, workspaceKeys } from "@/lib/demos/taskflow/queries/workspaceKeys";

export {
  useWorkspaceMembers,
  useUpdateMemberRole,
  useRemoveMember,
} from "@/lib/demos/taskflow/queries/memberQueries";

export {
  useTaskComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  type CommentWithAuthor,
} from "@/lib/demos/taskflow/queries/commentQueries";

export {
  usePendingInvitations,
  useInviteMember,
  useRevokeInvitation,
  useAcceptInvitation,
  type InvitationListItem,
  type CreateInvitationResult,
} from "@/lib/demos/taskflow/queries/invitationQueries";

export {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/lib/demos/taskflow/queries/notificationQueries";

export {
  useAssignTask,
  useUnassignTask,
} from "@/lib/demos/taskflow/queries/taskQueries";

export {
  attachmentKeys,
  useTaskAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  downloadAttachment,
} from "@/lib/demos/taskflow/queries/attachmentQueries";
