import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GithubIcon } from "@/components/ui/BrandIcons";
import {
  categoryLabels,
  projects,
  type ProjectCategory,
} from "@/lib/projectData";

export const metadata: Metadata = {
  title: "Projects",
  description: "Web, design, and IT projects — rendered dynamically from a shared data source.",
};

const order: ProjectCategory[] = ["web", "design", "it"];

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Projects"
        title="Selected work across disciplines"
        description="Nine placeholder projects spanning product interfaces, visual systems, and infrastructure. Swap content in lib/projectData.ts."
      />

      {order.map((category) => {
        const items = projects.filter((p) => p.category === category);
        return (
          <section key={category} className="mb-16">
            <h2 className="mb-6 font-display text-2xl font-semibold text-text">
              {categoryLabels[category]}
            </h2>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((project) => (
                <article
                  id={project.id}
                  key={project.id}
                  className="scroll-mt-28 overflow-hidden rounded-2xl border border-border bg-surface/70"
                >
                  <div className="relative aspect-[16/10] bg-surface-elevated">
                    <Image
                      src={project.image}
                      alt={`${project.title} preview`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-4 p-5">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-text">
                        {project.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <Badge key={tech}>{tech}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button href={project.liveDemo} external size="sm">
                        <ExternalLink className="size-3.5" aria-hidden />
                        Live Demo
                      </Button>
                      <Button
                        href={project.github}
                        external
                        size="sm"
                        variant="outline"
                      >
                        <GithubIcon className="size-3.5" />
                        GitHub
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
