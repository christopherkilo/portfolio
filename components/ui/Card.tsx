"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { getProjectHref, type Project } from "@/lib/projectData";
import { springHover } from "@/lib/animation";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: Project;
  className?: string;
};

export function ProjectCard({ project, className }: ProjectCardProps) {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);
  const href = getProjectHref(project);

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

  const proximityGlow = useMotionTemplate`radial-gradient(220px circle at ${mouseX}px ${mouseY}px, rgba(248,231,28,0.08), transparent 55%)`;

  function handleMove(e: React.MouseEvent<HTMLElement>) {
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

  function openCaseStudy() {
    router.push(href);
  }

  return (
    <motion.article
      ref={ref}
      role="link"
      tabIndex={0}
      aria-label={`Open project: ${project.title}`}
      onClick={openCaseStudy}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openCaseStudy();
        }
      }}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      whileHover={{ y: -8, scale: 1.015 }}
      transition={springHover}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      className={cn(
        "gradient-border glass-panel group relative flex h-full w-[300px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-[1.25rem] sm:w-[340px]",
        hovered &&
          "brightness-[1.05] shadow-[0_28px_60px_-28px_rgba(0,0,0,0.95),0_0_40px_-20px_rgba(248,231,28,0.12)]",
        className,
      )}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: proximityGlow }}
        aria-hidden
      />

      <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
        <motion.div
          className="absolute inset-[-8%]"
          style={{ x: imageX, y: imageY }}
        >
          <Image
            src={project.image}
            alt=""
            fill
            sizes="340px"
            className="object-cover"
            loading="lazy"
            unoptimized
          />
        </motion.div>
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-text opacity-0 backdrop-blur-md transition group-hover:opacity-100">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>

      <div className="relative z-[1] flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="font-display text-lg font-semibold text-text transition-colors group-hover:text-white">
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

        <p className="mt-auto pt-1 text-xs font-medium text-muted transition group-hover:text-primary">
          Open project →
        </p>
      </div>
    </motion.article>
  );
}
