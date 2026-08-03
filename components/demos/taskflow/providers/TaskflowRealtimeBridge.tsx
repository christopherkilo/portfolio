"use client";

import {
  useActiveWorkspaceId,
  useTaskflowMe,
} from "@/lib/demos/taskflow/api/hooks";
import { useTaskflowRealtime } from "@/lib/demos/taskflow/realtime/useTaskflowRealtime";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { maybeCreateDueDateNotifications } from "@/lib/demos/taskflow/offline/dueDateNudge";
import { replayQueuedMutations } from "@/lib/demos/taskflow/offline/replay";
import {
  computeOfflineQueueCounts,
  listQueuedMutations,
} from "@/lib/demos/taskflow/offline/mutationQueue";
import { useTaskflowUiStore } from "@/lib/demos/taskflow/store";

export function TaskflowRealtimeBridge() {
  const pathname = usePathname();
  const { workspaceId } = useActiveWorkspaceId();
  const me = useTaskflowMe();
  const setOfflineQueueCounts = useTaskflowUiStore(
    (s) => s.setOfflineQueueCounts,
  );
  const connectionStatus = useTaskflowUiStore((s) => s.connectionStatus);

  useTaskflowRealtime(workspaceId, me.data?.id ?? null, {
    displayName:
      me.data?.profile.display_name || me.data?.email || "TaskFlow user",
    avatarUrl: me.data?.profile.avatar_url,
    currentView: pathname ?? undefined,
  });

  useEffect(() => {
    void listQueuedMutations().then((items) =>
      setOfflineQueueCounts(computeOfflineQueueCounts(items)),
    );
  }, [setOfflineQueueCounts, connectionStatus]);

  useEffect(() => {
    if (!workspaceId || connectionStatus !== "online") return;
    void maybeCreateDueDateNotifications(workspaceId);
    void replayQueuedMutations();
  }, [workspaceId, connectionStatus]);

  return null;
}
