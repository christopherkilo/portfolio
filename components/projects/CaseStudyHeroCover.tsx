"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { EventHorizonCardCover } from "@/components/ui/EventHorizonCardCover";
import { KiloToolkitCardCover } from "@/components/ui/KiloToolkitCardCover";
import { NovaTechCardCover } from "@/components/ui/NovaTechCardCover";
import { TaskflowCardCover } from "@/components/ui/TaskflowCardCover";
import { isSvgImageSrc } from "@/lib/utils";

const ANIMATED_COVER_IDS = new Set([
  "event-horizon",
  "novatech-solutions",
  "taskflow",
  "kilo-toolkit",
]);

type CaseStudyHeroCoverProps = {
  projectId: string;
  title: string;
  image: string;
};

/**
 * Case-study hero visual — projects with animated portfolio covers reuse them
 * here; others keep their static image.
 */
export function CaseStudyHeroCover({
  projectId,
  title,
  image,
}: CaseStudyHeroCoverProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const hasAnimatedCover = ANIMATED_COVER_IDS.has(projectId);
  const active = inView && !reducedMotion;

  useEffect(() => {
    const node = ref.current;
    if (!node || !hasAnimatedCover) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasAnimatedCover]);

  return (
    <div
      ref={ref}
      className="relative mb-12 aspect-[16/10] overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl sm:aspect-[21/9]"
    >
      {hasAnimatedCover ? (
        <>
          {projectId === "event-horizon" ? (
            <EventHorizonCardCover
              reducedMotion={reducedMotion}
              active={active}
            />
          ) : null}
          {projectId === "novatech-solutions" ? (
            <NovaTechCardCover
              reducedMotion={reducedMotion}
              active={active}
            />
          ) : null}
          {projectId === "taskflow" ? (
            <TaskflowCardCover
              reducedMotion={reducedMotion}
              active={active}
            />
          ) : null}
          {projectId === "kilo-toolkit" ? (
            <KiloToolkitCardCover
              reducedMotion={reducedMotion}
              active={active}
            />
          ) : null}
        </>
      ) : (
        <Image
          src={image}
          alt={`${title} visual`}
          fill
          priority
          unoptimized={isSvgImageSrc(image)}
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1200px) 100vw, 1100px"
        />
      )}
    </div>
  );
}
