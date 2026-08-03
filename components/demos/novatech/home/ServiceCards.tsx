"use client";

import {
  Cloud,
  Code2,
  Network,
  Server,
  ShieldCheck,
  Wrench,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { SERVICES, CTA } from "@/lib/demos/novatech/constants";
import { serviceHref } from "@/lib/demos/novatech/paths";
import { springHover, staggerContainer, staggerItem } from "@/lib/demos/novatech/animation";
import { SectionHeader } from "@/components/demos/novatech/ui/SectionHeader";
import { cn } from "@/lib/demos/novatech/utils";

const icons: Record<string, LucideIcon> = {
  Server,
  Wrench,
  Network,
  ShieldCheck,
  Code2,
  Cloud,
};

type ServiceCardsProps = {
  showHeader?: boolean;
  className?: string;
  headingLevel?: "h1" | "h2";
  title?: string;
  description?: string;
};

export function ServiceCards({
  showHeader = true,
  className,
  headingLevel = "h2",
  title = "IT capabilities built for business continuity",
  description = "Choose a service to see common problems, representative capabilities, and how an engagement typically unfolds.",
}: ServiceCardsProps) {
  const reducedMotion = useReducedMotion();

  return (
    <section className={cn("mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8", className)}>
      {showHeader ? (
        <SectionHeader
          eyebrow="Services"
          title={title}
          description={description}
          headingLevel={headingLevel}
        />
      ) : null}

      <motion.ul
        className="grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3"
        variants={reducedMotion ? undefined : staggerContainer}
        initial={reducedMotion ? false : "hidden"}
        whileInView={reducedMotion ? undefined : "visible"}
        viewport={{ once: true, margin: "-80px" }}
      >
        {SERVICES.map((service) => {
          const Icon = icons[service.icon];
          return (
            <motion.li
              key={service.id}
              variants={reducedMotion ? undefined : staggerItem}
              whileHover={reducedMotion ? undefined : { y: -4 }}
              transition={springHover}
            >
              <Link
                href={serviceHref(service.id)}
                className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-primary-contrast">
                  <Icon className="size-5" aria-hidden />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {service.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {service.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition group-hover:gap-2 group-focus-visible:gap-2">
                  {CTA.learnMore}
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}
