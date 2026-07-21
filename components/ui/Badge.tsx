import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "primary" | "secondary" | "highlight";
};

const tones = {
  default: "border-white/10 bg-white/[0.04] text-muted",
  primary: "border-primary/30 bg-primary/[0.08] text-primary",
  secondary: "border-white/12 bg-white/[0.06] text-secondary",
  highlight: "border-white/12 bg-white/[0.05] text-secondary",
};

export function Badge({
  children,
  className,
  tone = "default",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
