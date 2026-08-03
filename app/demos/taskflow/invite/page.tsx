import type { Metadata } from "next";
import { Suspense } from "react";
import { AcceptInviteView } from "@/components/demos/taskflow/invitations/AcceptInviteView";

export const metadata: Metadata = { title: "Accept invitation" };

export default function TaskflowInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4 text-sm text-muted">
          Loading invitation…
        </div>
      }
    >
      <AcceptInviteView />
    </Suspense>
  );
}
