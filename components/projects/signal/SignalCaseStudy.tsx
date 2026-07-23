"use client";

import Image from "next/image";
import Link from "next/link";
import { Source_Serif_4 } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Grid3X3,
  Maximize2,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/shared/Reveal";
import { cn } from "@/lib/utils";
import {
  CaseStudyDesktopNav,
  CaseStudyFooterNav,
  CaseStudyLightbox,
  CaseStudyMobileToc,
  CaseStudyProgress,
  CaseStudyScrollCue,
  useActiveSection,
} from "@/components/projects/shared/CaseStudyChrome";
import {
  FEATURE_COPY,
  SIGNAL,
  SIGNAL_ARCHITECTURE,
  SIGNAL_AUDIENCE,
  SIGNAL_COLORS,
  SIGNAL_COVERS,
  SIGNAL_DEPARTMENTS,
  SIGNAL_PROCESS,
  SIGNAL_PRODUCTION,
  SIGNAL_SECTIONS,
  SIGNAL_SPREADS,
  SIGNAL_SURVEY,
  SIGNAL_TOC,
  SIGNAL_TYPE_SCALE,
  SIGNAL_VOICE,
} from "@/lib/signal/content";
import {
  BarcodePlaceholder,
  Folio,
  GridOverlay,
  MetaLabel,
  PaperFrame,
} from "@/components/projects/signal/SignalPrimitives";

const signalSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-signal-serif",
  display: "swap",
});

const CHART_COLORS = ["#E85D04", "#2F4F8A", "#121212", "#8A847A", "#C45C26"];
const SIGNAL_ACCENT = "#E85D04";
const TOOLTIP_STYLE = {
  backgroundColor: "#121212",
  border: `1px solid ${SIGNAL_ACCENT}`,
  borderRadius: "10px",
  color: "#F7F4EF",
};

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 max-w-3xl">
      <MetaLabel>{eyebrow}</MetaLabel>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function CoverArt({
  concept,
  mono = false,
  compact = false,
  showGrid = false,
}: {
  concept: (typeof SIGNAL_COVERS)[number]["id"];
  mono?: boolean;
  compact?: boolean;
  showGrid?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative h-full overflow-hidden bg-[#F7F4EF] text-[#121212]",
        mono && "grayscale",
        compact ? "p-4" : "p-5 sm:p-6",
      )}
    >
      <GridOverlay visible={showGrid} />
      {concept === "primary" ? (
        <>
          <div className="absolute inset-y-0 left-0 w-[38%] bg-[#121212]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="max-w-[34%]">
              <Image
                src="/projects/signal-magazine/wordmark.svg"
                alt="Signal wordmark"
                width={180}
                height={42}
                className="h-auto w-full brightness-0 invert"
              />
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#E85D04]">
                {SIGNAL.issue}
              </p>
              <p className="mt-10 font-display text-xl font-semibold leading-tight text-[#F7F4EF] sm:text-2xl">
                HUMAN
                <br />
                <span className="text-[#E85D04]">/ MACHINE</span>
              </p>
            </div>
            <div className="ml-[42%] space-y-3 pb-8">
              <div
                aria-hidden
                className="aspect-[4/3] rounded-sm bg-gradient-to-br from-[#2F4F8A]/30 via-[#E85D04]/20 to-[#121212]/10"
              />
              <p className="font-display text-lg font-semibold leading-tight sm:text-xl">
                The New Creative Machine
              </p>
              <p className="text-xs text-[#8A847A]">
                Hardware · Interfaces · Connection
              </p>
              <div className="flex items-end justify-between gap-3 pt-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#8A847A]">
                  {SIGNAL.date} · {SIGNAL.price}
                </p>
                <BarcodePlaceholder className="w-24" />
              </div>
            </div>
          </div>
        </>
      ) : null}
      {concept === "type" ? (
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <p className="font-display text-xl font-bold tracking-[0.14em]">SIGNAL</p>
            <MetaLabel className="text-[#E85D04]">{SIGNAL.issue}</MetaLabel>
          </div>
          <p className="font-display text-5xl font-semibold leading-[0.9] tracking-tight sm:text-6xl">
            HUMAN
            <br />
            MACHINE
          </p>
          <div className="flex items-end justify-between border-t border-[#121212]/15 pt-4">
            <p className="max-w-[18ch] text-sm text-[#2A2926]">
              The New Creative Machine and other essays on authorship after automation.
            </p>
            <BarcodePlaceholder className="w-20" />
          </div>
        </div>
      ) : null}
      {concept === "image" ? (
        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-bold tracking-[0.16em]">SIGNAL</p>
            <MetaLabel>{SIGNAL.issue}</MetaLabel>
          </div>
          <div
            aria-hidden
            className="mt-4 flex-1 rounded-sm bg-gradient-to-b from-[#121212] via-[#2F4F8A] to-[#E85D04]/70"
          />
          <p className="mt-4 font-display text-2xl font-semibold">Human / Machine</p>
          <p className="mt-1 text-xs text-[#8A847A]">
            Feature: The New Creative Machine · {SIGNAL.date}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function SpreadCanvas({
  spreadId,
  showGrid,
}: {
  spreadId: (typeof SIGNAL_SPREADS)[number]["id"];
  showGrid: boolean;
}) {
  const spread =
    SIGNAL_SPREADS.find((item) => item.id === spreadId) ?? SIGNAL_SPREADS[0];

  return (
    <PaperFrame className="aspect-[11/8.5] w-full">
      <div className="relative h-full bg-[#F7F4EF] p-[4%]">
        <GridOverlay visible={showGrid} />
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8A847A]">
          Signal · Feature · {spread.folio}
        </p>

        {spreadId === "open" ? (
          <div className="mt-4 grid h-[85%] grid-cols-12 gap-3">
            <div className="col-span-7 rounded-sm bg-gradient-to-br from-[#121212] via-[#2F4F8A] to-[#E85D04]/50" />
            <div className="col-span-5 flex flex-col justify-end pb-6">
              <MetaLabel>Feature</MetaLabel>
              <h3 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                The New Creative Machine
              </h3>
              <p
                className="mt-4 text-sm leading-relaxed text-[#2A2926]"
                style={{ fontFamily: "var(--font-signal-serif), Georgia, serif" }}
              >
                {FEATURE_COPY.deck}
              </p>
            </div>
          </div>
        ) : null}

        {spreadId === "intro" ? (
          <div className="mt-6 grid h-[82%] grid-cols-12 gap-4">
            <div className="col-span-12 sm:col-span-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2F4F8A]">
                Words by {FEATURE_COPY.author}
              </p>
              <div
                className="mt-4 columns-1 gap-6 text-[15px] leading-relaxed text-[#2A2926] sm:columns-2"
                style={{ fontFamily: "var(--font-signal-serif), Georgia, serif" }}
              >
                {FEATURE_COPY.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
            <aside className="col-span-12 border-l border-[#E85D04]/50 pl-4 sm:col-span-4">
              <MetaLabel>Side note</MetaLabel>
              <p className="mt-3 text-sm leading-relaxed text-[#2A2926]">
                Across twelve studios, teams described tools as amplifiers of existing
                taste—not substitutes for editorial judgment.
              </p>
            </aside>
          </div>
        ) : null}

        {spreadId === "image" ? (
          <div className="mt-4 grid h-[85%] grid-cols-12 gap-3">
            <div className="relative col-span-9 overflow-hidden rounded-sm bg-[#121212]">
              <Image
                src="/projects/signal-magazine/images/hardware-detail.svg"
                alt="Close-up of hands adjusting a prototype console"
                fill
                sizes="(max-width: 768px) 75vw, 700px"
                className="object-cover"
              />
            </div>
            <div className="col-span-3 flex flex-col justify-end">
              <p className="text-xs leading-relaxed text-[#8A847A]">
                Fig. 04 — Hands adjusting a prototype console.
              </p>
            </div>
          </div>
        ) : null}

        {spreadId === "quote" ? (
          <div className="mt-10 flex h-[75%] flex-col justify-center px-[8%]">
            <span className="mb-6 h-1 w-16 bg-[#E85D04]" />
            <blockquote className="font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {FEATURE_COPY.pullQuote}
            </blockquote>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8A847A]">
              — Studio lead, excerpted interview
            </p>
          </div>
        ) : null}

        {spreadId === "dense" ? (
          <div className="mt-5 grid h-[82%] grid-cols-12 gap-3 text-[13px] leading-relaxed text-[#2A2926]">
            {[0, 1, 2].map((column) => (
              <div
                key={column}
                className="col-span-12 sm:col-span-3"
                style={{ fontFamily: "var(--font-signal-serif), Georgia, serif" }}
              >
                <p>
                  Selection becomes craft when options multiply. Teams built critique
                  rituals before accepting generated drafts into the working file.
                </p>
                <p className="mt-3">
                  The densest pages still protect a reading path: short measure, clear
                  subheads, and a sidebar for definitions.
                </p>
              </div>
            ))}
            <aside className="col-span-12 rounded-sm bg-[#121212] p-4 text-[#F7F4EF] sm:col-span-3">
              <MetaLabel className="text-[#E85D04]">Glossary</MetaLabel>
              <p className="mt-3 text-sm">Authorship · Constraint · Taste · Tempo</p>
            </aside>
          </div>
        ) : null}

        {spreadId === "close" ? (
          <div className="mt-8 grid h-[80%] grid-cols-12 gap-4">
            <div className="col-span-12 flex flex-col justify-between sm:col-span-7">
              <div>
                <h3 className="font-display text-3xl font-semibold">What remains human</h3>
                <p
                  className="mt-4 max-w-prose text-[15px] leading-relaxed text-[#2A2926]"
                  style={{ fontFamily: "var(--font-signal-serif), Georgia, serif" }}
                >
                  The machine can propose. The publication still asks who decides, who
                  is credited, and who is accountable when the work meets an audience.
                </p>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#2F4F8A]">
                Continued in Interview · p.22
              </p>
            </div>
            <div className="col-span-12 rounded-sm bg-gradient-to-b from-[#E85D04]/25 to-[#121212]/15 sm:col-span-5" />
          </div>
        ) : null}

        <Folio left="Signal 01 · Feature" right={spread.folio} />
      </div>
    </PaperFrame>
  );
}

function DepartmentSample({
  id,
}: {
  id: (typeof SIGNAL_DEPARTMENTS)[number]["id"];
}) {
  const line = "h-1.5 rounded-full bg-[#121212]/12";

  if (id === "news") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {["Briefing", "Dispatch", "Update", "Signal"].map((label, index) => (
          <div key={label} className="border-t-2 border-[#E85D04] bg-[#121212]/[0.04] p-2">
            <p className="font-mono text-[7px] uppercase tracking-wider text-[#2F4F8A]">
              0{index + 1} · {label}
            </p>
            <div className={cn("mt-2 w-full", line)} />
            <div className={cn("mt-1 w-3/4", line)} />
          </div>
        ))}
      </div>
    );
  }

  if (id === "interview") {
    return (
      <div className="space-y-3 border-l border-[#E85D04]/50 pl-3">
        {["What should tools make visible?", "Constraints, authorship, and consequence."].map(
          (copy, index) => (
            <div key={copy} className="grid grid-cols-[1.5rem_1fr] gap-2">
              <span className="font-mono text-[10px] font-bold text-[#E85D04]">
                {index === 0 ? "Q" : "A"}
              </span>
              <p
                className={cn(
                  "text-[10px] leading-relaxed",
                  index === 0 ? "font-mono uppercase" : "text-[#2A2926]",
                )}
              >
                {copy}
              </p>
            </div>
          ),
        )}
      </div>
    );
  }

  if (id === "profile") {
    return (
      <div className="grid grid-cols-[1.2fr_0.8fr] gap-3">
        <div className="min-h-24 bg-gradient-to-br from-[#121212] via-[#2F4F8A] to-[#E85D04]/60" />
        <div className="flex flex-col justify-between border-l border-[#121212]/15 pl-2">
          <MetaLabel>Studio 04</MetaLabel>
          <div className="space-y-1">
            <div className={cn("w-full", line)} />
            <div className={cn("w-2/3", line)} />
            <div className={cn("w-4/5", line)} />
          </div>
        </div>
      </div>
    );
  }

  if (id === "opinion") {
    return (
      <div className="grid grid-cols-[2.5rem_1fr] gap-2">
        <span className="font-display text-6xl font-semibold leading-[0.75] text-[#E85D04]">
          T
        </span>
        <div className="space-y-1.5 pt-1">
          {[100, 92, 96, 72, 88].map((width, index) => (
            <div key={index} className={line} style={{ width: `${width}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (id === "tools") {
    return (
      <ol className="space-y-2">
        {["Studio light", "Input console", "Proof display"].map((tool, index) => (
          <li key={tool} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 border-b border-[#121212]/10 pb-2">
            <span className="font-display text-lg font-semibold text-[#E85D04]">
              {index + 1}
            </span>
            <span className="text-[10px] text-[#2A2926]">{tool}</span>
            <span className="rounded-full bg-[#121212] px-1.5 py-0.5 font-mono text-[7px] text-[#F7F4EF]">
              {9 - index}.0
            </span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="flex min-h-24 flex-col justify-between px-5">
      <span className="h-px w-10 bg-[#E85D04]" />
      <p
        className="max-w-[22ch] text-xs leading-relaxed text-[#2A2926]"
        style={{ fontFamily: "var(--font-signal-serif), Georgia, serif" }}
      >
        Attention returns slowly when the page leaves enough room for silence.
      </p>
      <span className="self-end font-mono text-[8px] text-[#8A847A]">46—47</span>
    </div>
  );
}

function LightboxPreview({ title }: { title: string }) {
  if (title === "Open spread") {
    return <SpreadCanvas spreadId="open" showGrid={false} />;
  }

  if (title === "Front cover" || title === "Newsstand comparison") {
    return (
      <div className="grid grid-cols-2 items-end gap-4 sm:grid-cols-3">
        <PaperFrame className="aspect-[3/4]">
          <CoverArt concept="type" compact />
        </PaperFrame>
        <PaperFrame className="aspect-[3/4] shadow-2xl sm:-translate-y-4">
          <CoverArt concept="primary" compact />
        </PaperFrame>
        <PaperFrame className="hidden aspect-[3/4] sm:block">
          <CoverArt concept="image" compact />
        </PaperFrame>
      </div>
    );
  }

  if (title === "Spine view") {
    return (
      <PaperFrame className="mx-auto flex h-[26rem] w-28 items-center justify-center bg-[#121212]">
        <p className="rotate-180 font-display tracking-[0.3em] text-[#F7F4EF] [writing-mode:vertical-rl]">
          SIGNAL · HUMAN / MACHINE · 01
        </p>
      </PaperFrame>
    );
  }

  if (title === "Back cover") {
    return (
      <PaperFrame className="mx-auto flex aspect-[3/4] max-w-sm flex-col justify-between p-8">
        <Image
          src="/projects/signal-magazine/wordmark.svg"
          alt="Signal wordmark"
          width={180}
          height={42}
          className="h-auto w-36"
        />
        <p className="max-w-[24ch] font-display text-2xl font-semibold text-[#2A2926]">
          Create after thinking.
        </p>
        <BarcodePlaceholder className="w-32" />
      </PaperFrame>
    );
  }

  return (
    <div className="relative mx-auto aspect-[4/3] max-w-xl">
      <PaperFrame className="absolute left-[8%] top-[8%] h-[78%] w-[58%] -rotate-6 shadow-xl">
        <CoverArt concept="primary" compact />
      </PaperFrame>
      <PaperFrame className="absolute bottom-[5%] right-[7%] h-[72%] w-[54%] rotate-6 p-3 shadow-2xl">
        <SpreadCanvas spreadId={title === "Desk presentation" ? "intro" : "image"} showGrid={false} />
      </PaperFrame>
    </div>
  );
}

export function SignalCaseStudy() {
  const reducedMotion = useReducedMotion();
  const activeSection = useActiveSection(SIGNAL_SECTIONS);
  const [coverId, setCoverId] = useState<(typeof SIGNAL_COVERS)[number]["id"]>("primary");
  const [showGrid, setShowGrid] = useState(false);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [tocHover, setTocHover] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [printVsDigital, setPrintVsDigital] = useState<"print" | "digital">("print");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const featureRef = useRef<HTMLElement>(null);
  const [featureIsIntersecting, setFeatureIsIntersecting] = useState(false);

  const activeCover =
    SIGNAL_COVERS.find((cover) => cover.id === coverId) ?? SIGNAL_COVERS[0];
  const activeSpread = SIGNAL_SPREADS[spreadIndex];

  const goSpread = useCallback(
    (direction: -1 | 1) => {
      setSpreadIndex((current) => {
        const next = current + direction;
        if (next < 0) return SIGNAL_SPREADS.length - 1;
        if (next >= SIGNAL_SPREADS.length) return 0;
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    const feature = featureRef.current;
    if (!feature) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setFeatureIsIntersecting(entries.some((entry) => entry.isIntersecting));
      },
      { rootMargin: "-15% 0px -15% 0px", threshold: 0.05 },
    );
    observer.observe(feature);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
      if (event.key === "ArrowLeft") goSpread(-1);
      if (event.key === "ArrowRight") goSpread(1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen, goSpread]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (fullscreen) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const focusIsInFeature =
        document.activeElement instanceof Node &&
        Boolean(featureRef.current?.contains(document.activeElement));
      if (!focusIsInFeature && !featureIsIntersecting) return;
      if (event.key === "ArrowLeft") goSpread(-1);
      if (event.key === "ArrowRight") goSpread(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [featureIsIntersecting, fullscreen, goSpread]);

  async function copyHex(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  }

  return (
    <article className={cn("relative pb-24", signalSerif.variable)}>
      <CaseStudyProgress accent={SIGNAL_ACCENT} />
      <CaseStudyDesktopNav
        sections={SIGNAL_SECTIONS}
        activeSection={activeSection}
        accent={SIGNAL_ACCENT}
      />

      <section className="relative overflow-hidden border-b border-white/8 bg-[#1A1917]">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 70% 20%, rgba(232,93,4,.18), transparent 40%), radial-gradient(circle at 15% 80%, rgba(47,79,138,.2), transparent 35%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E85D04]"
            >
              <ArrowLeft className="size-4" />
              Back to Projects
            </Link>
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-[#E85D04]">
              {SIGNAL.category} · {SIGNAL.year}
            </p>
            <Image
              src="/projects/signal-magazine/wordmark.svg"
              alt="Signal wordmark"
              width={430}
              height={100}
              priority
              className="mt-5 h-auto w-full max-w-md brightness-0 invert"
            />
            <p className="mt-3 font-display text-2xl text-[#F7F4EF]/90">
              {SIGNAL.issue}: {SIGNAL.theme}
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#B8B2A8] sm:text-lg">
              {SIGNAL.description} Issue 01 asks how technology reshapes creativity,
              identity, work, and daily habits—without losing readability.
            </p>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8A847A]">
                  Role
                </dt>
                <dd className="mt-1 text-sm text-[#E8E2D9]">{SIGNAL.role}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8A847A]">
                  Tools
                </dt>
                <dd className="mt-1 text-sm text-[#E8E2D9]">{SIGNAL.tools.join(" · ")}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Editorial Design",
                "Typography",
                "Grid Systems",
                "Art Direction",
                "Information Design",
              ].map((skill) => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>
          </div>
          <Reveal>
            <motion.div
              className="mx-auto w-full max-w-md"
              style={{ perspective: 1200 }}
              initial={reducedMotion ? false : { opacity: 0.75, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="aspect-[3/4] overflow-hidden rounded-sm shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
                style={{ transformStyle: "preserve-3d" }}
                animate={
                  reducedMotion
                    ? undefined
                    : { rotateY: [-6, -2, -6], rotateX: [2, 0, 2] }
                }
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                <CoverArt concept="primary" />
              </motion.div>
            </motion.div>
          </Reveal>
        </div>
        <div className="flex justify-center pb-8">
          <CaseStudyScrollCue
            href="#overview"
            reducedMotion={reducedMotion}
            className="text-[#8A847A] hover:text-[#F7F4EF] focus-visible:outline-[#E85D04]"
          />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-28 px-4 py-16 sm:px-6 lg:px-8">
        <CaseStudyMobileToc
          sections={SIGNAL_SECTIONS}
          activeSection={activeSection}
          accent={SIGNAL_ACCENT}
        />
        <section id="overview" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="01 · Project overview"
            title="A publication system for complex editorial storytelling"
            description="Signal Magazine demonstrates how typography, grid, image direction, and information design can carry an entire issue—from cover to data feature—while staying flexible for departments."
          />
          <PaperFrame className="p-6 sm:p-8">
            <p
              className="max-w-3xl text-xl leading-relaxed text-[#2A2926] sm:text-2xl"
              style={{ fontFamily: "var(--font-signal-serif), Georgia, serif" }}
            >
              {SIGNAL.statement}
            </p>
            <a
              href="#feature"
              className="mt-6 inline-flex items-center gap-2 border-b border-[#E85D04] pb-1 font-mono text-xs uppercase tracking-[0.16em] text-[#2A2926] transition hover:text-[#E85D04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E85D04]"
            >
              Jump to feature spreads
              <ArrowLeft className="size-3.5 -rotate-90" />
            </a>
          </PaperFrame>
        </section>

        <section id="challenge" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="02 · Editorial challenge"
            title="Experimental enough to feel alive, disciplined enough to read"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <PaperFrame className="p-6">
              <h3 className="font-display text-xl font-semibold">The brief</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#2A2926]">
                Create a magazine that feels visually experimental for a creative
                audience while remaining readable across long articles, interviews,
                reviews, and data-heavy pages.
              </p>
            </PaperFrame>
            <PaperFrame ink className="p-6">
              <h3 className="font-display text-xl font-semibold">The constraint</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#C8C2B8]">
                The system must support multiple content types without making every
                spread look identical—and without sacrificing hierarchy when density rises.
              </p>
            </PaperFrame>
          </div>
        </section>

        <section id="audience" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="03 · Audience and voice"
            title="Readers who want depth without academic distance"
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-wrap gap-2">
              {SIGNAL_AUDIENCE.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-secondary"
                >
                  {item}
                </span>
              ))}
            </div>
            <ul className="space-y-3">
              {SIGNAL_VOICE.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-muted">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#E85D04]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="architecture" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="04 · Content architecture"
            title="A believable issue sequence with gravity in the middle"
            description="Front matter orients, the feature carries weight, departments vary rhythm, and the closing essay restores quiet."
          />
          <div className="overflow-hidden rounded-2xl border border-white/8">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                <tr>
                  <th className="px-4 py-3">Pages</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Kind</th>
                </tr>
              </thead>
              <tbody>
                {SIGNAL_ARCHITECTURE.map((row) => (
                  <tr key={row.title} className="border-t border-white/6">
                    <td className="px-4 py-3 font-mono text-xs text-[#E85D04]">
                      {row.page}
                    </td>
                    <td className="px-4 py-3 text-secondary">{row.title}</td>
                    <td className="px-4 py-3 text-muted">{row.kind}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="grid" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="05 · Grid system"
            title="A 12-column master that flexes without collapsing"
            description="Consistent outer margins and baseline rhythm allow full-bleed images, two-column articles, three-column information pages, side notes, and data blocks."
          />
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowGrid((value) => !value)}
              aria-label={showGrid ? "Hide grid overlay" : "Show grid overlay"}
            >
              <Grid3X3 className="size-4" />
              {showGrid ? "Hide grid overlay" : "Show grid overlay"}
            </Button>
            <p className="text-sm text-muted">
              Toggle applies to the cover, feature spreads, and sample layouts below.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Full-width image", "12 columns · caption in margin"],
              ["Two-column article", "6 + 6 with shared baseline"],
              ["Three-column info", "4 + 4 + 4 modular cards"],
              ["Narrow text + wide image", "4 + 8 asymmetric"],
            ].map(([title, note]) => (
              <PaperFrame key={title} className="relative min-h-40 p-5">
                <GridOverlay visible={showGrid} />
                <MetaLabel>{note}</MetaLabel>
                <p className="mt-6 font-display text-lg font-semibold">{title}</p>
                <div className="mt-4 grid grid-cols-12 gap-1">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <span
                      key={index}
                      className="h-8 rounded-[2px] bg-[#121212]/8"
                      style={{ opacity: 0.15 + (index % 4) * 0.08 }}
                    />
                  ))}
                </div>
              </PaperFrame>
            ))}
          </div>
        </section>

        <section id="typography" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="06 · Typography"
            title="Three roles: display, editorial body, utility"
            description="Outfit for confident headlines, Source Serif 4 for long-form reading, JetBrains Mono for folios and metadata. Line length stays near 60–72 characters; body never drops below readable web sizes in this presentation."
          />
          <div className="space-y-4">
            {SIGNAL_TYPE_SCALE.map((item) => (
              <div
                key={item.role}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <MetaLabel>{item.role}</MetaLabel>
                  <p className="font-mono text-[10px] text-muted">{item.specs}</p>
                </div>
                <p
                  className={cn(
                    "mt-3 text-text",
                    item.role === "Cover title" && "font-display text-5xl font-bold tracking-[0.08em]",
                    item.role === "Feature headline" && "font-display text-3xl font-semibold",
                    item.role === "Deck" && "text-lg leading-relaxed",
                    item.role === "Author" && "font-mono text-xs uppercase tracking-[0.16em] text-muted",
                    item.role === "Body text" && "max-w-prose text-base leading-relaxed",
                    item.role === "Subheading" && "font-display text-xl font-semibold",
                    item.role === "Pull quote" && "font-display text-2xl font-semibold leading-tight",
                    item.role === "Caption" && "text-sm text-muted",
                    item.role === "Folio" && "font-mono text-xs uppercase tracking-[0.16em] text-muted",
                    item.role === "Sidebar" && "border-l-2 border-[#2F4F8A] pl-3 text-sm",
                    item.role === "Metadata" && "font-mono text-xs uppercase tracking-[0.14em]",
                  )}
                  style={
                    ["Deck", "Body text"].includes(item.role)
                      ? { fontFamily: "var(--font-signal-serif), Georgia, serif" }
                      : undefined
                  }
                >
                  {item.sample}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="color" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="07 · Color and image direction"
            title="Restrained palette, strong photography rules"
            description="Signal works primarily through type, layout, and imagery. Color is a quiet signal—not a neon takeover. Image direction: high-contrast portraits, hardware close-ups, studio environments, screen light, hands with tools, restrained duotone."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SIGNAL_COLORS.map((color) => (
              <button
                key={color.hex}
                type="button"
                onClick={() => copyHex(color.hex)}
                className="rounded-2xl border border-white/8 p-4 text-left transition hover:border-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E85D04]"
              >
                <span
                  className="block h-16 rounded-xl border border-black/10"
                  style={{ backgroundColor: color.hex }}
                />
                <p className="mt-3 font-display font-semibold">{color.name}</p>
                <p className="mt-1 flex items-center gap-2 font-mono text-xs text-muted">
                  {color.hex}
                  {copied === color.hex ? (
                    <Check className="size-3.5 text-[#E85D04]" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </p>
                <p className="mt-2 text-sm text-muted">{color.use}</p>
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["portrait-duotone.svg", "High-contrast portrait"],
              ["hardware-detail.svg", "Close-up hardware"],
              ["studio-environment.svg", "Studio environment"],
            ].map(([file, label]) => (
              <PaperFrame key={file} className="overflow-hidden p-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-[#121212]">
                  <Image
                    src={`/projects/signal-magazine/images/${file}`}
                    alt={label}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <p className="mt-3 text-sm font-medium text-[#2A2926]">{label}</p>
              </PaperFrame>
            ))}
          </div>
        </section>

        <section id="cover" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="08 · Cover design"
            title="Three concepts, one shelf-ready final"
          />
          <div className="mb-6 flex flex-wrap gap-2">
            {SIGNAL_COVERS.map((cover) => (
              <button
                key={cover.id}
                type="button"
                onClick={() => setCoverId(cover.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E85D04]",
                  coverId === cover.id
                    ? "border-[#E85D04] bg-[#E85D04]/15 text-text"
                    : "border-white/10 text-muted hover:text-text",
                )}
              >
                {cover.title}
              </button>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <PaperFrame className="aspect-[3/4]">
              <CoverArt concept={coverId} showGrid={showGrid} />
            </PaperFrame>
            <div className="space-y-4">
              <PaperFrame className="p-5">
                <MetaLabel>{activeCover.approach}</MetaLabel>
                <p className="mt-3 text-sm leading-relaxed text-[#2A2926]">
                  {activeCover.note}
                </p>
                {coverId === "primary" ? (
                  <p className="mt-3 text-sm leading-relaxed text-[#2A2926]">
                    The final hybrid kept masthead authority, theme clarity at distance,
                    and room for cover lines—winning the monochrome and thumbnail tests.
                  </p>
                ) : null}
              </PaperFrame>
              <div className="grid gap-3 sm:grid-cols-3">
                <PaperFrame className="aspect-[3/4]">
                  <CoverArt concept={coverId} compact />
                </PaperFrame>
                <PaperFrame className="aspect-[3/4]">
                  <CoverArt concept={coverId} mono compact />
                </PaperFrame>
                <button
                  type="button"
                  onClick={() => setLightbox("Newsstand comparison")}
                  className="rounded-2xl border border-dashed border-white/15 p-4 text-left transition hover:border-[#E85D04]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E85D04]"
                >
                  <MetaLabel>Mockup</MetaLabel>
                  <p className="mt-6 font-display text-lg font-semibold">
                    Newsstand comparison
                  </p>
                  <p className="mt-2 text-sm text-muted">Open lightbox preview</p>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="toc" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="09 · Table of contents"
            title="Hierarchy you can scan, pages you can find"
          />
          <PaperFrame className="p-6 sm:p-8">
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-[#121212]/10 pb-4">
              <div>
                <Image
                  src="/projects/signal-magazine/wordmark.svg"
                  alt="Signal wordmark"
                  width={180}
                  height={42}
                  className="h-auto w-40"
                />
                <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-[#E85D04]">
                  Contents · {SIGNAL.issue}
                </p>
              </div>
              <MetaLabel>Hover an article</MetaLabel>
            </div>
            <ul className="space-y-2">
              {SIGNAL_TOC.map((item) => {
                const active = tocHover === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setTocHover(item.id)}
                      onMouseLeave={() => setTocHover(null)}
                      onFocus={() => setTocHover(item.id)}
                      onBlur={() => setTocHover(null)}
                      className={cn(
                        "grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E85D04] sm:grid-cols-[7rem_1fr_5rem_4rem]",
                        active ? "bg-[#121212] text-[#F7F4EF]" : "hover:bg-[#121212]/5",
                      )}
                    >
                      <span
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-[0.16em]",
                          active ? "text-[#E85D04]" : "text-[#8A847A]",
                        )}
                      >
                        {item.section}
                      </span>
                      <span className="col-span-2 sm:col-span-1">
                        <span className="block font-display text-base font-semibold sm:text-lg">
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            "text-xs",
                            active ? "text-[#C8C2B8]" : "text-[#8A847A]",
                          )}
                        >
                          {item.author}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "hidden rounded-md px-2 py-1 text-xs sm:inline",
                          active ? "bg-[#E85D04]/20 text-[#F7F4EF]" : "text-[#8A847A]",
                        )}
                      >
                        {item.preview}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-sm tabular-nums",
                          active ? "text-[#E85D04]" : "text-[#2F4F8A]",
                        )}
                      >
                        {item.page}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </PaperFrame>
        </section>

        <section ref={featureRef} id="feature" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="10 · Feature article"
            title="The New Creative Machine"
            description="Six representative spreads with previous / next, thumbnails, keyboard arrows, optional grid overlay, and full-screen viewing—no slow page-flip gimmick."
          />
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => goSpread(-1)}>
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button type="button" variant="outline" onClick={() => goSpread(1)}>
              Next
              <ChevronRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowGrid((value) => !value)}
              aria-label={showGrid ? "Hide grid on spreads" : "Show grid on spreads"}
            >
              <Grid3X3 className="size-4" />
              Grid
            </Button>
            <Button type="button" variant="outline" onClick={() => setFullscreen(true)}>
              <Maximize2 className="size-4" />
              Full screen
            </Button>
            <motion.p
              key={activeSpread.id}
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-auto font-mono text-xs uppercase tracking-[0.16em] text-muted"
            >
              {activeSpread.title} · p.{activeSpread.folio}
            </motion.p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSpread.id}
              initial={reducedMotion ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <SpreadCanvas spreadId={activeSpread.id} showGrid={showGrid} />
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {SIGNAL_SPREADS.map((spread, index) => (
              <button
                key={spread.id}
                type="button"
                onClick={() => setSpreadIndex(index)}
                aria-current={index === spreadIndex}
                className={cn(
                  "min-w-[7.5rem] rounded-xl border px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E85D04]",
                  index === spreadIndex
                    ? "border-[#E85D04] bg-[#E85D04]/10"
                    : "border-white/10 hover:border-white/25",
                )}
              >
                <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                  {spread.folio}
                </span>
                <span className="mt-1 block text-xs font-medium">{spread.title}</span>
              </button>
            ))}
          </div>
        </section>

        <section id="departments" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="11 · Secondary departments"
            title="Distinct patterns inside one publication family"
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SIGNAL_DEPARTMENTS.map((department) => (
              <PaperFrame key={department.id} className="p-5">
                <MetaLabel>Department</MetaLabel>
                <h3 className="mt-3 font-display text-xl font-semibold">
                  {department.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#2A2926]">
                  {department.pattern}
                </p>
                <div className="mt-5 border-t border-[#121212]/10 pt-4">
                  <DepartmentSample id={department.id} />
                </div>
              </PaperFrame>
            ))}
          </div>
        </section>

        <section id="review" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="12 · Product review"
            title="Field Test: Lumen Desk Lamp Pro"
            description="Fictional product used to demonstrate review hierarchy. Specifications are sample layout values—not real product claims."
          />
          <PaperFrame className="overflow-hidden">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative min-h-80 overflow-hidden bg-[#121212]">
                <Image
                  src="/projects/signal-magazine/images/review-lumen.svg"
                  alt="Lumen Desk Lamp Pro product still"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
                <MetaLabel className="absolute left-6 top-6 text-[#E85D04]">
                  Product still
                </MetaLabel>
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl font-semibold">Lumen Desk Lamp Pro</h3>
                    <p className="mt-1 text-sm text-[#8A847A]">
                      Fictional review · Sample price $249
                    </p>
                  </div>
                  <div className="rounded-full bg-[#121212] px-3 py-1 font-mono text-xs text-[#F7F4EF]">
                    8.4 / 10
                  </div>
                </div>
                <p
                  className="mt-4 text-[15px] leading-relaxed text-[#2A2926]"
                  style={{ fontFamily: "var(--font-signal-serif), Georgia, serif" }}
                >
                  A focused task light that stays out of the way—until you need precise
                  color temperature shifts for late proofing sessions.
                </p>
                <blockquote className="mt-4 border-l-2 border-[#E85D04] pl-4 font-display text-lg font-semibold">
                  “It behaves like a tool, not a gadget.”
                </blockquote>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <MetaLabel>Strengths</MetaLabel>
                    <ul className="mt-2 space-y-1 text-sm text-[#2A2926]">
                      <li>Stable clamp geometry</li>
                      <li>Quiet brightness steps</li>
                      <li>Readable physical controls</li>
                    </ul>
                  </div>
                  <div>
                    <MetaLabel>Weaknesses</MetaLabel>
                    <ul className="mt-2 space-y-1 text-sm text-[#2A2926]">
                      <li>App pairing feels optional</li>
                      <li>Cable management is basic</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 overflow-hidden rounded-xl border border-[#121212]/10">
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {[
                        ["Color temp", "2700–6500K (sample)"],
                        ["CRI", "95+ (sample)"],
                        ["Power", "USB-C / sample draw"],
                        ["Verdict", "Recommended for small studios"],
                      ].map(([label, value]) => (
                        <tr key={label} className="border-t border-[#121212]/8 first:border-0">
                          <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A847A]">
                            {label}
                          </th>
                          <td className="px-3 py-2 text-[#2A2926]">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </PaperFrame>
        </section>

        <section id="data" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="13 · Data visualization"
            title="How creatives use technology"
            description={SIGNAL_SURVEY.disclaimer}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <PaperFrame className="p-5">
              <h3 className="font-display text-lg font-semibold">Primary creative tools</h3>
              <div className="mt-4 h-56" role="img" aria-label="Bar chart of primary creative tools">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...SIGNAL_SURVEY.tools]}>
                    <XAxis dataKey="name" tick={{ fill: "#8A847A", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#8A847A", fontSize: 11 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {SIGNAL_SURVEY.tools.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PaperFrame>
            <PaperFrame className="p-5">
              <h3 className="font-display text-lg font-semibold">AI tool frequency</h3>
              <div className="mt-4 h-56" role="img" aria-label="Pie chart of AI tool use frequency">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[...SIGNAL_SURVEY.aiUse]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={80}
                    >
                      {SIGNAL_SURVEY.aiUse.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {SIGNAL_SURVEY.aiUse.map((entry, index) => (
                  <li key={entry.name} className="flex items-center justify-between gap-3 text-xs text-[#2A2926]">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      {entry.name}
                    </span>
                    <span className="font-mono text-[#8A847A]">{entry.value}%</span>
                  </li>
                ))}
              </ul>
            </PaperFrame>
            <PaperFrame className="p-5 lg:col-span-2">
              <h3 className="font-display text-lg font-semibold">
                Screen time, environment, concern, valued traits
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {(
                  [
                    {
                      title: "Daily screen time",
                      rows: SIGNAL_SURVEY.screenTime.map((row) => ({
                        label: row.label,
                        value: row.value,
                      })),
                    },
                    {
                      title: "Work environment",
                      rows: SIGNAL_SURVEY.environment.map((row) => ({
                        label: row.name,
                        value: row.value,
                      })),
                    },
                    {
                      title: "Automation concern",
                      rows: SIGNAL_SURVEY.automationConcern.map((row) => ({
                        label: row.name,
                        value: row.value,
                      })),
                    },
                    {
                      title: "Most valued trait",
                      rows: SIGNAL_SURVEY.valuedTrait.map((row) => ({
                        label: row.name,
                        value: row.value,
                      })),
                    },
                  ] as const
                ).map((block) => (
                  <div key={block.title}>
                    <MetaLabel>{block.title}</MetaLabel>
                    <ul className="mt-2 space-y-2">
                      {block.rows.map((row) => (
                        <li key={row.label} className="text-sm text-[#2A2926]">
                          <div className="mb-1 flex justify-between gap-2">
                            <span>{row.label}</span>
                            <span className="font-mono text-xs text-[#8A847A]">
                              {row.value}%
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[#121212]/10">
                            <div
                              className="h-full rounded-full bg-[#E85D04]"
                              style={{ width: `${row.value}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </PaperFrame>
          </div>
          <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
            <MetaLabel>Text summaries for screen readers</MetaLabel>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {SIGNAL_SURVEY.summaries.map((summary) => (
                <li key={summary}>{summary}</li>
              ))}
            </ul>
          </div>
        </section>

        <section id="print" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="14 · Print mockups"
            title="Object presence without heavy 3D assets"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Front cover",
              "Open spread",
              "Stacked magazines",
              "Desk presentation",
              "Spine view",
              "Back cover",
            ].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setLightbox(label)}
                className="group text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E85D04]"
              >
                <PaperFrame className="p-4 transition group-hover:-translate-y-0.5">
                  {label === "Front cover" ? (
                    <div className="aspect-[3/4]">
                      <CoverArt concept="primary" compact />
                    </div>
                  ) : label === "Open spread" ? (
                    <div className="aspect-[11/8.5] bg-[#F7F4EF] p-3">
                      <div className="grid h-full grid-cols-2 gap-2">
                        <div className="bg-[#121212]/90" />
                        <div className="space-y-2 p-2">
                          <div className="h-3 w-2/3 bg-[#121212]/20" />
                          <div className="h-2 w-full bg-[#121212]/10" />
                          <div className="h-2 w-full bg-[#121212]/10" />
                          <div className="h-2 w-4/5 bg-[#121212]/10" />
                        </div>
                      </div>
                    </div>
                  ) : label === "Spine view" ? (
                    <div className="flex aspect-[3/4] items-center justify-center bg-[#121212]">
                      <p className="rotate-180 font-display text-sm tracking-[0.3em] text-[#F7F4EF] [writing-mode:vertical-rl]">
                        SIGNAL 01
                      </p>
                    </div>
                  ) : label === "Back cover" ? (
                    <div className="flex aspect-[3/4] flex-col justify-between bg-[#F7F4EF] p-4">
                      <p className="font-display text-lg font-bold tracking-[0.12em]">SIGNAL</p>
                      <p className="text-sm text-[#2A2926]">
                        Create after thinking. Subscribe at signal.example
                      </p>
                      <BarcodePlaceholder className="w-28" />
                    </div>
                  ) : (
                    <div className="flex aspect-[3/4] flex-col justify-end bg-gradient-to-br from-[#8A847A]/30 to-[#121212]/20 p-4">
                      <MetaLabel>Print mockup</MetaLabel>
                      <p className="mt-2 font-display text-lg font-semibold">{label}</p>
                    </div>
                  )}
                </PaperFrame>
              </button>
            ))}
          </div>
        </section>

        <section id="digital" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="15 · Digital edition"
            title="Hierarchy that reflows—not a shrunk print PDF"
          />
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                ["print", "Print reference"],
                ["digital", "Digital article"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPrintVsDigital(id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E85D04]",
                  printVsDigital === id
                    ? "border-[#E85D04] bg-[#E85D04]/15"
                    : "border-white/10 text-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <PaperFrame className="p-4">
              <MetaLabel>
                {printVsDigital === "print" ? "Fixed print spread" : "Tablet / web feature"}
              </MetaLabel>
              {printVsDigital === "print" ? (
                <div className="mt-3">
                  <SpreadCanvas spreadId="intro" showGrid={showGrid} />
                </div>
              ) : (
                <div className="mt-3 rounded-xl bg-white p-5 text-[#121212]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#E85D04]">
                    Signal · Feature
                  </p>
                  <h3 className="mt-3 font-display text-3xl font-semibold leading-tight">
                    The New Creative Machine
                  </h3>
                  <p className="mt-2 text-sm text-[#8A847A]">
                    By {FEATURE_COPY.author} · 12 min read
                  </p>
                  <p
                    className="mt-5 text-base leading-relaxed"
                    style={{ fontFamily: "var(--font-signal-serif), Georgia, serif" }}
                  >
                    {FEATURE_COPY.body[0]}
                  </p>
                  <p
                    className="mt-4 text-base leading-relaxed"
                    style={{ fontFamily: "var(--font-signal-serif), Georgia, serif" }}
                  >
                    {FEATURE_COPY.body[1]}
                  </p>
                </div>
              )}
            </PaperFrame>
            <div className="space-y-4">
              <PaperFrame className="mx-auto w-full max-w-xs p-3">
                <MetaLabel>Mobile article</MetaLabel>
                <div className="mt-3 rounded-2xl border border-[#121212]/10 bg-white p-4 text-[#121212]">
                  <p className="font-display text-xl font-semibold leading-tight">
                    The New Creative Machine
                  </p>
                  <p
                    className="mt-3 text-sm leading-relaxed"
                    style={{ fontFamily: "var(--font-signal-serif), Georgia, serif" }}
                  >
                    {FEATURE_COPY.body[2]}
                  </p>
                </div>
              </PaperFrame>
              <PaperFrame className="p-5">
                <h3 className="font-display text-lg font-semibold">What changes digitally</h3>
                <ul className="mt-3 space-y-2 text-sm text-[#2A2926]">
                  <li>Columns collapse to a single readable measure.</li>
                  <li>Side notes become expandable callouts under paragraphs.</li>
                  <li>Folios become progress and section labels.</li>
                  <li>Images stack full-width with captions beneath—not beside.</li>
                </ul>
              </PaperFrame>
            </div>
          </div>
        </section>

        <section id="production" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="16 · Production details"
            title="Believable specs for press readiness"
            description="Specifications may vary by printer. These sample settings support a standard US letter editorial format."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {SIGNAL_PRODUCTION.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
              >
                <MetaLabel>{item.label}</MetaLabel>
                <p className="mt-2 text-sm text-secondary">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="process" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="17 · Process"
            title="From brief to masters"
          />
          <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {SIGNAL_PROCESS.map((item, index) => (
              <li key={item.title}>
                <PaperFrame className="h-full border-dashed p-5">
                  <MetaLabel>
                    {String(index + 1).padStart(2, "0")} · Process stage
                  </MetaLabel>
                  <p className="mt-4 font-display text-lg font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm text-[#2A2926]">
                    {item.title === "Thumbnail sketches"
                      ? "Pencil studies established hierarchy, pacing, and image rhythm."
                      : item.note}
                  </p>
                </PaperFrame>
              </li>
            ))}
          </ol>
        </section>

        <section id="reflection" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="18 · Final reflection"
            title="What editorial hierarchy taught me"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <PaperFrame className="p-6">
              <h3 className="font-display text-xl font-semibold">Hierarchy</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#2A2926]">
                I learned that hierarchy is not decoration—it is navigation for attention.
                When every element shouts, readers stop trusting the page.
              </p>
            </PaperFrame>
            <PaperFrame className="p-6">
              <h3 className="font-display text-xl font-semibold">Consistency and variation</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#2A2926]">
                Departments stay recognizable through recurring structures, while features
                earn more dramatic scale and image sequencing.
              </p>
            </PaperFrame>
            <PaperFrame className="p-6">
              <h3 className="font-display text-xl font-semibold">Why the grid mattered</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#2A2926]">
                The 12-column master let me change rhythm without inventing a new system
                every spread. Variation felt intentional instead of accidental.
              </p>
            </PaperFrame>
            <PaperFrame ink className="p-6">
              <h3 className="font-display text-xl font-semibold">Hardest challenge / next</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#C8C2B8]">
                Dense editorial with side notes was hardest—protecting measure while
                keeping the page alive. Before professional printing I would refine
                ink limits, commission real photography, and soft-proof the orange accent
                under CMYK conversion.
              </p>
            </PaperFrame>
          </div>
        </section>

        <CaseStudyFooterNav
          prev={{ href: "/projects/nightshift", label: "NightShift" }}
          next={{ href: "/projects/voltline", label: "Voltline" }}
          seriesLabel="Design series 3 / 3"
          accent={SIGNAL_ACCENT}
        />
      </div>

      <AnimatePresence>
        {fullscreen ? (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col bg-black/90 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Feature spread full screen"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#E85D04]">
                {activeSpread.title} · {activeSpread.folio}
              </p>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="rounded-full border border-white/15 p-2 text-[#F7F4EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E85D04]"
                aria-label="Close full screen"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center">
              <SpreadCanvas spreadId={activeSpread.id} showGrid={showGrid} />
              <div className="mt-4 flex justify-center gap-2">
                <Button type="button" variant="outline" onClick={() => goSpread(-1)}>
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button type="button" variant="outline" onClick={() => goSpread(1)}>
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <CaseStudyLightbox
        open={Boolean(lightbox)}
        title={lightbox ?? "Print preview"}
        onClose={() => setLightbox(null)}
        accent={SIGNAL_ACCENT}
      >
        {lightbox ? <LightboxPreview title={lightbox} /> : null}
      </CaseStudyLightbox>
    </article>
  );
}
