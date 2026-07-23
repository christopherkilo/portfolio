"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { SearchInput } from "@/components/demos/event-horizon/ui/SearchInput";
import { Button } from "@/components/demos/event-horizon/ui/Button";
import { SITE } from "@/lib/demos/event-horizon/constants";
import { staggerContainer, staggerItem } from "@/lib/demos/event-horizon/animation";

export function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function goBrowse() {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/demos/event-horizon/browse${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <section className="hero-glow relative overflow-hidden pb-10 pt-[calc(var(--nav-height)+1.5rem)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.p
            variants={staggerItem}
            className="text-xs font-semibold uppercase tracking-[0.24em] text-accent"
          >
            {SITE.name}
          </motion.p>
          <motion.h1
            variants={staggerItem}
            className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {SITE.tagline}
          </motion.h1>
          <motion.p
            variants={staggerItem}
            className="mx-auto mt-5 max-w-xl text-base text-muted md:text-lg"
          >
            {SITE.description}
          </motion.p>
          <motion.div variants={staggerItem} className="mt-8">
            <SearchInput
              value={query}
              onChange={setQuery}
              onSubmit={goBrowse}
              className="mx-auto max-w-xl"
            />
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button onClick={goBrowse}>Search events</Button>
              <Button href="/demos/event-horizon/browse" variant="outline">
                Browse all
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
