"use client";

/**
 * TaskFlow client store entry.
 * Server entities are loaded via TanStack Query (`lib/demos/taskflow/api/hooks.ts`).
 * Zustand holds UI preferences and ephemeral chrome only.
 */
export {
  useTaskflowUiStore,
  useWorkspaceStore,
  DEFAULT_UI_SETTINGS,
  type UiSettings,
} from "@/lib/demos/taskflow/store/ui";
