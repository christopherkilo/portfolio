import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "primary" | "secondary" | "highlight";
};

const tones = {
  default: "border-border bg-surface/80 text-muted",
  primary: "border-primary/30 bg-primary/15 text-primary",
  secondary: "border-secondary/30 bg-secondary/15 text-secondary",
  highlight: "border-highlight/30 bg-highlight/15 text-highlight",
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
