"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { getProjectHref, type Project } from "@/lib/projectData";
import { durations, springHover } from "@/lib/animation";
import { Badge } from "@/components/ui/Badge";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { Shimmer } from "@/components/ui/Shimmer";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: Project;
  className?: string;
};

function ProjectCardComponent({ project, className }: ProjectCardProps) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const href = getProjectHref(project);
  const hasImage = Boolean(project.image);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [1.6, -1.6]), {
    stiffness: 280,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-1.6, 1.6]), {
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

  const proximityGlow = useMotionTemplate`radial-gradient(220px circle at ${mouseX}px ${mouseY}px, var(--glow-primary), transparent 55%)`;

  function handleMove(e: React.MouseEvent<HTMLElement>) {
    if (reducedMotion) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    mouseX.set(mx);
    mouseY.set(my);
    x.set(mx / rect.width - 0.5);
    y.set(my / rect.height - 0.5);
  }

  function handleLeave() {
    setHovered(false);
    x.set(0);
    y.set(0);
  }

  const ctaLabel =
    project.category === "it" ? "Open Toolkit" : "View Case Study";

  return (
    <motion.article
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      whileHover={reducedMotion ? undefined : { y: -8, scale: 1.015 }}
      whileTap={reducedMotion ? undefined : { scale: 0.99 }}
      transition={springHover}
      style={
        reducedMotion
          ? undefined
          : {
              rotateX,
              rotateY,
              transformPerspective: 900,
            }
      }
      className={cn(
        "gradient-border glass-panel group relative flex h-full w-[min(100%,300px)] shrink-0 flex-col overflow-hidden rounded-[var(--radius)] sm:w-[340px]",
        hovered &&
          "brightness-[1.05] shadow-[0_28px_60px_-28px_rgba(0,0,0,0.45),0_0_40px_-20px_var(--glow-yellow)]",
        className,
      )}
    >
      <Link
        href={href}
        className="absolute inset-0 z-[1] rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        aria-label={`${ctaLabel}: ${project.title}`}
      />

      <motion.div
        className="pointer-events-none absolute inset-0 z-[2] opacity-0 transition-opacity duration-[var(--duration-card)] group-hover:opacity-100"
        style={{ background: proximityGlow }}
        aria-hidden
      />

      {project.github ? (
        <div className="absolute left-3 top-3 z-[4]">
          <Shimmer className="inline-flex rounded-full" onPress={false}>
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              aria-label={`${project.title} on GitHub`}
              className="relative z-[4] inline-flex size-9 items-center justify-center rounded-full border border-white/12 bg-black/55 text-text backdrop-blur-md transition duration-[var(--duration-fast)] hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <GithubIcon className="size-4" />
            </a>
          </Shimmer>
        </div>
      ) : null}

      <div className="pointer-events-none relative aspect-[16/10] overflow-hidden bg-surface-elevated">
        {/* Skeleton placeholder — reserved aspect box prevents CLS */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent transition-opacity duration-[var(--duration-card)]",
            imageLoaded && hasImage ? "opacity-0" : "opacity-100",
          )}
          aria-hidden
        >
          <div className="absolute inset-0 animate-pulse bg-white/[0.03]" />
        </div>

        {hasImage ? (
          <motion.div
            className="absolute inset-[-8%]"
            style={reducedMotion ? undefined : { x: imageX, y: imageY }}
            initial={false}
            animate={
              imageLoaded
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: reducedMotion ? 1 : 1.04 }
            }
            transition={{
              duration: reducedMotion ? 0 : durations.image,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Image
              src={project.image}
              alt={project.imageAlt ?? `${project.title} project cover`}
              fill
              sizes="(max-width: 640px) 300px, 340px"
              className="object-cover"
              loading="eager"
              unoptimized
              onLoad={() => setImageLoaded(true)}
            />
          </motion.div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center bg-surface-elevated"
            aria-hidden
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              No preview
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-text opacity-0 backdrop-blur-md transition duration-[var(--duration-card)] group-hover:opacity-100">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>

      <div className="pointer-events-none relative z-[3] flex flex-1 flex-col gap-4 p-[var(--pad-card)]">
        <div>
          <h3 className="font-display text-lg font-semibold text-text transition-colors duration-[var(--duration-fast)] group-hover:text-primary">
            {project.title}
          </h3>
          <p className="mt-2 line-clamp-3 max-w-prose text-sm leading-relaxed text-muted">
            {project.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.technologies.slice(0, 4).map((tech) => (
            <Badge key={tech}>{tech}</Badge>
          ))}
        </div>

        <p className="mt-auto pt-1 text-xs font-medium text-muted transition duration-[var(--duration-fast)] group-hover:text-primary">
          {ctaLabel} →
        </p>
      </div>
    </motion.article>
  );
}

export const ProjectCard = memo(ProjectCardComponent);
