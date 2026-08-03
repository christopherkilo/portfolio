"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/demos/taskflow/ui/Button";
import { TaskflowApiError } from "@/lib/demos/taskflow/api/client";
import { useTaskflowMe } from "@/lib/demos/taskflow/api/hooks";
import { DEMO_BASE } from "@/lib/demos/taskflow/data";
import { useAcceptInvitation } from "@/lib/demos/taskflow/queries";

export function AcceptInviteView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const me = useTaskflowMe();
  const accept = useAcceptInvitation();
  const [error, setError] = useState("");

  const unauthenticated =
    me.isError &&
    me.error instanceof TaskflowApiError &&
    me.error.status === 401;

  const signInHref = `${DEMO_BASE}/signin?next=${encodeURIComponent(
    `${DEMO_BASE}/invite?token=${encodeURIComponent(token)}`,
  )}`;

  async function acceptInvite() {
    if (!token) return;
    setError("");
    try {
      await accept.mutateAsync(token);
      router.replace(`${DEMO_BASE}/dashboard`);
    } catch (err) {
      setError(
        err instanceof TaskflowApiError
          ? err.message
          : "Couldn’t accept this invitation.",
      );
    }
  }

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-semibold">Invalid invite</h1>
        <p className="text-sm text-muted">
          This invitation link is missing a token. Ask your admin to resend the
          invite.
        </p>
        <Button href={`${DEMO_BASE}/signin`}>Go to sign in</Button>
      </div>
    );
  }

  if (me.isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-muted" role="status">
          Checking your session…
        </p>
      </div>
    );
  }

  if (unauthenticated) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-semibold">
          Accept your invitation
        </h1>
        <p className="text-sm text-muted">
          Sign in with the email this invitation was sent to, then join the
          workspace.
        </p>
        <Button href={signInHref}>Sign in to continue</Button>
      </div>
    );
  }

  if (me.isError) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-semibold">
          Session unavailable
        </h1>
        <p className="text-sm text-danger" role="alert">
          {me.error instanceof TaskflowApiError
            ? me.error.message
            : "Couldn’t verify your session."}
        </p>
        <Button href={signInHref}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-2xl font-semibold">
        Join this workspace
      </h1>
      <p className="text-sm text-muted">
        Signed in as{" "}
        {me.data?.profile.display_name || me.data?.email || "your account"}.
        Accept to become a member.
      </p>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          disabled={accept.isPending}
          onClick={() => void acceptInvite()}
        >
          {accept.isPending ? "Joining…" : "Accept invitation"}
        </Button>
        <Button href={`${DEMO_BASE}/dashboard`} variant="outline">
          Cancel
        </Button>
      </div>
    </div>
  );
}
