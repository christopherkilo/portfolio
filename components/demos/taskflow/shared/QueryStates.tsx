"use client";

import { Button } from "@/components/demos/taskflow/ui/Button";
import { EmptyState } from "@/components/demos/taskflow/ui/EmptyState";
import { Skeleton } from "@/components/demos/taskflow/ui/Skeleton";

export function QueryLoadingState({ label = "Loading workspace…" }: { label?: string }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <p className="text-sm text-muted">{label}</p>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function QueryErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const isSchema =
    typeof message === "string" &&
    /database tables are missing|SCHEMA_NOT_READY|Apply the SQL migrations/i.test(
      message,
    );

  return (
    <EmptyState
      title={isSchema ? "Database not set up yet" : "Couldn’t load workspace"}
      description={
        message ??
        "Check your connection and Supabase configuration, then try again."
      }
      actionLabel={onRetry ? "Retry" : undefined}
      onAction={onRetry}
    />
  );
}

export function AuthRequiredState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-8 text-center">
      <h2 className="font-display text-lg font-semibold">Sign in to TaskFlow</h2>
      <p className="max-w-md text-sm text-muted">
        TaskFlow now persists workspaces, projects, and tasks in Supabase. Sign
        in with Google to continue.
      </p>
      <Button href="/demos/taskflow/signin">Continue with Google</Button>
    </div>
  );
}
