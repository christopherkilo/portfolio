"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { Project } from "@/lib/projectData";
import { springHover } from "@/lib/animation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: Project;
  className?: string;
};

export function ProjectCard({ project, className }: ProjectCardProps) {
  const ref = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), {
    stiffness: 280,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), {
    stiffness: 280,
    damping: 24,
  });
  const imageX = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), {
    stiffness: 200,
    damping: 22,
  });
  const imageY = useSpring(useTransform(y, [-0.5, 0.5], [-6, 6]), {
    stiffness: 200,
    damping: 22,
  });

  function handleMove(e: React.MouseEvent<HTMLElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    setHovered(false);
    x.set(0);
    y.set(0);
  }

  return (
    <motion.article
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      whileHover={{ y: -10, scale: 1.02 }}
      transition={springHover}
      className={cn(
        "gradient-border group relative flex h-full w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_18px_40px_-28px_rgba(0,0,0,0.85)] sm:w-[340px]",
        hovered && "shadow-[0_28px_60px_-24px_rgba(124,58,237,0.35)]",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
        <motion.div
          className="absolute inset-[-8%]"
          style={{ x: imageX, y: imageY }}
        >
          <Image
            src={project.image}
            alt={`${project.title} preview`}
            fill
            sizes="340px"
            className="object-cover"
            loading="lazy"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="font-display text-lg font-semibold text-text">
            {project.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
            {project.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.technologies.slice(0, 4).map((tech) => (
            <Badge key={tech}>{tech}</Badge>
          ))}
        </div>

        <div className="mt-auto flex gap-2 pt-1">
          <Button
            href={project.liveDemo}
            external
            size="sm"
            variant="primary"
            className="flex-1"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            View Project
          </Button>
          <Button
            href={project.github}
            external
            size="sm"
            variant="outline"
            aria-label={`${project.title} on GitHub`}
          >
            <GithubIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      <Link
        href={`/projects#${project.id}`}
        className="sr-only"
        tabIndex={-1}
      >
        Open {project.title}
      </Link>
    </motion.article>
  );
}
