import type { Metadata } from "next";
import { ProjectCard } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  categoryDescriptions,
  categoryLabels,
  getPortfolioProjectsByCategory,
  type Project,
  type ProjectCategory,
} from "@/lib/projectData";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Projects",
  description:
    "Featured applications, Kilo Toolkit diagnostics utilities, and graphic design work by Christopher Kilo.",
  path: "/projects",
});

const sections: {
  category: ProjectCategory;
  title: string;
  description: string;
  gridClass: string;
}[] = [
  {
    category: "web",
    title: categoryLabels.web,
    description: categoryDescriptions.web,
    gridClass: "grid grid-cols-1 gap-6 overflow-visible md:grid-cols-2 xl:grid-cols-3 md:gap-7 xl:gap-8",
  },
  {
    category: "it",
    title: categoryLabels.it,
    description: categoryDescriptions.it,
    gridClass:
      "grid grid-cols-1 gap-6 overflow-visible md:grid-cols-2 md:gap-7 xl:max-w-xl",
  },
  {
    category: "design",
    title: categoryLabels.design,
    description: categoryDescriptions.design,
    gridClass: "grid grid-cols-1 gap-6 overflow-visible md:grid-cols-2 xl:grid-cols-3 md:gap-7 xl:gap-8",
  },
];

function ProjectGrid({
  items,
  gridClass,
}: {
  items: Project[];
  gridClass: string;
}) {
  return (
    <div className={gridClass}>
      {items.map((project) => (
        <div
          id={project.id}
          key={project.id}
          className="min-h-0 scroll-mt-[var(--scroll-mt)]"
        >
          <ProjectCard project={project} variant="grid" />
        </div>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <SectionHeader
        eyebrow="Projects"
        title="Selected work across disciplines"
        description="Full-stack applications, professional IT utilities, and visual identity systems."
      />

      {sections.map((section) => {
        const items = getPortfolioProjectsByCategory(section.category);
        if (!items.length) return null;
        return (
          <section key={section.category} className="mb-12 last:mb-0 sm:mb-16">
            <div className="mb-6 max-w-3xl">
              <h2 className="font-display text-2xl font-semibold text-text">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-secondary sm:text-base">
                {section.description}
              </p>
            </div>
            <ProjectGrid items={items} gridClass={section.gridClass} />
          </section>
        );
      })}
    </div>
  );
}
