"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Carousel } from "@/components/ui/Carousel";
import { ProjectCard } from "@/components/ui/Card";
import {
  categoryDescriptions,
  categoryLabels,
  getProjectsByCategory,
  type ProjectCategory,
} from "@/lib/projectData";

type ProjectSectionProps = {
  category: ProjectCategory;
  id?: string;
};

export function ProjectSection({ category, id }: ProjectSectionProps) {
  const items = getProjectsByCategory(category);

  return (
    <section
      id={id}
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <SectionHeader
        title={categoryLabels[category]}
        description={categoryDescriptions[category]}
      />
      <Carousel label={categoryLabels[category]}>
        {items.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </Carousel>
    </section>
  );
}
