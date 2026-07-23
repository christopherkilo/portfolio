"use client";

import { motion } from "framer-motion";
import { ACTIVITY, TEAM, getMember } from "@/lib/demos/taskflow/data";
import { formatDateLong, cn } from "@/lib/demos/taskflow/utils";
import { staggerContainer, staggerItem, springHover } from "@/lib/demos/taskflow/animation";

const statusDot = {
  online: "bg-success",
  away: "bg-warning",
  offline: "bg-muted",
};

export function TeamView() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section>
        <h2 className="mb-4 text-sm font-semibold">Team members</h2>
        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {TEAM.map((member) => (
            <motion.article
              key={member.id}
              variants={staggerItem}
              whileHover={{ y: -3 }}
              transition={springHover}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                    {member.avatar}
                  </span>
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-surface",
                      statusDot[member.status],
                    )}
                    aria-label={member.status}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{member.name}</h3>
                  <p className="text-xs text-muted">{member.role}</p>
                  <a
                    href={`mailto:${member.email}`}
                    className="mt-2 block text-xs text-accent hover:underline"
                  >
                    {member.email}
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">Activity feed</h2>
        <ul className="mt-4 space-y-4">
          {ACTIVITY.map((item) => {
            const user = getMember(item.userId);
            return (
              <li key={item.id} className="flex gap-3 text-sm">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-elevated text-[11px] font-semibold">
                  {user?.avatar}
                </span>
                <div>
                  <p>
                    <span className="font-medium">{user?.name}</span>{" "}
                    <span className="text-muted">{item.action}</span>{" "}
                    <span className="font-medium">{item.target}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateLong(item.timestamp)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
