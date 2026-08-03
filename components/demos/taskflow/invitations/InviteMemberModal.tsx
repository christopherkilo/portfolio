"use client";

import { useState } from "react";
import { Button } from "@/components/demos/taskflow/ui/Button";
import { Modal } from "@/components/demos/taskflow/ui/Modal";
import { TaskflowApiError } from "@/lib/demos/taskflow/api/client";
import { useInviteMember } from "@/lib/demos/taskflow/queries";
import type { WorkspaceRole } from "@/server/taskflow/types/database";

const INVITE_ROLES: Exclude<WorkspaceRole, "owner">[] = [
  "admin",
  "member",
  "viewer",
];

export function InviteMemberModal({
  open,
  workspaceId,
  onClose,
}: {
  open: boolean;
  workspaceId: string;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Invite member">
      {open ? (
        <InviteMemberForm
          key={workspaceId}
          workspaceId={workspaceId}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  );
}

function InviteMemberForm({
  workspaceId,
  onClose,
}: {
  workspaceId: string;
  onClose: () => void;
}) {
  const invite = useInviteMember(workspaceId);
  const [email, setEmail] = useState("");
  const [role, setRole] =
    useState<Exclude<WorkspaceRole, "owner">>("member");
  const [error, setError] = useState("");
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);

  async function submit() {
    setError("");
    setAcceptUrl(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter an email address.");
      return;
    }
    try {
      const result = await invite.mutateAsync({ email: trimmed, role });
      if (result.acceptUrl && process.env.NODE_ENV !== "production") {
        setAcceptUrl(result.acceptUrl);
      } else {
        onClose();
      }
    } catch (err) {
      setError(
        err instanceof TaskflowApiError
          ? err.message
          : "Couldn’t send invitation.",
      );
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <label className="block text-xs text-muted">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="teammate@company.com"
          className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm text-ink"
        />
      </label>

      <label className="block text-xs text-muted">
        Role
        <select
          value={role}
          onChange={(event) =>
            setRole(event.target.value as Exclude<WorkspaceRole, "owner">)
          }
          className="mt-1 h-10 w-full rounded-lg border border-border bg-elevated px-2 text-sm capitalize text-ink"
        >
          {INVITE_ROLES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      {acceptUrl ? (
        <div className="rounded-lg border border-border bg-elevated/50 px-3 py-2">
          <p className="text-xs font-medium text-ink">
            Invitation created (development)
          </p>
          <p className="mt-1 break-all text-xs text-muted">{acceptUrl}</p>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-accent hover:underline"
            onClick={() => void navigator.clipboard?.writeText(acceptUrl)}
          >
            Copy accept URL
          </button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={invite.isPending}
        >
          {acceptUrl ? "Done" : "Cancel"}
        </Button>
        {!acceptUrl ? (
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={invite.isPending}
          >
            {invite.isPending ? "Sending…" : "Send invite"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
