"use client";

import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type StarLenzBlogCoverProps = {
  className?: string;
  title?: string;
};

/** Editorial cover — not a product screenshot. */
export function StarLenzBlogCover({
  className,
  title = "StarLenz",
}: StarLenzBlogCoverProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-[#070b18]",
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_18%_8%,rgba(70,100,210,0.45),transparent_58%),radial-gradient(70%_55%_at_82%_78%,rgba(120,50,160,0.38),transparent_62%),linear-gradient(165deg,#071033_0%,#0a0c28_46%,#140c2c_100%)]" />
      <div
        className={cn(
          "absolute inset-[-10%] opacity-70",
          !reducedMotion && "blog-cover-drift",
        )}
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,0.7) 50%, transparent 51%), radial-gradient(1.4px 1.4px at 28% 64%, rgba(255,255,255,0.45) 50%, transparent 51%), radial-gradient(1px 1px at 48% 18%, rgba(255,255,255,0.8) 50%, transparent 51%), radial-gradient(1.6px 1.6px at 63% 42%, rgba(210,230,255,0.7) 50%, transparent 51%), radial-gradient(1px 1px at 74% 16%, rgba(255,255,255,0.35) 50%, transparent 51%), radial-gradient(1.2px 1.2px at 86% 58%, rgba(255,255,255,0.55) 50%, transparent 51%), radial-gradient(1px 1px at 18% 82%, rgba(255,255,255,0.4) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 40% 48%, rgba(244,215,122,0.65) 50%, transparent 51%)",
        }}
      />
      <div className="absolute left-[22%] top-[28%] h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(180,210,255,0.28),transparent_68%)] blur-md" />
      <div className="absolute right-[18%] bottom-[22%] h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(244,215,122,0.16),transparent_70%)] blur-lg" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
      <p className="absolute bottom-4 left-4 font-display text-sm font-semibold tracking-[0.22em] text-white/85 uppercase sm:bottom-5 sm:left-5 sm:text-base">
        {title}
      </p>
    </div>
  );
}
