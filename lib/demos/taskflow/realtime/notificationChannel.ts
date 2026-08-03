"use client";

export const NOTIFICATION_REALTIME_TABLES = ["notifications"] as const;

export type NotificationRealtimeEvent = {
  kind: "notification_changed";
  notificationId: string;
};
