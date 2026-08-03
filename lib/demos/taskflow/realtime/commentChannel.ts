"use client";

export const COMMENT_REALTIME_TABLES = ["comments"] as const;

export type CommentRealtimeEvent = {
  kind: "comment_changed";
  taskId: string;
  commentId: string;
};
