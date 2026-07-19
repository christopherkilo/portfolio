"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spotlight } from "@/components/ui/Spotlight";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { Reveal } from "@/components/shared/Reveal";
import { getFeaturedProject } from "@/lib/projectData";

export function FeaturedProject() {
  const project = getFeaturedProject();

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Featured"
        title={project.title}
        description="A closer look at a flagship build—architecture, interface craft, and shipping details."
      />

      <Reveal>
        <Spotlight className="rounded-3xl border border-border bg-surface/60">
          <div className="grid items-center gap-8 p-5 md:grid-cols-[1.15fr_0.85fr] md:gap-10 md:p-8 lg:p-10">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-surface-elevated">
              <Image
                src={project.image}
                alt={`${project.title} screenshot`}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover"
                priority
              />
            </div>

            <div>
              <p className="text-sm leading-relaxed text-muted md:text-base">
                {project.description} Designed for clarity under load, with
                restrained motion and a component system ready for expansion.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <Badge key={tech} tone="primary">
                    {tech}
                  </Badge>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button href={project.liveDemo} external>
                  <ExternalLink className="size-4" aria-hidden />
                  Live Demo
                </Button>
                <Button href={project.github} external variant="outline">
                  <GithubIcon className="size-4" />
                  GitHub
                </Button>
              </div>
            </div>
          </div>
        </Spotlight>
      </Reveal>
    </section>
  );
}
