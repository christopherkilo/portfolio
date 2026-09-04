import { cn } from "@/lib/utils";

type InDevBadgeProps = {
  className?: string;
  children?: React.ReactNode;
};

export function InDevBadge({
  className,
  children = "Active development",
}: InDevBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-primary/45 bg-black/55 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur-md",
        className,
      )}
    >
      {children}
    </span>
  );
}
