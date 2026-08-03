"use client";

export type {
  ConnectionStatus,
  PresenceUser,
} from "@/lib/demos/taskflow/realtime/RealtimeManager";

/** Presence is ephemeral Realtime state — never persisted to Postgres. */
export const PRESENCE_SAFE_FIELDS = [
  "userId",
  "displayName",
  "avatarUrl",
  "workspaceId",
  "currentView",
  "currentEntityId",
  "lastActiveAt",
] as const;
