"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Carousel } from "@/components/ui/Carousel";
import { ProjectCard } from "@/components/ui/Card";
import {
  HOMEPAGE_FEATURED_DESCRIPTION,
  getHomepageFeaturedProjects,
} from "@/lib/projectData";

export function FeaturedProject() {
  const featured = getHomepageFeaturedProjects();

  return (
    <section
      id="projects"
      className="mx-auto max-w-6xl scroll-mt-[var(--scroll-mt)] px-4 py-[var(--section-y)] sm:px-6 lg:px-8"
    >
      <SectionHeader
        eyebrow="Featured"
        title="Featured Applications"
        description={HOMEPAGE_FEATURED_DESCRIPTION}
      />

      <Carousel label="Featured Applications">
        {featured.map((project) => (
          <ProjectCard key={project.id} project={project} variant="carousel" />
        ))}
      </Carousel>
    </section>
  );
}
