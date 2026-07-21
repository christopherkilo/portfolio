import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import {
  categoryLabels,
  getProjectHref,
  projects,
  type ProjectCategory,
} from "@/lib/projectData";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Web and design case studies alongside direct access to Kilo Toolkit diagnostic modules.",
};

const order: ProjectCategory[] = ["web", "design", "it"];

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Projects"
        title="Selected work across disciplines"
        description="Open web and design case studies, or launch the SystemScope, MemoryMedic, and NetCheck modules inside Kilo Toolkit."
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
                <Link
                  id={project.id}
                  key={project.id}
                  href={getProjectHref(project)}
                  className="group scroll-mt-28 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl transition hover:border-white/16 hover:bg-white/[0.05]"
                >
                  <div className="relative aspect-[16/10] bg-surface-elevated">
                    <Image
                      src={project.image}
                      alt={`${project.title} preview`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                      unoptimized
                    />
                  </div>
                  <div className="space-y-4 p-5">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-text transition group-hover:text-white">
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
                    <p className="text-xs font-medium text-muted transition group-hover:text-primary">
                      Open project →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
