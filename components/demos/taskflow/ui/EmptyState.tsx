"use client";

import { Inbox } from "lucide-react";
import { Button } from "@/components/demos/taskflow/ui/Button";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <div className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Inbox className="size-4" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {actionLabel && actionHref ? (
        <div className="mt-4">
          <Button href={actionHref}>{actionLabel}</Button>
        </div>
      ) : null}
      {actionLabel && onAction && !actionHref ? (
        <div className="mt-4">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
