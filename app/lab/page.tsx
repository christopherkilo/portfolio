import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { TroubleshootingDemo } from "@/components/home/TechnicalLabPreview";
import { LAB_CASE_STUDIES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Technical Lab",
  description: "IT case studies and an interactive troubleshooting demo.",
};

export default function LabPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Technical Lab"
        title="Bench notes & systems work"
        description="Placeholder case studies that demonstrate structured IT thinking—plus a live decision-tree demo."
      />

      <div className="mb-10 grid gap-4 md:grid-cols-2">
        {LAB_CASE_STUDIES.map((study) => (
          <article
            key={study.id}
            className="rounded-2xl border border-border bg-surface/70 p-6"
          >
            <h2 className="font-display text-xl font-semibold text-text">
              {study.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {study.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {study.tags.map((tag) => (
                <Badge key={tag} tone="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </article>
        ))}
      </div>

      <TroubleshootingDemo />
    </div>
  );
}
