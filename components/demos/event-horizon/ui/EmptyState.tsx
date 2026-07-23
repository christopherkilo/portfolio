import { CalendarOff } from "lucide-react";
import { Button } from "@/components/demos/event-horizon/ui/Button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
        <CalendarOff className="size-5" aria-hidden />
      </div>
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      {actionLabel && (actionHref || onAction) ? (
        <div className="mt-6">
          <Button href={actionHref} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
