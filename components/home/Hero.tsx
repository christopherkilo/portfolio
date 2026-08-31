"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
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
    // NW — crowns the terminal
    slot: "top-0 left-1 sm:left-2",
    rotate: -5,
    motion: { x: 3, y: -3 },
    delay: 0,
  },
  {
    text: "TypeScript",
    // NE — above the editor crown
    slot: "top-0 right-2 sm:right-3",
    rotate: 4,
    motion: { x: -3, y: -2 },
    delay: 0.15,
  },
  {
    text: "Tailwind",
    // West — beside the diagonal seam
    slot: "top-[40%] left-0 -translate-y-1/2",
    rotate: -3,
    motion: { x: 2, y: 3 },
    delay: 0.3,
  },
  {
    text: "JavaScript",
    // East — right of the editor body
    slot: "top-[58%] right-0 -translate-y-1/2 hidden sm:block",
    rotate: 3,
    motion: { x: -2, y: 3 },
    delay: 0.45,
  },
  {
    text: "CompTIA A+",
    // SW — above diagnostics; hide on the tightest phones to avoid collisions
    slot: "bottom-1 left-0 hidden sm:block",
    rotate: 4,
    motion: { x: 2, y: -2 },
    delay: 0.2,
  },
  {
    text: "Networking",
    // SE — frames status / editor lower edge
    slot: "bottom-[18%] right-0 hidden md:block",
    rotate: -4,
    motion: { x: -3, y: 2 },
    delay: 0.35,
  },
  {
    text: "Graphic Design",
    // North-center — over the pair’s crown
    slot: "top-0 left-[42%] -translate-x-1/2 hidden lg:block",
    rotate: 2,
    motion: { x: 2, y: -3 },
    delay: 0.5,
  },
  {
    text: "HTML",
    // West mid — under Tailwind, beside terminal/editor seam
    slot: "top-[49%] left-0 hidden sm:block",
    rotate: -5,
    motion: { x: 3, y: 2 },
    delay: 0.25,
  },
  {
    text: "CSS",
    // East upper — right of terminal / above editor
    slot: "top-[14%] right-0 hidden md:block",
    rotate: 5,
    motion: { x: -2, y: 2 },
    delay: 0.4,
  },
  {
    text: "Git",
    // Lower seam — between editor and diagnostics
    slot: "bottom-[14%] right-[30%] hidden lg:block",
    rotate: -2,
    motion: { x: 2, y: -2 },
    delay: 0.55,
  },
  {
    text: "Framer Motion",
    // Lower-west — beside diagnostics, below the pair
    slot: "top-[64%] left-0 hidden lg:block",
    rotate: 3,
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

/** Shared idle float for hero panels — gentle and continuous; hover does not lift. */
function panelIdleMotion(
  reducedMotion: boolean | null,
  delay: number,
  active: boolean,
) {
  if (reducedMotion || !active) {
    return {
      animate: { opacity: 1, y: 0 },
      transition: { duration: reducedMotion ? 0 : 0.35 },
    };
  }
  return {
    animate: { opacity: 1, y: [0, -6, 0] },
    transition: {
      opacity: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const },
      y: {
        duration: 7.5,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay,
      },
    },
  };
}

export function Hero() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.2 });
  const idle = Boolean(inView);
  const terminalMotion = panelIdleMotion(reducedMotion, 0.12, idle);
  const editorMotion = panelIdleMotion(reducedMotion, 0.22, idle);
  const diagnosticsMotion = panelIdleMotion(reducedMotion, 0.32, idle);

  return (
    <section
      ref={sectionRef}
      className="hero-section relative flex min-h-[100svh] items-center overflow-x-clip pb-12 pt-[calc(var(--nav-height)+0.75rem)] sm:pb-16 sm:pt-[calc(var(--nav-height)+1rem)]"
    >
      <div className="hero-grid mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:gap-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8">
        <motion.div
          className="hero-copy relative z-10"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : heroEntrance}
        >
          <p className="hero-kicker mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Portfolio
          </p>
          <h1 className="hero-title font-display text-[2.125rem] font-semibold leading-tight tracking-[0.06em] text-text min-[380px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
            <SignatureName name={SITE.name} />
          </h1>
          <p className="hero-role mt-4 text-lg font-medium text-secondary sm:text-xl">
            {SITE.title}
          </p>
          <p className="hero-tagline mt-5 max-w-xl text-base leading-relaxed text-secondary sm:text-lg">
            {SITE.tagline}
          </p>
          <div className="hero-cta mt-8 flex flex-wrap gap-3">
            <Button href="/projects" size="lg">
              View Projects
            </Button>
            <Button href="/contact" variant="outline" size="lg">
              Contact Me
            </Button>
          </div>
        </motion.div>

        <div className="hero-illustration relative mx-auto h-[400px] w-full max-w-lg overflow-hidden sm:h-[420px] sm:overflow-visible md:h-[480px] lg:h-[520px]">
          {/* Labels stay in gutters; z below panels so glass never reveals them through content */}
          {floatingLabels.map((label, i) => (
            <motion.div
              key={label.text}
              aria-hidden="true"
              className={`pointer-events-none absolute z-[5] ${label.slot}`}
              style={{ rotate: label.rotate }}
              animate={
                reducedMotion || !idle
                  ? { x: 0, y: 0 }
                  : {
                      x: [-label.motion.x, label.motion.x, -label.motion.x],
                      y: [-label.motion.y, label.motion.y, -label.motion.y],
                    }
              }
              transition={
                reducedMotion || !idle
                  ? { duration: reducedMotion ? 0 : 0.35 }
                  : {
                      // Shared phase family so floats feel synced, not random
                      duration: 7.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: label.delay * 0.65,
                    }
              }
            >
              <Badge
                tone={i % 2 === 0 ? "secondary" : "default"}
                className="hero-tech-tag glass shadow-lg"
              >
                {label.text}
              </Badge>
            </motion.div>
          ))}

          {/*
            Diagonal pair — midpoint between heavy overlap and disconnected stack.
            Edges may kiss (~10–20px); text regions stay clear. Terminal stacks above.
          */}
          <motion.div
            className="code-panel glass absolute left-2 top-5 z-20 w-[min(82%,19.5rem)] -rotate-1 overflow-hidden rounded-[var(--radius-md)] p-3 shadow-2xl sm:left-3 sm:top-6 sm:w-[min(76%,19rem)] sm:-rotate-2 sm:p-4 md:left-4 md:top-7 lg:w-[min(74%,19rem)]"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={terminalMotion.animate}
            transition={terminalMotion.transition}
          >
            <div className="mb-3 flex items-center gap-2">
              <Terminal className="hero-panel-icon size-4" />
              <span className="hero-panel-muted font-mono text-xs">zsh — ~/build</span>
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
            className="code-panel glass absolute right-2 top-[6.75rem] z-10 w-[min(78%,18rem)] rotate-1 overflow-hidden rounded-[var(--radius-md)] border border-white/10 p-3 shadow-2xl sm:right-3 sm:top-[8rem] sm:w-[min(72%,18rem)] sm:rotate-1 sm:p-4 md:right-4 md:top-[8.75rem] lg:top-[9.25rem] lg:w-[min(70%,17.5rem)]"
            initial={reducedMotion ? false : { opacity: 0, y: 14 }}
            animate={editorMotion.animate}
            transition={editorMotion.transition}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="hero-panel-muted font-mono text-xs">editor.tsx</span>
              <span className="size-2 rounded-full bg-[color:var(--hero-panel-text-secondary)] opacity-80" />
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
            className="glass absolute bottom-14 left-2 z-[15] w-[min(58%,13rem)] -rotate-1 rounded-[var(--radius-md)] p-2.5 shadow-2xl sm:bottom-8 sm:left-3 sm:w-[min(62%,15.5rem)] sm:p-4 md:bottom-10 md:left-4"
            initial={reducedMotion ? false : { opacity: 0, y: 14 }}
            animate={diagnosticsMotion.animate}
            transition={diagnosticsMotion.transition}
          >
            <div className="mb-2 flex items-center gap-2 sm:mb-3">
              <Activity className="hero-panel-icon size-4" />
              <span className="hero-panel-text text-xs font-medium">Diagnostics</span>
            </div>
            <ul className="hero-panel-secondary space-y-1.5 text-[11px] sm:space-y-2 sm:text-xs">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="hero-panel-icon size-3.5 shrink-0" />
                Build pipeline healthy
              </li>
              <li className="flex items-center gap-2">
                <Wifi className="hero-panel-icon size-3.5 shrink-0" />
                Network latency 12ms
              </li>
              <li className="hidden items-center gap-2 sm:flex">
                <Cpu className="hero-panel-icon size-3.5 opacity-70" />
                Thermals nominal
              </li>
            </ul>
          </motion.div>

          <motion.div
            className="glass absolute bottom-2 right-2 z-[16] flex max-w-[min(90%,14rem)] items-center gap-2.5 rounded-xl px-2.5 py-2 -rotate-1 sm:bottom-3 sm:right-3 sm:max-w-none sm:gap-3 sm:px-3 md:right-4"
            animate={
              reducedMotion || !idle ? { y: 0 } : { y: [0, -6, 0] }
            }
            transition={{
              duration: 7.5,
              repeat: reducedMotion || !idle ? 0 : Infinity,
              ease: "easeInOut",
              delay: 0.4,
            }}
          >
            <span className="relative flex size-2.5">
              {!reducedMotion && idle ? (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--hero-panel-text-secondary)] opacity-40" />
              ) : null}
              <span className="relative inline-flex size-2.5 rounded-full bg-[color:var(--hero-panel-text-secondary)] opacity-70" />
            </span>
            <div>
              <p className="hero-panel-muted text-[10px] uppercase tracking-wider">
                System
              </p>
              <p className="hero-panel-text text-xs font-medium">All services online</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
