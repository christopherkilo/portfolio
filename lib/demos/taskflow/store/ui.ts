"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ConnectionStatus,
  PresenceUser,
} from "@/lib/demos/taskflow/realtime/RealtimeManager";
import type { OfflineQueueCounts } from "@/lib/demos/taskflow/offline/mutationQueue";

export type UiSettings = {
  density: "comfortable" | "compact";
  emailNotifs: boolean;
  pushNotifs: boolean;
  weekStart: "monday" | "sunday";
  displayName: string;
  email: string;
};

export type ConflictDraft = {
  queuedMutationId?: string;
  entityType: "task" | "project";
  entityId: string;
  draft: Record<string, unknown>;
  expectedVersion?: number;
  latestVersion?: number;
  latest: unknown;
  message: string;
  timestamp: string;
} | null;

type UiState = {
  settings: UiSettings;
  /** Persisted active workspace; validated against membership list in hooks. */
  activeWorkspaceId: string | null;
  selectedTaskId: string | null;
  selectedProjectId: string | null;
  createTaskOpen: boolean;
  shortcutHelpOpen: boolean;
  commandOpen: boolean;
  connectionStatus: ConnectionStatus;
  presenceUsers: PresenceUser[];
  conflictDraft: ConflictDraft;
  /** @deprecated Prefer offlineQueueCounts.pending */
  pendingOfflineCount: number;
  offlineQueueCounts: OfflineQueueCounts;
  updateSettings: (patch: Partial<UiSettings>) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSelectedProjectId: (id: string | null) => void;
  setCreateTaskOpen: (open: boolean) => void;
  setShortcutHelpOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setPresenceUsers: (users: PresenceUser[]) => void;
  setConflictDraft: (draft: ConflictDraft) => void;
  setPendingOfflineCount: (count: number) => void;
  setOfflineQueueCounts: (counts: OfflineQueueCounts) => void;
};

export const DEFAULT_UI_SETTINGS: UiSettings = {
  density: "comfortable",
  emailNotifs: true,
  pushNotifs: false,
  weekStart: "monday",
  displayName: "",
  email: "",
};

const EMPTY_COUNTS: OfflineQueueCounts = {
  pending: 0,
  failed: 0,
  conflicted: 0,
  totalNeedsAttention: 0,
};

/**
 * UI-only Zustand store.
 * Server data lives in TanStack Query; offline queue persistence is IndexedDB.
 */
export const useTaskflowUiStore = create<UiState>()(
  persist(
    (set) => ({
      settings: DEFAULT_UI_SETTINGS,
      activeWorkspaceId: null,
      selectedTaskId: null,
      selectedProjectId: null,
      createTaskOpen: false,
      shortcutHelpOpen: false,
      commandOpen: false,
      connectionStatus: "online",
      presenceUsers: [],
      conflictDraft: null,
      pendingOfflineCount: 0,
      offlineQueueCounts: EMPTY_COUNTS,
      updateSettings(patch) {
        set((state) => {
          const settings = { ...state.settings, ...patch };
          if (typeof document !== "undefined") {
            document.documentElement.dataset.density = settings.density;
          }
          return { settings };
        });
      },
      setActiveWorkspaceId(id) {
        set({ activeWorkspaceId: id });
      },
      setSelectedTaskId(id) {
        set({ selectedTaskId: id });
      },
      setSelectedProjectId(id) {
        set({ selectedProjectId: id });
      },
      setCreateTaskOpen(open) {
        set({ createTaskOpen: open });
      },
      setShortcutHelpOpen(open) {
        set({ shortcutHelpOpen: open });
      },
      setCommandOpen(open) {
        set({ commandOpen: open });
      },
      setConnectionStatus(status) {
        set({ connectionStatus: status });
      },
      setPresenceUsers(users) {
        set({ presenceUsers: users });
      },
      setConflictDraft(draft) {
        set({ conflictDraft: draft });
      },
      setPendingOfflineCount(count) {
        set({ pendingOfflineCount: count });
      },
      setOfflineQueueCounts(counts) {
        set({
          offlineQueueCounts: counts,
          pendingOfflineCount: counts.pending,
        });
      },
    }),
    {
      name: "taskflow-ui-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    },
  ),
);

/** @deprecated Use useTaskflowUiStore — kept as alias during migration. */
export const useWorkspaceStore = useTaskflowUiStore;
