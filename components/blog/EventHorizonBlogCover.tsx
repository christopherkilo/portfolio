"use client";

import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type EventHorizonBlogCoverProps = {
  className?: string;
  title?: string;
  showTitle?: boolean;
};

/** Editorial cover using Event Horizon orange, independent of demo CSS tokens. */
export function EventHorizonBlogCover({
  className,
  title = "Event Horizon",
  showTitle = true,
}: EventHorizonBlogCoverProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={cn("relative isolate h-full w-full overflow-hidden bg-[#07060A]", className)}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(255,140,43,0.28),transparent_58%),radial-gradient(ellipse_at_12%_8%,rgba(250,204,21,0.12),transparent_40%),linear-gradient(165deg,#07060A_0%,#16110c_50%,#07060A_100%)]" />
      <div
        className={cn(
          "absolute left-1/2 top-[36%] size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF8C2B]/20 blur-3xl",
          !reducedMotion && "blog-cover-drift",
        )}
      />
      <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
        <div className="relative size-28 sm:size-32">
          <div className="absolute inset-0 rounded-full border border-[#FFC27A]/50 shadow-[0_0_48px_rgba(255,140,43,0.45)]" />
          <div className="absolute inset-[12%] rounded-full border-[6px] border-[#FF8C2B]/80" />
          <div className="absolute inset-[28%] rounded-full bg-black shadow-[inset_0_0_18px_rgba(255,140,43,0.35)]" />
        </div>
      </div>
      <div className="absolute inset-x-[18%] bottom-[30%] h-px bg-gradient-to-r from-transparent via-[#FF8C2B]/55 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
      {showTitle ? (
        <p className="absolute bottom-4 left-4 font-display text-sm font-semibold uppercase tracking-[0.22em] text-white sm:bottom-5 sm:left-5 sm:text-base">
          {title}
        </p>
      ) : null}
    </div>
  );
}
