"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Cpu,
  Terminal,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SITE, TECH_BADGES } from "@/lib/constants";
import { staggerContainer, staggerItem } from "@/lib/animation";

const floatingPositions = [
  { top: "6%", left: "4%", rotate: -8 },
  { top: "18%", right: "2%", rotate: 6 },
  { top: "42%", left: "-2%", rotate: 4 },
  { bottom: "28%", right: "0%", rotate: -5 },
  { bottom: "8%", left: "10%", rotate: 7 },
  { top: "58%", right: "18%", rotate: -3 },
  { top: "8%", left: "38%", rotate: 5 },
  { bottom: "18%", left: "36%", rotate: -6 },
  { top: "32%", right: "28%", rotate: 8 },
  { bottom: "36%", left: "58%", rotate: -4 },
  { top: "70%", right: "42%", rotate: 3 },
];

export function Hero() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-[100svh] items-center pb-16 pt-[calc(var(--nav-height)+1rem)]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10"
        >
          <motion.p
            variants={staggerItem}
            className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-secondary"
          >
            Portfolio
          </motion.p>
          <motion.h1
            variants={staggerItem}
            className="font-display text-5xl font-semibold tracking-tight text-text sm:text-6xl lg:text-7xl"
          >
            {SITE.name}
          </motion.h1>
          <motion.p
            variants={staggerItem}
            className="mt-4 text-lg font-medium text-primary sm:text-xl"
          >
            {SITE.title}
          </motion.p>
          <motion.p
            variants={staggerItem}
            className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
          >
            {SITE.tagline}
          </motion.p>
          <motion.div
            variants={staggerItem}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button href="/projects" size="lg">
              View Projects
            </Button>
            <Button href="/contact" variant="outline" size="lg">
              Contact Me
            </Button>
          </motion.div>
        </motion.div>

        <div className="relative mx-auto h-[420px] w-full max-w-lg sm:h-[480px] lg:h-[520px]">
          {!reducedMotion
            ? TECH_BADGES.map((tech, i) => {
                const pos = floatingPositions[i % floatingPositions.length];
                return (
                  <motion.div
                    key={tech}
                    className="absolute z-20"
                    style={pos}
                    animate={{
                      y: [0, i % 2 === 0 ? -10 : 10, 0],
                      x: [0, i % 3 === 0 ? 6 : -6, 0],
                    }}
                    transition={{
                      duration: 6 + (i % 5),
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.2,
                    }}
                  >
                    <Badge
                      tone={i % 3 === 0 ? "primary" : i % 3 === 1 ? "secondary" : "default"}
                      className="glass shadow-lg"
                    >
                      {tech}
                    </Badge>
                  </motion.div>
                );
              })
            : null}

          <motion.div
            className="glass absolute left-2 top-8 z-10 w-[78%] -rotate-3 overflow-hidden rounded-2xl p-4 shadow-2xl sm:left-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Terminal className="size-4 text-secondary" />
              <span className="font-mono text-xs text-muted">zsh — ~/build</span>
            </div>
            <pre className="font-mono text-[11px] leading-relaxed text-text/90 sm:text-xs">
{`$ npm run build
✓ Compiled successfully
✓ Optimized images
→ Ready on :3000`}
            </pre>
          </motion.div>

          <motion.div
            className="glass absolute right-0 top-28 z-[11] w-[72%] rotate-2 overflow-hidden rounded-2xl border border-primary/20 p-4 shadow-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs text-muted">editor.tsx</span>
              <span className="size-2 rounded-full bg-highlight" />
            </div>
            <pre className="font-mono text-[11px] leading-relaxed sm:text-xs">
              <span className="text-primary">const</span>{" "}
              <span className="text-secondary">portfolio</span> = {"{"}
              {"\n"}
              {"  "}craft: <span className="text-highlight">&quot;intentional&quot;</span>,
              {"\n"}
              {"  "}stack: [<span className="text-secondary">&quot;Next&quot;</span>,{" "}
              <span className="text-secondary">&quot;TS&quot;</span>],
              {"\n"}
              {"}"};
            </pre>
          </motion.div>

          <motion.div
            className="glass absolute bottom-10 left-6 z-[12] w-[70%] -rotate-2 rounded-2xl p-4 shadow-2xl"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Activity className="size-4 text-highlight" />
              <span className="text-xs font-medium text-text">Diagnostics</span>
            </div>
            <ul className="space-y-2 text-xs text-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-secondary" />
                Build pipeline healthy
              </li>
              <li className="flex items-center gap-2">
                <Wifi className="size-3.5 text-secondary" />
                Network latency 12ms
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="size-3.5 text-highlight" />
                Thermals nominal
              </li>
            </ul>
          </motion.div>

          <motion.div
            className="glass absolute bottom-2 right-4 z-[13] flex items-center gap-3 rounded-xl px-3 py-2 -rotate-1"
            animate={
              reducedMotion
                ? undefined
                : { y: [0, -6, 0] }
            }
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary opacity-40" />
              <span className="relative inline-flex size-2.5 rounded-full bg-secondary" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted">
                System
              </p>
              <p className="text-xs font-medium text-text">All services online</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
