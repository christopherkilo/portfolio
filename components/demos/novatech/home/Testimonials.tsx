"use client";

import { Quote } from "lucide-react";
import { motion } from "framer-motion";
import { TESTIMONIALS } from "@/lib/demos/novatech/constants";
import { SectionHeader } from "@/components/demos/novatech/ui/SectionHeader";
import { staggerContainer, staggerItem } from "@/lib/demos/novatech/animation";

export function Testimonials() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Illustrative perspectives"
          title="What a strong partnership could feel like"
          description="These fictional voices demonstrate the communication and outcomes this portfolio concept is designed to convey; they are not customer reviews."
          align="center"
        />

        <motion.div
          className="grid gap-5 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {TESTIMONIALS.map((item) => (
            <motion.blockquote
              key={item.id}
              variants={staggerItem}
              className="flex h-full flex-col rounded-2xl border border-border bg-bg p-6"
            >
              <Quote className="size-6 text-accent" aria-hidden />
              <p className="mt-4 flex-1 text-sm leading-relaxed text-ink md:text-base">
                “{item.quote}”
              </p>
              <footer className="mt-6 border-t border-border pt-4">
                <cite className="not-italic">
                  <span className="block font-semibold text-ink">
                    {item.name}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {item.role}
                  </span>
                </cite>
              </footer>
            </motion.blockquote>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
