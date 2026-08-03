"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ProgressBar } from "@/components/demos/taskflow/ui/ProgressBar";
import { Button } from "@/components/demos/taskflow/ui/Button";
import { ActivityFeed } from "@/components/demos/taskflow/shared/ActivityFeed";
import {
  QueryErrorState,
  QueryLoadingState,
} from "@/components/demos/taskflow/shared/QueryStates";
import { InviteMemberModal } from "@/components/demos/taskflow/invitations/InviteMemberModal";
import { cn, formatRelativeTime } from "@/lib/demos/taskflow/utils";
import {
  staggerContainer,
  staggerItem,
  springHover,
} from "@/lib/demos/taskflow/animation";
import {
  useTaskflowMe,
  useWorkspaceData,
} from "@/lib/demos/taskflow/api/hooks";
import { TaskflowApiError } from "@/lib/demos/taskflow/api/client";
import { isConnectionOffline } from "@/lib/demos/taskflow/offline/safeMutations";
import {
  memberWorkloadStats,
  recentActivity,
  type WorkloadLabel,
} from "@/lib/demos/taskflow/store/selectors";
import {
  usePendingInvitations,
  useRemoveMember,
  useRevokeInvitation,
  useUpdateMemberRole,
} from "@/lib/demos/taskflow/queries";
import type { WorkspaceRole } from "@/server/taskflow/types/database";

const statusDot = {
  online: "bg-success",
  away: "bg-warning",
  offline: "bg-muted",
};

const labelStyles: Record<WorkloadLabel, string> = {
  Light: "bg-success/15 text-success",
  Normal: "bg-accent/15 text-accent",
  Busy: "bg-warning/15 text-warning",
  Overloaded: "bg-danger/15 text-danger",
};

const ROLE_OPTIONS: Exclude<WorkspaceRole, "owner">[] = [
  "admin",
  "member",
  "viewer",
];

function isManager(role: string) {
  return role === "owner" || role === "admin";
}

function canChangeRole(actorRole: string, targetRole: string) {
  if (!isManager(actorRole)) return false;
  if (targetRole === "owner") return false;
  if (actorRole === "admin" && targetRole === "admin") return false;
  return true;
}

function canRemoveMember(
  actorRole: string,
  actorId: string | null,
  targetRole: string,
  targetId: string,
) {
  if (!actorId || !isManager(actorRole)) return false;
  if (actorId === targetId) return false;
  if (targetRole === "owner") return false;
  if (actorRole === "admin" && (targetRole === "admin" || targetRole === "owner")) {
    return false;
  }
  return true;
}

function roleSelectOptions(actorRole: string) {
  if (actorRole === "owner") return ROLE_OPTIONS;
  return ROLE_OPTIONS.filter((role) => role !== "admin");
}

export function TeamView() {
  const {
    members,
    tasks,
    activity,
    workspaceId,
    isLoading,
    isError,
    error,
    refetch,
  } = useWorkspaceData();
  const me = useTaskflowMe();
  const currentUserId = me.data?.id ?? null;
  const myRole =
    members.find((member) => member.id === currentUserId)?.role ?? "viewer";
  const manage = isManager(myRole);

  const updateRole = useUpdateMemberRole(workspaceId);
  const removeMember = useRemoveMember(workspaceId);
  const invitations = usePendingInvitations(manage ? workspaceId : null);
  const revokeInvitation = useRevokeInvitation(workspaceId);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  const feed = useMemo(() => recentActivity(activity, 12), [activity]);
  const rows = useMemo(
    () => members.map((member) => memberWorkloadStats(tasks, member)),
    [members, tasks],
  );

  if (isLoading) return <QueryLoadingState label="Loading team…" />;
  if (isError) {
    const message =
      error instanceof TaskflowApiError ? error.message : undefined;
    return <QueryErrorState message={message} onRetry={() => void refetch()} />;
  }
  if (!workspaceId) {
    return (
      <QueryErrorState message="No workspace available. Create or join a workspace to view your team." />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Team members</h2>
          {manage ? (
            <Button
              type="button"
              disabled={isConnectionOffline()}
              title={
                isConnectionOffline()
                  ? "Invites require a connection"
                  : undefined
              }
              onClick={() => {
                if (isConnectionOffline()) {
                  setActionError("Invites require an active connection.");
                  return;
                }
                setInviteOpen(true);
              }}
            >
              Invite member
            </Button>
          ) : null}
        </div>

        {actionError ? (
          <p role="alert" className="text-xs text-danger">
            {actionError}
          </p>
        ) : null}

        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {rows.map((row) => {
            const role = row.member.role as WorkspaceRole | string;
            const showRoleSelect = canChangeRole(myRole, role);
            const showRemove = canRemoveMember(
              myRole,
              currentUserId,
              role,
              row.member.id,
            );

            return (
              <motion.article
                key={row.member.id}
                variants={staggerItem}
                whileHover={{ y: -3 }}
                transition={springHover}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                      {row.member.avatar}
                    </span>
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-surface",
                        statusDot[row.member.status],
                      )}
                      aria-label={row.member.status}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold">
                          {row.member.name}
                        </h3>
                        {showRoleSelect ? (
                          <label className="mt-1 block text-[11px] text-muted">
                            Role
                            <select
                              value={role}
                              disabled={updateRole.isPending || isConnectionOffline()}
                              title={
                                isConnectionOffline()
                                  ? "Role changes require a connection"
                                  : undefined
                              }
                              onChange={(event) => {
                                if (isConnectionOffline()) {
                                  setActionError(
                                    "Role changes require an active connection.",
                                  );
                                  return;
                                }
                                const next = event.target
                                  .value as Exclude<WorkspaceRole, "owner">;
                                setActionError("");
                                void updateRole
                                  .mutateAsync({
                                    userId: row.member.id,
                                    role: next,
                                  })
                                  .catch((err: unknown) => {
                                    setActionError(
                                      err instanceof TaskflowApiError
                                        ? err.message
                                        : "Couldn’t update role.",
                                    );
                                  });
                              }}
                              className="mt-1 h-9 w-full rounded-lg border border-border bg-elevated px-2 text-xs capitalize text-ink"
                            >
                              {roleSelectOptions(myRole).map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : (
                          <p className="text-xs capitalize text-muted">
                            {role}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[11px] font-medium",
                          labelStyles[row.label],
                        )}
                      >
                        {row.label}
                      </span>
                    </div>
                    <a
                      href={`mailto:${row.member.email}`}
                      className="mt-2 block text-xs text-accent hover:underline"
                    >
                      {row.member.email}
                    </a>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-[11px] text-muted">
                        <span>Completion {row.completion}%</span>
                        <span>
                          {row.active} active · {row.overdue} overdue
                        </span>
                      </div>
                      <ProgressBar value={row.completion} />
                      <div
                        className="grid grid-cols-4 gap-1"
                        aria-label={`Workload breakdown for ${row.member.name}`}
                      >
                        <Segment label="Assigned" value={row.assigned} />
                        <Segment label="Done" value={row.completed} />
                        <Segment label="Active" value={row.active} />
                        <Segment label="Overdue" value={row.overdue} />
                      </div>
                    </div>
                    {showRemove ? (
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={
                            removeMember.isPending || isConnectionOffline()
                          }
                          title={
                            isConnectionOffline()
                              ? "Member removal requires a connection"
                              : undefined
                          }
                          onClick={() => {
                            if (isConnectionOffline()) {
                              setActionError(
                                "Member removal requires an active connection.",
                              );
                              return;
                            }
                            setActionError("");
                            void removeMember
                              .mutateAsync(row.member.id)
                              .catch((err: unknown) => {
                                setActionError(
                                  err instanceof TaskflowApiError
                                    ? err.message
                                    : "Couldn’t remove member.",
                                );
                              });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        {manage ? (
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">Pending invitations</h2>
            {invitations.isLoading ? (
              <p className="mt-3 text-xs text-muted" role="status">
                Loading invitations…
              </p>
            ) : invitations.isError ? (
              <p className="mt-3 text-xs text-danger" role="alert">
                {invitations.error instanceof TaskflowApiError
                  ? invitations.error.message
                  : "Couldn’t load invitations."}
              </p>
            ) : (invitations.data?.length ?? 0) === 0 ? (
              <div className="mt-3 rounded-lg border border-dashed border-border px-3 py-6 text-center">
                <p className="text-xs font-medium text-ink">
                  No pending invitations
                </p>
                <p className="mt-1 text-xs text-muted">
                  Invite a teammate to collaborate in this workspace.
                </p>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInviteOpen(true)}
                  >
                    Invite member
                  </Button>
                </div>
              </div>
            ) : (
              <ul className="mt-3 space-y-2" data-density-list>
                {(invitations.data ?? []).map((invitation) => (
                  <li
                    key={invitation.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-elevated/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {invitation.email}
                      </p>
                      <p className="text-xs capitalize text-muted">
                        {invitation.role} · expires{" "}
                        {formatRelativeTime(invitation.expires_at)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={revokeInvitation.isPending}
                      onClick={() => {
                        setActionError("");
                        void revokeInvitation
                          .mutateAsync(invitation.id)
                          .catch((err: unknown) => {
                            setActionError(
                              err instanceof TaskflowApiError
                                ? err.message
                                : "Couldn’t revoke invitation.",
                            );
                          });
                      }}
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">Activity feed</h2>
        <div className="mt-4">
          <ActivityFeed items={feed} members={members} />
        </div>
      </section>

      <InviteMemberModal
        open={inviteOpen}
        workspaceId={workspaceId}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  );
}

function Segment({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-elevated/70 px-1.5 py-1 text-center">
      <p className="text-[10px] text-muted">{label}</p>
      <p className="text-xs font-semibold text-ink">{value}</p>
    </div>
  );
}
