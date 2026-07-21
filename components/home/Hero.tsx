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
import { SITE, TECH_BADGES } from "@/lib/constants";

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
    <section className="relative flex min-h-[100svh] items-center pb-16 pt-[calc(var(--nav-height)+1rem)]">
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
                      tone={i % 2 === 0 ? "secondary" : "default"}
                      className="glass shadow-lg"
                    >
                      {tech}
                    </Badge>
                  </motion.div>
                );
              })
            : null}

          <motion.div
            className="code-panel glass absolute left-2 top-8 z-10 w-[78%] -rotate-3 overflow-hidden rounded-2xl p-4 shadow-2xl sm:left-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
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
            className="code-panel glass absolute right-0 top-28 z-[11] w-[72%] rotate-2 overflow-hidden rounded-2xl border border-white/10 p-4 shadow-2xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
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
            className="glass absolute bottom-10 left-6 z-[12] w-[70%] -rotate-2 rounded-2xl p-4 shadow-2xl"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
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
            animate={
              reducedMotion ? undefined : { y: [0, -6, 0] }
            }
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="relative flex size-2.5">
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
