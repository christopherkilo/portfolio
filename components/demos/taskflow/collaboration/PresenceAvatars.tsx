"use client";

import { useMemo } from "react";
import { useTaskflowMe } from "@/lib/demos/taskflow/api/hooks";
import { useTaskflowUiStore } from "@/lib/demos/taskflow/store";
import { Tooltip } from "@/components/demos/taskflow/ui/Tooltip";
import { cn } from "@/lib/demos/taskflow/utils";

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "TF";
}

export function PresenceAvatars({
  max = 5,
  entityId,
}: {
  max?: number;
  /** When set, highlight users viewing this entity. */
  entityId?: string | null;
}) {
  const me = useTaskflowMe();
  const users = useTaskflowUiStore((s) => s.presenceUsers);
  const meId = me.data?.id;

  const visible = useMemo(() => {
    const scoped = entityId
      ? users.filter((u) => u.currentEntityId === entityId)
      : users;
    return scoped.slice(0, max);
  }, [users, entityId, max]);

  if (!visible.length) return null;

  return (
    <div
      className="flex items-center -space-x-1.5"
      aria-label={
        entityId
          ? `${visible.map((u) => u.displayName).join(", ")} viewing this task`
          : `${visible.length} online in workspace`
      }
    >
      {visible.map((user) => (
        <Tooltip
          key={user.userId}
          content={`${user.displayName}${user.currentView ? ` · ${user.currentView}` : ""}`}
        >
          <span
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full border-2 border-surface bg-accent/20 text-[10px] font-semibold text-ink",
              user.userId === meId && "ring-1 ring-accent/40",
            )}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="size-full rounded-full object-cover"
              />
            ) : (
              initials(user.displayName)
            )}
          </span>
        </Tooltip>
      ))}
      {users.length > max && !entityId ? (
        <span className="pl-2 text-[11px] text-muted">+{users.length - max}</span>
      ) : null}
    </div>
  );
}

export function EntityPresenceLine({ entityId }: { entityId: string }) {
  const me = useTaskflowMe();
  const users = useTaskflowUiStore((s) => s.presenceUsers);
  const viewers = users.filter(
    (u) => u.currentEntityId === entityId && u.userId !== me.data?.id,
  );
  if (!viewers.length) return null;
  const names = viewers.map((u) => u.displayName);
  const label =
    names.length === 1
      ? `${names[0]} is viewing this task.`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are viewing this task.`
        : `${names[0]}, ${names[1]}, and ${names.length - 2} others are viewing this task.`;
  return <p className="text-xs text-muted">{label}</p>;
}
