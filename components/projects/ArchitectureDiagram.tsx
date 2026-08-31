import { cn } from "@/lib/utils";
import type {
  ArchitectureHighlight,
  ArchitectureLane,
  ArchitecturePath,
} from "@/lib/case-studies/types";

function StepChip({ children }: { children: string }) {
  return (
    <span className="inline-flex max-w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[11px] leading-snug text-text sm:text-xs">
      {children}
    </span>
  );
}

export function PipelineSteps({
  steps,
  className,
}: {
  steps: string[];
  className?: string;
}) {
  return (
    <ol
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-3",
        className,
      )}
      aria-label={steps.join(" to ")}
    >
      {steps.map((step, index) => (
        <li
          key={`${step}-${index}`}
          className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center"
        >
          <StepChip>{step}</StepChip>
          {index < steps.length - 1 ? (
            <span className="px-1 font-mono text-xs text-muted sm:px-0" aria-hidden>
              <span className="sm:hidden">↓</span>
              <span className="hidden sm:inline">→</span>
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function PathBlock({ path }: { path: ArchitecturePath }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] label-accent">
        {path.label}
      </p>
      <PipelineSteps steps={path.steps} />
    </div>
  );
}

export function ArchitectureHighlightCard({
  highlight,
}: {
  highlight: ArchitectureHighlight;
}) {
  return (
    <section
      className="mb-12 overflow-hidden rounded-2xl border border-primary/20 bg-white/[0.03] p-6 backdrop-blur-xl"
      aria-labelledby="cloud-event-pipeline"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] label-accent">
        Architecture highlight
      </p>
      <h2
        id="cloud-event-pipeline"
        className="mt-2 font-display text-xl font-semibold text-text sm:text-2xl"
      >
        {highlight.title}
      </h2>
      {highlight.description ? (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary md:text-base">
          {highlight.description}
        </p>
      ) : null}
      <div className="mt-6 grid gap-6">
        {highlight.paths.map((path) => (
          <PathBlock key={path.label} path={path} />
        ))}
      </div>
    </section>
  );
}

export function ArchitectureLanes({
  title,
  description,
  entry,
  lanes,
}: {
  title: string;
  description?: string;
  entry?: string[];
  lanes: ArchitectureLane[];
}) {
  return (
    <section className="mb-12 rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
      <h2 className="font-display text-xl font-semibold text-text sm:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary md:text-base">
          {description}
        </p>
      ) : null}
      {entry?.length ? (
        <div className="mt-6">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] label-accent">
            Shared entry
          </p>
          <PipelineSteps steps={entry} />
        </div>
      ) : null}
      <div className={entry?.length ? "mt-4 grid gap-4 lg:grid-cols-2" : "mt-6 grid gap-4 lg:grid-cols-2"}>
        {lanes.map((lane) => (
          <div
            key={lane.title}
            className="rounded-xl border border-white/8 bg-black/20 p-4 sm:p-5"
          >
            <h3 className="font-display text-base font-semibold text-text">
              {lane.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              {lane.caption}
            </p>
            <PipelineSteps steps={lane.steps} className="mt-4" />
          </div>
        ))}
      </div>
    </section>
  );
}
