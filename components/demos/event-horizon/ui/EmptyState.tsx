import type { LucideIcon } from "lucide-react";
import { CalendarOff } from "lucide-react";
import { Button } from "@/components/demos/event-horizon/ui/Button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  icon?: LucideIcon;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  onAction,
  secondaryActionHref,
  secondaryActionLabel,
  onSecondaryAction,
  icon: Icon = CalendarOff,
}: EmptyStateProps) {
  const hasPrimary = Boolean(actionLabel && (actionHref || onAction));
  const hasSecondary = Boolean(
    secondaryActionLabel && (secondaryActionHref || onSecondaryAction),
  );

  return (
    <div className="eh-card relative flex flex-col items-center overflow-hidden rounded-2xl border bg-surface/60 px-6 py-16 text-center backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 eh-gravity-ring opacity-60" aria-hidden />
      <div className="relative mb-4 inline-flex size-14 items-center justify-center rounded-full border border-accent/30 bg-black/40 text-accent shadow-[0_0_24px_-8px_rgba(255,140,43,0.55)]">
        <Icon className="size-5" aria-hidden />
      </div>
      <h2 className="relative font-display text-xl font-semibold text-ink">{title}</h2>
      <p className="relative mt-2 max-w-md text-sm text-muted">{description}</p>
      {hasPrimary || hasSecondary ? (
        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
          {hasPrimary ? (
            <Button href={actionHref} onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
          {hasSecondary ? (
            <Button
              variant="outline"
              href={secondaryActionHref}
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
