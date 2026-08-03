import "server-only";

export type TaskflowErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "INTERNAL_ERROR"
  | "MEMBER_NOT_FOUND"
  | "INVALID_ROLE_CHANGE"
  | "INVITATION_EXPIRED"
  | "INVITATION_ALREADY_ACCEPTED"
  | "INVITATION_ALREADY_PENDING"
  | "COMMENT_NOT_FOUND"
  | "COMMENT_PERMISSION_DENIED"
  | "NOTIFICATION_NOT_FOUND"
  | "REALTIME_SUBSCRIPTION_ERROR"
  | "INVALID_WORKSPACE_RELATIONSHIP"
  | "INVALID_ASSIGNEE"
  | "DUPLICATE_ASSIGNMENT"
  | "ACTIVE_INVITATION_EXISTS"
  | "INVITATION_REPLACEMENT_FAILED"
  | "IMMUTABLE_FIELD_CHANGE"
  | "NOTIFICATION_CREATION_DENIED"
  | "PARTIAL_SECONDARY_FAILURE"
  | "OWNER_REMOVAL_FORBIDDEN"
  | "ROLE_ESCALATION_FORBIDDEN"
  | "STALE_VERSION"
  | "OFFLINE_UNSAFE_ACTION"
  | "ATTACHMENT_TOO_LARGE"
  | "ATTACHMENT_TYPE_NOT_ALLOWED"
  | "ATTACHMENT_NOT_FOUND"
  | "ATTACHMENT_PERMISSION_DENIED"
  | "ATTACHMENT_NOT_UPLOADED"
  | "ATTACHMENT_COMPLETION_FORBIDDEN"
  | "ATTACHMENT_STATE_CONFLICT"
  | "ATTACHMENT_INTEGRITY"
  | "NO_CHANGES"
  | "INVALID_PATCH"
  | "AUDIT_WRITE_ERROR"
  | "REALTIME_RECONNECT_FAILED"
  | "OFFLINE_CONFLICT_PAYLOAD"
  | "STORAGE_POLICY_CONFIGURATION"
  | "STORAGE_UNAVAILABLE"
  | "PRESENCE_UNAVAILABLE"
  | "QUEUED_MUTATION_CONFLICT"
  | "AUDIT_ACCESS_DENIED"
  | "SCHEMA_NOT_READY";

export class TaskflowError extends Error {
  readonly code: TaskflowErrorCode;
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;
  readonly expose: boolean;

  constructor(
    code: TaskflowErrorCode,
    message: string,
    options: {
      status: number;
      fieldErrors?: Record<string, string[]>;
      expose?: boolean;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "TaskflowError";
    this.code = code;
    this.status = options.status;
    this.fieldErrors = options.fieldErrors ?? {};
    this.expose = options.expose ?? true;
  }
}

export class ValidationError extends TaskflowError {
  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super("VALIDATION_ERROR", message, { status: 400, fieldErrors });
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends TaskflowError {
  constructor(message = "Please sign in to continue.") {
    super("UNAUTHORIZED", message, { status: 401 });
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends TaskflowError {
  constructor(message = "You do not have permission to perform this action.") {
    super("FORBIDDEN", message, { status: 403 });
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends TaskflowError {
  constructor(message = "Resource not found.") {
    super("NOT_FOUND", message, { status: 404 });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends TaskflowError {
  constructor(message: string) {
    super("CONFLICT", message, { status: 409 });
    this.name = "ConflictError";
  }
}

export class UnprocessableError extends TaskflowError {
  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super("UNPROCESSABLE", message, { status: 422, fieldErrors });
    this.name = "UnprocessableError";
  }
}

export class InternalError extends TaskflowError {
  constructor(message = "We could not complete your request. Please try again.") {
    super("INTERNAL_ERROR", message, { status: 500, expose: true });
    this.name = "InternalError";
  }
}

export class MemberNotFoundError extends TaskflowError {
  constructor(message = "Member not found.") {
    super("MEMBER_NOT_FOUND", message, { status: 404 });
    this.name = "MemberNotFoundError";
  }
}

export class InvalidRoleChangeError extends TaskflowError {
  constructor(message = "That role change is not allowed.") {
    super("INVALID_ROLE_CHANGE", message, { status: 403 });
    this.name = "InvalidRoleChangeError";
  }
}

export class InvitationExpiredError extends TaskflowError {
  constructor(message = "This invitation has expired.") {
    super("INVITATION_EXPIRED", message, { status: 409 });
    this.name = "InvitationExpiredError";
  }
}

export class InvitationAlreadyAcceptedError extends TaskflowError {
  constructor(message = "This invitation was already accepted.") {
    super("INVITATION_ALREADY_ACCEPTED", message, { status: 409 });
    this.name = "InvitationAlreadyAcceptedError";
  }
}

export class InvitationAlreadyPendingError extends TaskflowError {
  constructor(message = "An active invitation already exists for that email.") {
    super("INVITATION_ALREADY_PENDING", message, { status: 409 });
    this.name = "InvitationAlreadyPendingError";
  }
}

export class ActiveInvitationExistsError extends TaskflowError {
  constructor(message = "An active invitation already exists for that email.") {
    super("ACTIVE_INVITATION_EXISTS", message, { status: 409 });
    this.name = "ActiveInvitationExistsError";
  }
}

export class CommentNotFoundError extends TaskflowError {
  constructor(message = "Comment not found.") {
    super("COMMENT_NOT_FOUND", message, { status: 404 });
    this.name = "CommentNotFoundError";
  }
}

export class CommentPermissionDeniedError extends TaskflowError {
  constructor(message = "You cannot modify this comment.") {
    super("COMMENT_PERMISSION_DENIED", message, { status: 403 });
    this.name = "CommentPermissionDeniedError";
  }
}

export class NotificationNotFoundError extends TaskflowError {
  constructor(message = "Notification not found.") {
    super("NOTIFICATION_NOT_FOUND", message, { status: 404 });
    this.name = "NotificationNotFoundError";
  }
}

export class RealtimeSubscriptionError extends TaskflowError {
  constructor(message = "Live updates are temporarily unavailable.") {
    super("REALTIME_SUBSCRIPTION_ERROR", message, { status: 500 });
    this.name = "RealtimeSubscriptionError";
  }
}

export class InvalidWorkspaceRelationshipError extends TaskflowError {
  constructor(message = "That resource does not belong to this workspace.") {
    super("INVALID_WORKSPACE_RELATIONSHIP", message, { status: 422 });
    this.name = "InvalidWorkspaceRelationshipError";
  }
}

export class InvalidAssigneeError extends TaskflowError {
  constructor(message = "Assignee must be a member of this workspace.") {
    super("INVALID_ASSIGNEE", message, { status: 422 });
    this.name = "InvalidAssigneeError";
  }
}

export class DuplicateAssignmentError extends TaskflowError {
  constructor(message = "That member is already assigned.") {
    super("DUPLICATE_ASSIGNMENT", message, { status: 409 });
    this.name = "DuplicateAssignmentError";
  }
}

export class InvitationReplacementFailedError extends TaskflowError {
  constructor(message = "Could not replace the expired invitation.") {
    super("INVITATION_REPLACEMENT_FAILED", message, { status: 409 });
    this.name = "InvitationReplacementFailedError";
  }
}

export class ImmutableFieldChangeError extends TaskflowError {
  constructor(message = "That field cannot be changed.") {
    super("IMMUTABLE_FIELD_CHANGE", message, { status: 403 });
    this.name = "ImmutableFieldChangeError";
  }
}

export class NotificationCreationDeniedError extends TaskflowError {
  constructor(message = "Notification creation is not allowed.") {
    super("NOTIFICATION_CREATION_DENIED", message, { status: 403 });
    this.name = "NotificationCreationDeniedError";
  }
}

export class PartialSecondaryFailureError extends TaskflowError {
  constructor(message = "The action succeeded, but a follow-up step failed.") {
    super("PARTIAL_SECONDARY_FAILURE", message, { status: 200, expose: true });
    this.name = "PartialSecondaryFailureError";
  }
}

export class OwnerRemovalForbiddenError extends TaskflowError {
  constructor(message = "The workspace owner cannot be removed.") {
    super("OWNER_REMOVAL_FORBIDDEN", message, { status: 403 });
    this.name = "OwnerRemovalForbiddenError";
  }
}

export class RoleEscalationForbiddenError extends TaskflowError {
  constructor(message = "That role change is not allowed.") {
    super("ROLE_ESCALATION_FORBIDDEN", message, { status: 403 });
    this.name = "RoleEscalationForbiddenError";
  }
}

export class StaleVersionError extends TaskflowError {
  readonly latest: unknown;
  constructor(latest: unknown, message = "This item changed while you were editing it.") {
    super("STALE_VERSION", message, { status: 409 });
    this.name = "StaleVersionError";
    this.latest = latest;
  }
}

export class OfflineUnsafeActionError extends TaskflowError {
  constructor(message = "This action requires an active connection.") {
    super("OFFLINE_UNSAFE_ACTION", message, { status: 503 });
    this.name = "OfflineUnsafeActionError";
  }
}

export class AttachmentTooLargeError extends TaskflowError {
  constructor(message = "That file is too large. Maximum size is 10 MB.") {
    super("ATTACHMENT_TOO_LARGE", message, { status: 413 });
    this.name = "AttachmentTooLargeError";
  }
}

export class AttachmentTypeNotAllowedError extends TaskflowError {
  constructor(message = "That file type is not allowed.") {
    super("ATTACHMENT_TYPE_NOT_ALLOWED", message, { status: 415 });
    this.name = "AttachmentTypeNotAllowedError";
  }
}

export class AttachmentNotFoundError extends TaskflowError {
  constructor(message = "Attachment not found.") {
    super("ATTACHMENT_NOT_FOUND", message, { status: 404 });
    this.name = "AttachmentNotFoundError";
  }
}

export class AttachmentPermissionDeniedError extends TaskflowError {
  constructor(message = "You cannot manage this attachment.") {
    super("ATTACHMENT_PERMISSION_DENIED", message, { status: 403 });
    this.name = "AttachmentPermissionDeniedError";
  }
}

export class StorageUnavailableError extends TaskflowError {
  constructor(message = "File storage is temporarily unavailable.") {
    super("STORAGE_UNAVAILABLE", message, { status: 503 });
    this.name = "StorageUnavailableError";
  }
}

export class PresenceUnavailableError extends TaskflowError {
  constructor(message = "Presence is temporarily unavailable.") {
    super("PRESENCE_UNAVAILABLE", message, { status: 503 });
    this.name = "PresenceUnavailableError";
  }
}

export class QueuedMutationConflictError extends TaskflowError {
  constructor(message = "A queued change conflicts with the latest server version.") {
    super("QUEUED_MUTATION_CONFLICT", message, { status: 409 });
    this.name = "QueuedMutationConflictError";
  }
}

export class AuditAccessDeniedError extends TaskflowError {
  constructor(message = "You cannot view that audit history.") {
    super("AUDIT_ACCESS_DENIED", message, { status: 403 });
    this.name = "AuditAccessDeniedError";
  }
}

export class AttachmentNotUploadedError extends TaskflowError {
  constructor(message = "That file is not available in storage yet.") {
    super("ATTACHMENT_NOT_UPLOADED", message, { status: 422 });
    this.name = "AttachmentNotUploadedError";
  }
}

export class AttachmentCompletionForbiddenError extends TaskflowError {
  constructor(message = "Only the uploader can complete this upload.") {
    super("ATTACHMENT_COMPLETION_FORBIDDEN", message, { status: 403 });
    this.name = "AttachmentCompletionForbiddenError";
  }
}

export class AttachmentStateConflictError extends TaskflowError {
  constructor(message = "This attachment is not in a state that allows that action.") {
    super("ATTACHMENT_STATE_CONFLICT", message, { status: 409 });
    this.name = "AttachmentStateConflictError";
  }
}

export class AttachmentIntegrityError extends TaskflowError {
  constructor(message = "Attachment failed integrity checks.") {
    super("ATTACHMENT_INTEGRITY", message, { status: 422 });
    this.name = "AttachmentIntegrityError";
  }
}

export class NoChangesError extends TaskflowError {
  constructor(message = "No changes to apply.") {
    super("NO_CHANGES", message, { status: 422 });
    this.name = "NoChangesError";
  }
}

export class InvalidPatchError extends TaskflowError {
  constructor(message = "The update patch is invalid or empty.") {
    super("INVALID_PATCH", message, { status: 422 });
    this.name = "InvalidPatchError";
  }
}

export class AuditWriteError extends TaskflowError {
  constructor(message = "Could not record audit history for this change.") {
    super("AUDIT_WRITE_ERROR", message, { status: 500, expose: false });
    this.name = "AuditWriteError";
  }
}

export class RealtimeReconnectFailedError extends TaskflowError {
  constructor(message = "Realtime reconnection failed.") {
    super("REALTIME_RECONNECT_FAILED", message, { status: 503 });
    this.name = "RealtimeReconnectFailedError";
  }
}

export class OfflineConflictPayloadError extends TaskflowError {
  constructor(message = "Conflict details were incomplete.") {
    super("OFFLINE_CONFLICT_PAYLOAD", message, { status: 422 });
    this.name = "OfflineConflictPayloadError";
  }
}

export class StoragePolicyConfigurationError extends TaskflowError {
  constructor(message = "Attachment storage is not configured.") {
    super("STORAGE_POLICY_CONFIGURATION", message, { status: 503 });
    this.name = "StoragePolicyConfigurationError";
  }
}

export class SchemaNotReadyError extends TaskflowError {
  constructor(
    message = "TaskFlow database tables are missing. Apply the SQL migrations in supabase/migrations/ (Phase 1 → Phase 3 stabilization) in the Supabase SQL Editor, then retry.",
  ) {
    super("SCHEMA_NOT_READY", message, { status: 503, expose: true });
    this.name = "SchemaNotReadyError";
  }
}

