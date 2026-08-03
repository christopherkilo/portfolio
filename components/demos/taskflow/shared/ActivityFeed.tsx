"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ActivityItem, TeamMember } from "@/lib/demos/taskflow/data";
import {
  describeActivity,
  findMember,
} from "@/lib/demos/taskflow/store/selectors";
import { formatRelativeTime } from "@/lib/demos/taskflow/utils";
import { staggerContainer, staggerItem } from "@/lib/demos/taskflow/animation";

export function ActivityFeed({
  items,
  members,
  emptyTitle = "No recent activity",
  emptyDescription = "Create a task or move a card to see live workspace activity here.",
}: {
  items: ActivityItem[];
  members: TeamMember[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const reduced = useReducedMotion();

  if (!items.length) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted">
        <span className="block font-medium text-ink">{emptyTitle}</span>
        {emptyDescription}
      </p>
    );
  }

  const list = (
    <ul className="space-y-3">
      {items.map((item) => {
        const user = findMember(members, item.userId);
        const message = describeActivity(item);
        return (
          <li key={item.id} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent">
              {user?.avatar ?? "?"}
            </span>
            <div className="min-w-0">
              <p>
                <span className="font-medium">{user?.name ?? "Someone"}</span>{" "}
                <span className="text-muted">{message}</span>
              </p>
              {item.oldValue && item.newValue ? (
                <p className="mt-1 text-xs text-muted">
                  <span className="line-through opacity-70">{item.oldValue}</span>
                  <span aria-hidden className="mx-1.5">
                    →
                  </span>
                  <span className="font-medium text-ink">{item.newValue}</span>
                </p>
              ) : null}
              <p className="mt-1 text-xs text-muted">
                <time dateTime={item.timestamp}>
                  {formatRelativeTime(item.timestamp)}
                </time>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );

  if (reduced) return list;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <ul className="space-y-3">
        {items.map((item) => {
          const user = findMember(members, item.userId);
          const message = describeActivity(item);
          return (
            <motion.li
              key={item.id}
              variants={staggerItem}
              className="flex items-start gap-3 text-sm"
            >
              <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent">
                {user?.avatar ?? "?"}
              </span>
              <div className="min-w-0">
                <p>
                  <span className="font-medium">{user?.name ?? "Someone"}</span>{" "}
                  <span className="text-muted">{message}</span>
                </p>
                {item.oldValue && item.newValue ? (
                  <p className="mt-1 text-xs text-muted">
                    <span className="line-through opacity-70">
                      {item.oldValue}
                    </span>
                    <span aria-hidden className="mx-1.5">
                      →
                    </span>
                    <span className="font-medium text-ink">{item.newValue}</span>
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-muted">
                  <time dateTime={item.timestamp}>
                    {formatRelativeTime(item.timestamp)}
                  </time>
                </p>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}
