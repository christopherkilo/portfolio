import { cn } from "@/lib/utils";

type ProjectProofLineProps = {
  points?: string[];
  className?: string;
  /** Featured cards use 2; other cards may show up to 4. */
  max?: number;
};

/**
 * Compact secondary proof line for project cards.
 * Renders nothing when a project has no verified proof points.
 */
export function ProjectProofLine({
  points,
  className,
  max = 4,
}: ProjectProofLineProps) {
  const facts = (points ?? [])
    .map((point) => point.trim())
    .filter(Boolean)
    .slice(0, max);
  if (!facts.length) return null;

  return (
    <ul
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 gap-y-1",
        className,
      )}
      aria-label="Verified project facts"
    >
      {facts.map((fact, index) => (
        <li
          key={fact}
          className="inline-flex max-w-full items-baseline font-mono text-[10px] leading-relaxed tracking-[0.08em] text-muted"
        >
          {index > 0 ? (
            <span className="mr-2 text-white/25" aria-hidden>
              ·
            </span>
          ) : null}
          <span className="min-w-0 break-words">{fact}</span>
        </li>
      ))}
    </ul>
  );
}
