import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import {
  getEngineeringLabItems,
  LAB_STATE_LABELS,
  type LabState,
} from "@/lib/engineeringLab";
import { hasLiveDemo, isInternalHref } from "@/lib/projectData";

const STATE_TONE: Record<LabState, string> = {
  "live-app": "border-primary/40 text-primary",
  "live-demo": "border-primary/40 text-primary",
  "production-verified": "border-primary/40 text-primary",
  "architecture-demo": "border-white/20 text-secondary",
  "case-study": "border-white/20 text-secondary",
  experiment: "border-white/20 text-muted",
  "active-development": "border-primary/35 text-primary",
  demo: "border-white/20 text-secondary",
};

export function EngineeringLab() {
  const items = getEngineeringLabItems();

  return (
    <section
      id="engineering-lab"
      className="mx-auto max-w-6xl scroll-mt-[var(--scroll-mt)] px-4 py-[var(--section-y)] sm:px-6 lg:px-8"
    >
      <SectionHeader
        eyebrow="Lab"
        title="Engineering Lab"
        description="Usable builds, architecture demos, and experiments."
      />

      <ul className="divide-y divide-white/8 rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl">
        {items.map((item) => {
          const live = hasLiveDemo(item.liveHref) ? item.liveHref : undefined;
          return (
            <li
              key={item.id}
              className="grid gap-3 px-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:px-6"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-text">
                    {item.title}
                  </h3>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] ${STATE_TONE[item.state]}`}
                  >
                    {LAB_STATE_LABELS[item.state]}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary">
                  {item.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {live ? (
                  <Button
                    href={live}
                    size="sm"
                    external={!isInternalHref(live)}
                  >
                    Open
                  </Button>
                ) : null}
                {item.href !== live ? (
                  <Button href={item.href} variant="outline" size="sm">
                    {live ? "Case study" : "Details"}
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-6">
        <Link
          href="/work"
          className="inline-flex min-h-11 items-center text-sm font-medium text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Explore all work →
        </Link>
      </p>
    </section>
  );
}
