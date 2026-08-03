export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";
export type ProjectStatus = "active" | "planning" | "paused" | "done";
export type TaskStatus =
  | "backlog"
  | "todo"
  | "in-progress"
  | "review"
  | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceRow = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type WorkspaceMemberRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
};

export type ProjectRow = {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color: string;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  version: number;
};

export type TaskRow = {
  id: string;
  workspace_id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  labels: string[];
  estimate: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  version: number;
};

export type ActivityEventRow = {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  old_value: string | null;
  new_value: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  changes: Record<string, unknown>;
  request_id: string | null;
  source: string;
  created_at: string;
};

export type TaskAttachmentRow = {
  id: string;
  workspace_id: string;
  task_id: string;
  uploaded_by: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  status: "pending" | "ready" | "failed" | "deleted";
  completed_at: string | null;
  failed_at: string | null;
  activity_recorded_at: string | null;
  created_at: string;
  deleted_at: string | null;
};

export type NotificationPreferenceRow = {
  user_id: string;
  assignments: boolean;
  comments: boolean;
  mentions: boolean;
  due_dates: boolean;
  project_changes: boolean;
  updated_at: string;
};

export type TaskAssigneeRow = {
  task_id: string;
  user_id: string;
  workspace_id: string;
  assigned_by: string | null;
  assigned_at: string;
};

export type CommentRow = {
  id: string;
  workspace_id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type WorkspaceInvitationRow = {
  id: string;
  workspace_id: string;
  email: string;
  role: Exclude<WorkspaceRole, "owner">;
  token_hash: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type NotificationType =
  | "task_assigned"
  | "comment_added"
  | "invitation_received"
  | "project_due_soon"
  | "task_due_soon"
  | "task_completed"
  | "role_changed"
  | "member_removed";

export type NotificationRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  type: NotificationType;
  entity_type: string;
  entity_id: string | null;
  actor_id: string | null;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  dedupe_key: string | null;
  group_key: string | null;
  occurrence_count: number;
  last_occurred_at: string;
  read_at: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      workspaces: {
        Row: WorkspaceRow;
        Insert: {
          id?: string;
          name: string;
          description?: string;
          created_by: string;
          archived_at?: string | null;
        };
        Update: Partial<Omit<WorkspaceRow, "id" | "created_by" | "created_at">>;
        Relationships: [];
      };
      workspace_members: {
        Row: WorkspaceMemberRow;
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: WorkspaceRole;
        };
        Update: Partial<Pick<WorkspaceMemberRow, "role">>;
        Relationships: [];
      };
      projects: {
        Row: ProjectRow;
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string;
          status?: ProjectStatus;
          color?: string;
          due_date?: string | null;
          created_by: string;
          archived_at?: string | null;
        };
        Update: Partial<
          Omit<ProjectRow, "id" | "workspace_id" | "created_by" | "created_at">
        >;
        Relationships: [];
      };
      tasks: {
        Row: TaskRow;
        Insert: {
          id?: string;
          workspace_id: string;
          project_id: string;
          title: string;
          description?: string;
          status?: TaskStatus;
          priority?: TaskPriority;
          assignee_id?: string | null;
          due_date?: string | null;
          labels?: string[];
          estimate?: number | null;
          created_by: string;
          archived_at?: string | null;
        };
        Update: Partial<
          Omit<TaskRow, "id" | "workspace_id" | "created_by" | "created_at">
        >;
        Relationships: [];
      };
      activity_events: {
        Row: ActivityEventRow;
        Insert: {
          id?: string;
          workspace_id: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          entity_title?: string | null;
          old_value?: string | null;
          new_value?: string | null;
          summary: string;
          metadata?: Record<string, unknown>;
          changes?: Record<string, unknown>;
          request_id?: string | null;
          source?: string;
        };
        Update: Partial<ActivityEventRow>;
        Relationships: [];
      };
      task_assignees: {
        Row: TaskAssigneeRow;
        Insert: {
          task_id: string;
          user_id: string;
          workspace_id: string;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Update: Partial<TaskAssigneeRow>;
        Relationships: [];
      };
      comments: {
        Row: CommentRow;
        Insert: {
          id?: string;
          workspace_id: string;
          task_id: string;
          author_id: string;
          body: string;
          deleted_at?: string | null;
        };
        Update: Partial<Pick<CommentRow, "body" | "deleted_at" | "updated_at">>;
        Relationships: [];
      };
      workspace_invitations: {
        Row: WorkspaceInvitationRow;
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role: Exclude<WorkspaceRole, "owner">;
          token_hash: string;
          invited_by: string;
          expires_at: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
        };
        Update: Partial<
          Pick<WorkspaceInvitationRow, "accepted_at" | "revoked_at">
        >;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: {
          id?: string;
          user_id: string;
          workspace_id: string;
          type: NotificationType;
          entity_type: string;
          entity_id?: string | null;
          actor_id?: string | null;
          title: string;
          message?: string;
          metadata?: Record<string, unknown>;
          dedupe_key?: string | null;
          group_key?: string | null;
          occurrence_count?: number;
          last_occurred_at?: string;
          read_at?: string | null;
        };
        Update: Partial<
          Pick<
            NotificationRow,
            | "read_at"
            | "occurrence_count"
            | "last_occurred_at"
            | "title"
            | "message"
            | "metadata"
          >
        >;
        Relationships: [];
      };
      task_attachments: {
        Row: TaskAttachmentRow;
        Insert: {
          id?: string;
          workspace_id: string;
          task_id: string;
          uploaded_by: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          status?: TaskAttachmentRow["status"];
          completed_at?: string | null;
          failed_at?: string | null;
          activity_recorded_at?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<
          Pick<
            TaskAttachmentRow,
            | "status"
            | "completed_at"
            | "failed_at"
            | "activity_recorded_at"
            | "deleted_at"
          >
        >;
        Relationships: [];
      };
      notification_preferences: {
        Row: NotificationPreferenceRow;
        Insert: {
          user_id: string;
          assignments?: boolean;
          comments?: boolean;
          mentions?: boolean;
          due_dates?: boolean;
          project_changes?: boolean;
          updated_at?: string;
        };
        Update: Partial<
          Omit<NotificationPreferenceRow, "user_id">
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_workspace_invitation: {
        Args: { p_token_hash: string };
        Returns: {
          invitation_id: string;
          workspace_id: string;
          role: WorkspaceRole;
        }[];
      };
      create_taskflow_notification: {
        Args: {
          p_user_id: string;
          p_workspace_id: string;
          p_type: NotificationType;
          p_entity_type: string;
          p_entity_id: string | null;
          p_title: string;
          p_message?: string;
          p_metadata?: Record<string, unknown>;
          p_dedupe_key?: string | null;
        };
        Returns: NotificationRow;
      };
      create_or_group_notification: {
        Args: {
          p_user_id: string;
          p_workspace_id: string;
          p_type: NotificationType;
          p_entity_type: string;
          p_entity_id: string | null;
          p_title: string;
          p_message?: string;
          p_metadata?: Record<string, unknown>;
          p_dedupe_key?: string | null;
          p_group_key?: string | null;
        };
        Returns: NotificationRow;
      };
      update_task_versioned: {
        Args: {
          p_task_id: string;
          p_expected_version: number;
          p_patch?: Record<string, unknown>;
        };
        Returns: TaskRow;
      };
      update_project_versioned: {
        Args: {
          p_project_id: string;
          p_expected_version: number;
          p_patch?: Record<string, unknown>;
        };
        Returns: ProjectRow;
      };
      cleanup_stale_pending_attachments: {
        Args: { p_older_than?: string };
        Returns: number;
      };
      create_task_with_assignees: {
        Args: {
          p_workspace_id: string;
          p_project_id: string;
          p_title: string;
          p_description?: string;
          p_status?: TaskStatus;
          p_priority?: TaskPriority;
          p_due_date?: string | null;
          p_labels?: string[];
          p_estimate?: number | null;
          p_assignee_ids?: string[];
        };
        Returns: TaskRow;
      };
      create_workspace_invitation: {
        Args: {
          p_workspace_id: string;
          p_email: string;
          p_role: WorkspaceRole;
          p_token_hash: string;
          p_expires_at: string;
        };
        Returns: WorkspaceInvitationRow;
      };
    };
    Enums: {
      workspace_role: WorkspaceRole;
      project_status: ProjectStatus;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
};
