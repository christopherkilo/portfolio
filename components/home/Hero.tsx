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
import { SignatureName } from "@/components/home/SignatureName";
import { SITE } from "@/lib/constants";

/**
 * Floating tech labels live only in protected gutters around the code panels.
 * Panel interiors (terminal / editor / diagnostics / status) are off-limits.
 * Motion travel stays within each slot so labels cannot drift into code.
 */
type FloatingLabel = {
  text: string;
  /** Tailwind placement + responsive visibility */
  slot: string;
  rotate: number;
  motion: { x: number; y: number };
  delay: number;
};

const floatingLabels: FloatingLabel[] = [
  {
    text: "Next.js",
    // NW gutter — above terminal panel
    slot: "top-0 left-0",
    rotate: -6,
    motion: { x: 3, y: -3 },
    delay: 0,
  },
  {
    text: "TypeScript",
    // NE gutter — above editor panel
    slot: "top-0 right-0",
    rotate: 5,
    motion: { x: -3, y: -2 },
    delay: 0.15,
  },
  {
    text: "Tailwind",
    // West mid gap — left of editor, below terminal
    slot: "top-[44%] left-0 -translate-y-1/2",
    rotate: -4,
    motion: { x: 2, y: 3 },
    delay: 0.3,
  },
  {
    text: "JavaScript",
    // East mid — right edge below editor body
    slot: "top-[60%] right-0 -translate-y-1/2 hidden sm:block",
    rotate: 4,
    motion: { x: -2, y: 3 },
    delay: 0.45,
  },
  {
    text: "CompTIA A+",
    // SW gutter — clear of diagnostics content
    slot: "bottom-0 left-0",
    rotate: 5,
    motion: { x: 2, y: -2 },
    delay: 0.2,
  },
  {
    text: "Networking",
    // SE gutter — above status chip
    slot: "bottom-[20%] right-0 hidden md:block",
    rotate: -5,
    motion: { x: -3, y: 2 },
    delay: 0.35,
  },
  {
    text: "Graphic Design",
    // North-center strip — above both panel crowns
    slot: "top-0 left-1/2 -translate-x-1/2 hidden lg:block",
    rotate: 3,
    motion: { x: 2, y: -3 },
    delay: 0.5,
  },
  {
    text: "HTML",
    // West gap twin — below Tailwind slot, still left of editor
    slot: "top-[52%] left-0 hidden sm:block",
    rotate: -7,
    motion: { x: 3, y: 2 },
    delay: 0.25,
  },
  {
    text: "CSS",
    // East upper strip — right edge above editor body
    slot: "top-[12%] right-0 hidden md:block",
    rotate: 6,
    motion: { x: -2, y: 2 },
    delay: 0.4,
  },
  {
    text: "Git",
    // Lower-east gap — between diagnostics right edge and status
    slot: "bottom-[12%] right-[28%] hidden lg:block",
    rotate: -3,
    motion: { x: 2, y: -2 },
    delay: 0.55,
  },
  {
    text: "Framer Motion",
    // Lower-west gap — above diagnostics, left of editor
    slot: "top-[66%] left-0 hidden lg:block",
    rotate: 4,
    motion: { x: 3, y: -2 },
    delay: 0.6,
  },
];

const heroEntrance = {
  type: "spring" as const,
  stiffness: 140,
  damping: 22,
  mass: 0.85,
  delay: 0.3,
};

export function Hero() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-x-clip pb-16 pt-[calc(var(--nav-height)+1rem)]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8">
        <motion.div
          className="relative z-10"
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : heroEntrance}
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Portfolio
          </p>
          <h1 className="font-display text-5xl font-semibold tracking-[0.06em] text-text sm:text-6xl lg:text-7xl">
            <SignatureName name={SITE.name} />
          </h1>
          <p className="mt-4 text-lg font-medium text-secondary sm:text-xl">
            {SITE.title}
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {SITE.tagline}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/projects" size="lg">
              View Projects
            </Button>
            <Button href="/contact" variant="outline" size="lg">
              Contact Me
            </Button>
          </div>
        </motion.div>

        <div className="relative mx-auto h-[420px] w-full max-w-lg sm:h-[480px] lg:h-[520px]">
          {/* Labels stay in gutters; z below panels so glass never reveals them through content */}
          {floatingLabels.map((label, i) => (
            <motion.div
              key={label.text}
              aria-hidden="true"
              className={`pointer-events-none absolute z-[5] ${label.slot}`}
              style={{ rotate: label.rotate }}
              animate={
                reducedMotion
                  ? undefined
                  : {
                      x: [-label.motion.x, label.motion.x, -label.motion.x],
                      y: [-label.motion.y, label.motion.y, -label.motion.y],
                    }
              }
              transition={
                reducedMotion
                  ? undefined
                  : {
                      // Shared phase family so floats feel synced, not random
                      duration: 8.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: label.delay * 0.65,
                    }
              }
            >
              <Badge
                tone={i % 2 === 0 ? "secondary" : "default"}
                className="glass shadow-lg"
              >
                {label.text}
              </Badge>
            </motion.div>
          ))}

          <motion.div
            className="code-panel glass absolute left-2 top-8 z-10 w-[min(78%,20rem)] -rotate-3 overflow-hidden rounded-[var(--radius-md)] p-4 shadow-2xl sm:left-4 sm:w-[78%]"
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <div className="mb-3 flex items-center gap-2">
              <Terminal className="size-4 text-secondary" />
              <span className="font-mono text-xs text-muted">zsh — ~/build</span>
            </div>
            <pre className="font-mono text-[11px] leading-relaxed sm:text-xs">
              <span className="tok tok-prompt">$</span>{" "}
              <span className="tok tok-cmd">npm</span>{" "}
              <span className="tok tok-cmd">run</span>{" "}
              <span className="tok tok-fn">build</span>
              {"\n"}
              <span className="tok tok-success">✓</span>{" "}
              <span className="tok tok-plain">Compiled successfully</span>
              {"\n"}
              <span className="tok tok-success">✓</span>{" "}
              <span className="tok tok-plain">Optimized images</span>
              {"\n"}
              <span className="tok tok-op">→</span>{" "}
              <span className="tok tok-plain">Ready on</span>{" "}
              <span className="tok tok-num">:3000</span>
            </pre>
          </motion.div>

          <motion.div
            className="code-panel glass absolute right-0 top-28 z-[11] w-[min(72%,18rem)] rotate-2 overflow-hidden rounded-[var(--radius-md)] border border-white/10 p-4 shadow-2xl sm:w-[72%]"
            initial={reducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.45, delay: 0.22, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs text-muted">editor.tsx</span>
              <span className="size-2 rounded-full bg-secondary/80" />
            </div>
            <pre className="font-mono text-[11px] leading-relaxed sm:text-xs">
              <span className="tok tok-kw">const</span>{" "}
              <span className="tok tok-var">portfolio</span>{" "}
              <span className="tok tok-op">=</span>{" "}
              <span className="tok tok-punct">{"{"}</span>
              {"\n"}
              {"  "}
              <span className="tok tok-prop">craft</span>
              <span className="tok tok-punct">:</span>{" "}
              <span className="tok tok-str">&quot;intentional&quot;</span>
              <span className="tok tok-punct">,</span>
              {"\n"}
              {"  "}
              <span className="tok tok-prop">stack</span>
              <span className="tok tok-punct">:</span>{" "}
              <span className="tok tok-punct">[</span>
              <span className="tok tok-str-alt">&quot;Next&quot;</span>
              <span className="tok tok-punct">,</span>{" "}
              <span className="tok tok-str-alt">&quot;TS&quot;</span>
              <span className="tok tok-punct">]</span>
              <span className="tok tok-punct">,</span>
              {"\n"}
              <span className="tok tok-punct">{"}"}</span>
              <span className="tok tok-punct">;</span>
            </pre>
          </motion.div>

          <motion.div
            className="glass absolute bottom-10 left-6 z-[12] w-[min(70%,18rem)] -rotate-2 rounded-[var(--radius-md)] p-4 shadow-2xl sm:w-[70%]"
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.45, delay: 0.32, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <div className="mb-3 flex items-center gap-2">
              <Activity className="size-4 text-secondary" />
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
                <Cpu className="size-3.5 text-muted" />
                Thermals nominal
              </li>
            </ul>
          </motion.div>

          <motion.div
            className="glass absolute bottom-2 right-4 z-[13] flex items-center gap-3 rounded-xl px-3 py-2 -rotate-1"
            animate={reducedMotion ? undefined : { y: [0, -3, 0] }}
            transition={{
              duration: 8.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4,
            }}
          >
            <span className="relative flex size-2.5">
              {!reducedMotion ? (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary/40 opacity-60" />
              ) : null}
              <span className="relative inline-flex size-2.5 rounded-full bg-secondary/70" />
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
