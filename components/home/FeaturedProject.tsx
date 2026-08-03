"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Carousel } from "@/components/ui/Carousel";
import { ProjectCard } from "@/components/ui/Card";
import {
  HOMEPAGE_FEATURED_DESCRIPTION,
  categoryDescriptions,
  categoryLabels,
  getHomepageFeaturedProjects,
  getHomepageToolkitProject,
} from "@/lib/projectData";

export function FeaturedProject() {
  const featured = getHomepageFeaturedProjects();
  const toolkit = getHomepageToolkitProject();

  return (
    <>
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

      {toolkit ? (
        <section
          id="toolkit"
          className="mx-auto max-w-6xl scroll-mt-[var(--scroll-mt)] px-4 pb-[var(--section-y)] sm:px-6 lg:px-8"
        >
          <SectionHeader
            eyebrow="Toolkit"
            title={categoryLabels.it}
            description={categoryDescriptions.it}
          />
          <div className="flex justify-center overflow-visible sm:justify-start">
            <ProjectCard project={toolkit} variant="carousel" />
          </div>
        </section>
      ) : null}
    </>
  );
}
