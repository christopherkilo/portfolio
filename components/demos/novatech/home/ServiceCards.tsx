"use client";

import {
  Cloud,
  Code2,
  Network,
  Server,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { SERVICES } from "@/lib/demos/novatech/constants";
import { springHover, staggerContainer, staggerItem } from "@/lib/demos/novatech/animation";
import { SectionHeader } from "@/components/demos/novatech/ui/SectionHeader";
import { Button } from "@/components/demos/novatech/ui/Button";
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
  limit?: number;
  showHeader?: boolean;
  className?: string;
  headingLevel?: "h1" | "h2";
};

export function ServiceCards({
  limit,
  showHeader = true,
  className,
  headingLevel = "h2",
}: ServiceCardsProps) {
  const items = limit ? SERVICES.slice(0, limit) : SERVICES;

  return (
    <section className={cn("mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8", className)}>
      {showHeader ? (
        <SectionHeader
          eyebrow="Services"
          title="IT capabilities built for business continuity"
          description="From day-to-day support to strategic projects, NovaTech delivers reliable technology outcomes with clear communication."
          headingLevel={headingLevel}
        />
      ) : null}

      <motion.div
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {items.map((service) => {
          const Icon = icons[service.icon];
          return (
            <motion.article
              key={service.id}
              variants={staggerItem}
              whileHover={{ y: -6 }}
              transition={springHover}
              className="group rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent/40 hover:shadow-md"
            >
              <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-primary-contrast">
                <Icon className="size-5" aria-hidden />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {service.description}
              </p>
            </motion.article>
          );
        })}
      </motion.div>

      {limit ? (
        <div className="mt-10">
          <Button href="/demos/novatech-solutions/services" variant="outline">
            View all services
          </Button>
        </div>
      ) : null}
    </section>
  );
}
