import { cn } from "@/lib/demos/event-horizon/utils";
import type { PremiumBadge } from "@/lib/demos/event-horizon/categoryStyles";

type PremiumBadgeProps = {
  badge: PremiumBadge;
  className?: string;
};

/** Restrained metallic gold pills — exclusivity, not neon. */
export function PremiumBadgePill({ badge, className }: PremiumBadgeProps) {
  return (
    <span
      className={cn("eh-badge-gold inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold tracking-wide", className)}
      data-badge={badge.kind}
    >
      {badge.label}
    </span>
  );
}

type CategoryBadgeProps = {
  category: string;
  color: string;
  wash: string;
  border: string;
  className?: string;
};

export function CategoryBadge({
  category,
  color,
  wash,
  border,
  className,
}: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold backdrop-blur",
        className,
      )}
      style={{ color, backgroundColor: wash, borderColor: border }}
    >
      {category}
    </span>
  );
}
