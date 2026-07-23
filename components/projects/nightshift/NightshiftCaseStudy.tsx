"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Copy,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/shared/Reveal";
import { cn } from "@/lib/utils";
import {
  NIGHTSHIFT,
  NIGHTSHIFT_COLORS,
  NIGHTSHIFT_PHASES,
  NIGHTSHIFT_POSTERS,
  NIGHTSHIFT_ROLLOUT,
  NIGHTSHIFT_SECTIONS,
  NIGHTSHIFT_SOCIAL,
} from "@/lib/nightshift/content";
import {
  MonoLabel,
  NightFrame,
  QRPlaceholder,
} from "@/components/projects/nightshift/NightshiftPrimitives";
import {
  CaseStudyDesktopNav,
  CaseStudyFooterNav,
  CaseStudyLightbox,
  CaseStudyMobileToc,
  CaseStudyProgress,
  CaseStudyScrollCue,
  useActiveSection,
} from "@/components/projects/shared/CaseStudyChrome";

const ACCENT = "#34E8FF";

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
      <MonoLabel>{eyebrow}</MonoLabel>
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

function Wordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/projects/nightshift/wordmark.svg"
      alt="NightShift wordmark"
      width={480}
      height={96}
      className={cn("h-8 w-auto", className)}
      unoptimized
    />
  );
}

function PosterArt({
  poster,
  grayscale = false,
  compact = false,
}: {
  poster: (typeof NIGHTSHIFT_POSTERS)[number];
  grayscale?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#07070C] p-5",
        grayscale && "grayscale",
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${poster.accent}55, transparent 45%), linear-gradient(160deg, #14182B, #07070C 70%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(237,237,242,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(237,237,242,.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative flex items-center justify-between">
        <span
          className="rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ backgroundColor: `${poster.accent}22`, color: poster.accent }}
        >
          {poster.label}
        </span>
        <MonoLabel>2026</MonoLabel>
      </div>
      <div className="relative mt-auto space-y-3 pt-10">
        <Wordmark className={cn("w-full", compact ? "h-9" : "h-12 sm:h-16")} />
        <p className="max-w-[16ch] text-sm text-[#C8CDDA]">{poster.copy}</p>
        <div className="flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9AA0B5]">
              {NIGHTSHIFT.dates}
            </p>
            <p className="mt-1 text-xs text-[#EDEDF2]">{NIGHTSHIFT.location}</p>
          </div>
          <span className="h-1 w-10 rounded-full" style={{ backgroundColor: poster.accent }} />
        </div>
        {!compact ? (
          <p className="pt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6F758A]">
            {NIGHTSHIFT.website} · sponsors
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function NightshiftCaseStudy() {
  const reducedMotion = useReducedMotion();
  const activeSection = useActiveSection(NIGHTSHIFT_SECTIONS);
  const [posterId, setPosterId] = useState<(typeof NIGHTSHIFT_POSTERS)[number]["id"]>("main");
  const [phase, setPhase] = useState<(typeof NIGHTSHIFT_PHASES)[number]>("Announcement");
  const [copied, setCopied] = useState<string | null>(null);
  const [treatment, setTreatment] = useState(72);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [motionPlaying, setMotionPlaying] = useState(false);
  const [motionKey, setMotionKey] = useState(0);

  const activePoster =
    NIGHTSHIFT_POSTERS.find((poster) => poster.id === posterId) ?? NIGHTSHIFT_POSTERS[0];

  const socialItems = useMemo(
    () => NIGHTSHIFT_SOCIAL.filter((item) => item.phase === phase),
    [phase],
  );

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
    <article className="relative pb-24">
      <CaseStudyProgress accent={ACCENT} />
      <CaseStudyDesktopNav
        sections={NIGHTSHIFT_SECTIONS}
        activeSection={activeSection}
        accent={ACCENT}
      />

      <section className="relative overflow-hidden border-b border-white/8 bg-[#07070C]">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 75% 20%, rgba(107,77,255,.28), transparent 40%), radial-gradient(circle at 20% 80%, rgba(52,232,255,.12), transparent 35%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text"
            >
              <ArrowLeft className="size-4" />
              Back to Projects
            </Link>
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-[#34E8FF]">
              {NIGHTSHIFT.category} · {NIGHTSHIFT.year}
            </p>
            <h1 className="mt-4 font-display text-5xl font-extrabold tracking-tight text-text sm:text-6xl lg:text-7xl">
              NIGHTSHIFT
            </h1>
            <p className="mt-4 font-display text-2xl text-[#34E8FF]">
              {NIGHTSHIFT.tagline}
            </p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              An integrated campaign for a nighttime festival combining digital
              art, electronic music, creative technology, and immersive media—
              one concept adapted across posters, social, environment, merch, and motion.
            </p>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  Dates / Location
                </dt>
                <dd className="mt-1 text-sm text-secondary">
                  {NIGHTSHIFT.dates}
                  <br />
                  {NIGHTSHIFT.location}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  Role / Tools
                </dt>
                <dd className="mt-1 text-sm text-secondary">
                  {NIGHTSHIFT.role}
                  <br />
                  {NIGHTSHIFT.tools.join(" · ")}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Art Direction",
                "Campaign Design",
                "Typography",
                "Advertising",
                "Motion Design",
              ].map((skill) => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>
          </div>
          <Reveal>
            <motion.div
              className="aspect-[3/4] sm:aspect-[4/5]"
              initial={reducedMotion ? false : { opacity: 0.7, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <PosterArt poster={NIGHTSHIFT_POSTERS[0]} />
            </motion.div>
          </Reveal>
        </div>
        <div className="flex justify-center pb-8">
          <CaseStudyScrollCue href="#overview" reducedMotion={reducedMotion} />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-28 px-4 py-16 sm:px-6 lg:px-8">
        <CaseStudyMobileToc
          sections={NIGHTSHIFT_SECTIONS}
          activeSection={activeSection}
          accent={ACCENT}
        />
        <section id="overview" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="01 · Project overview"
            title="One campaign system for an entire after-dark festival"
            description="NightShift needed immediate attention without collapsing into nightclub-flyer tropes. The work proves that a single nocturnal concept can stay recognizable across print, digital, environment, credentials, merchandise, and motion."
          />
          <NightFrame>
            <p className="max-w-3xl font-display text-xl leading-relaxed text-text sm:text-2xl">
              {NIGHTSHIFT.statement}
            </p>
          </NightFrame>
        </section>

        <section id="challenge" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="02 · Campaign challenge"
            title="Be mysterious and energetic—without becoming unreadable"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <NightFrame>
              <h3 className="font-display text-xl font-semibold">Constraints</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                <li>Create night-energy without generic club aesthetics.</li>
                <li>Keep dates and venue readable at poster distance.</li>
                <li>Adapt for artists and activities without redesigning from scratch.</li>
                <li>Serve designers, developers, and musicians with one visual language.</li>
              </ul>
            </NightFrame>
            <NightFrame accent="#6B4DFF">
              <h3 className="font-display text-xl font-semibold">Opportunity</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Cropped letterforms, layered grids, and luminous directional lines
                can feel experimental while still protecting hierarchy. The system
                treats darkness as negative space—not as a place to dump effects.
              </p>
            </NightFrame>
          </div>
        </section>

        <section id="audience" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading eyebrow="03 · Audience" title="Creative and technical crowds in one district" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {NIGHTSHIFT.audience.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-secondary"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section id="strategy" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="04 · Creative strategy"
            title="Night as a second creative layer"
            description="The festival transforms the city after dark, revealing activity that is usually invisible during the day."
          />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {NIGHTSHIFT.concepts.map((concept) => (
              <NightFrame key={concept} className="min-h-28">
                <p className="font-display text-lg font-semibold">{concept}</p>
              </NightFrame>
            ))}
          </div>
        </section>

        <section id="system" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="05 · Campaign identity"
            title="A flexible nocturnal system"
            description="Wordmark, date-location lockup, frames, type hierarchy, and category labels stay stable while artist imagery and accents change."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <NightFrame className="space-y-6">
              <Wordmark className="h-10" />
              <div>
                <MonoLabel>Date + location lockup</MonoLabel>
                <p className="mt-2 font-mono text-sm uppercase tracking-[0.14em] text-[#EDEDF2]">
                  {NIGHTSHIFT.dates}
                </p>
                <p className="mt-1 text-sm text-[#9AA0B5]">{NIGHTSHIFT.location}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Festival", "Installations", "Live", "Learn"].map((label, index) => (
                  <span
                    key={label}
                    className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
                    style={{
                      color: ["#34E8FF", "#6B4DFF", "#34E8FF", "#F5D547"][index],
                      backgroundColor: `${["#34E8FF", "#6B4DFF", "#34E8FF", "#F5D547"][index]}22`,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </NightFrame>
            <NightFrame className="space-y-5">
              <div>
                <p className="font-display text-5xl font-extrabold tracking-tight">NIGHT</p>
                <p className="font-display text-5xl font-extrabold tracking-tight text-[#34E8FF]">
                  SHIFT
                </p>
              </div>
              <p className="text-sm leading-relaxed text-muted">
                Display type carries impact through scale and crop. Source Sans
                handles body clarity. JetBrains Mono protects schedules, badges,
                and technical labels.
              </p>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#9AA0B5]">
                Gate B · 21:40 · Workshop 04
              </p>
            </NightFrame>
          </div>
          <div className="mb-3 mt-8 flex items-center gap-3">
            <MonoLabel>Accent palette</MonoLabel>
            <span className="h-px flex-1 bg-gradient-to-r from-[#34E8FF]/60 to-transparent" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {NIGHTSHIFT_COLORS.map((color) => (
              <button
                key={color.hex}
                type="button"
                onClick={() => void copyHex(color.hex)}
                className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] text-left transition hover:border-[#34E8FF]/35"
                aria-label={`Copy ${color.name} hex ${color.hex}`}
              >
                <div className="h-24" style={{ backgroundColor: color.hex }} />
                <div className="space-y-1 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-lg font-semibold">{color.name}</p>
                    {copied === color.hex ? (
                      <Check className="size-4 text-[#34E8FF]" />
                    ) : (
                      <Copy className="size-4 text-muted" />
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted">{color.hex}</p>
                  <p className="font-mono text-xs text-muted">RGB {color.rgb}</p>
                  <p className="pt-1 text-sm text-secondary">{color.use}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section id="poster" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="06 · Main poster"
            title="Distance-readable hierarchy with nocturnal atmosphere"
          />
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="aspect-[3/4]">
              <PosterArt poster={NIGHTSHIFT_POSTERS[0]} />
            </div>
            <div className="grid gap-4">
              <NightFrame>
                <MonoLabel>Close-up detail</MonoLabel>
                <p className="mt-4 font-display text-4xl font-extrabold leading-none">
                  CREATE
                  <br />
                  AFTER
                  <br />
                  <span className="text-[#34E8FF]">DARK.</span>
                </p>
              </NightFrame>
              <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-white/10">
                <PosterArt poster={NIGHTSHIFT_POSTERS[0]} grayscale />
              </div>
              <figure className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B12]">
                <Image
                  src="/projects/nightshift/mockups/street-poster.svg"
                  alt="NightShift festival poster displayed in a street-side setting"
                  width={960}
                  height={640}
                  className="h-auto w-full"
                  unoptimized
                />
              </figure>
            </div>
          </div>
        </section>

        <section id="series" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="07 · Poster series"
            title="Related variations, not identical crops"
          />
          <div className="mb-5 flex flex-wrap gap-2">
            {NIGHTSHIFT_POSTERS.map((poster) => (
              <button
                key={poster.id}
                type="button"
                onClick={() => setPosterId(poster.id)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm transition",
                  posterId === poster.id
                    ? "border-[#34E8FF]/40 bg-[#34E8FF]/10 text-text"
                    : "border-white/10 text-muted hover:text-text",
                )}
              >
                {poster.title}
              </button>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="aspect-[3/4]">
              <PosterArt poster={activePoster} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {NIGHTSHIFT_POSTERS.map((poster) => (
                <button
                  key={poster.id}
                  type="button"
                  onClick={() => setPosterId(poster.id)}
                  className={cn(
                    "aspect-[3/4] overflow-hidden rounded-xl border transition",
                    posterId === poster.id
                      ? "border-[#34E8FF]/50"
                      : "border-white/10 opacity-80 hover:opacity-100",
                  )}
                  aria-label={`Select ${poster.title}`}
                >
                  <PosterArt poster={poster} compact />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="digital" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="08 · Digital advertising"
            title="Reformatting by space, not by crop"
          />
          <div className="space-y-4">
            <NightFrame className="relative h-32 overflow-hidden p-0">
              <div className="absolute inset-0 bg-[linear-gradient(100deg,#07070C_0%,#14182B_55%,#34E8FF22_100%)]" />
              <div className="absolute -bottom-8 left-1/3 font-display text-8xl font-black text-white/[0.04]">SHIFT</div>
              <div className="relative flex h-full items-center justify-between gap-4 px-5">
                <Wordmark className="h-5 sm:h-7" />
                <p className="hidden text-sm text-[#34E8FF] sm:block">{NIGHTSHIFT.tagline}</p>
                <p className="font-mono text-[10px] text-muted sm:text-xs">{NIGHTSHIFT.dates}</p>
              </div>
            </NightFrame>
            <div className="grid gap-4 md:grid-cols-3">
              <NightFrame className="relative aspect-square overflow-hidden" accent="#6B4DFF">
                <MonoLabel>Square ad</MonoLabel>
                <p className="absolute -bottom-5 -left-3 font-display text-[7rem] font-black leading-[.65] text-[#6B4DFF]/20">
                  N<br />S
                </p>
                <p className="relative mt-8 font-display text-3xl font-extrabold leading-none">
                  CREATE
                  <br />
                  AFTER
                  <br />
                  DARK.
                </p>
              </NightFrame>
              <NightFrame className="relative aspect-[9/16] overflow-hidden" accent="#34E8FF">
                <MonoLabel>Vertical mobile</MonoLabel>
                <div className="mt-10 space-y-1 font-display text-5xl font-black leading-none">
                  <p>NIGHT</p><p className="text-[#34E8FF]">CREATES</p><p>LIGHT</p>
                </div>
                <div className="absolute inset-x-5 bottom-5 border-t border-[#34E8FF]/40 pt-3 text-xs text-muted">
                  {NIGHTSHIFT.location}
                </div>
              </NightFrame>
              <NightFrame className="relative min-h-56 overflow-hidden" accent="#F5D547">
                <MonoLabel>Email header / venue screen</MonoLabel>
                <div className="absolute inset-x-0 top-14 h-px bg-[#F5D547]/60" />
                <p className="mt-12 max-w-[12ch] font-display text-3xl font-semibold">
                  Full schedule now live
                </p>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-[#F5D547]">
                  04 stages · 28 sessions · 02 nights
                </p>
              </NightFrame>
            </div>
          </div>
        </section>

        <section id="social" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="09 · Social media system"
            title="Phase-aware templates for the full campaign arc"
          />
          <div className="mb-5 flex flex-wrap gap-2">
            {NIGHTSHIFT_PHASES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPhase(item)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm transition",
                  phase === item
                    ? "border-[#34E8FF]/40 bg-[#34E8FF]/10 text-text"
                    : "border-white/10 text-muted hover:text-text",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {socialItems.length ? socialItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B12]"
              >
                <div className={cn("relative p-5", item.ratio)}>
                  <MonoLabel>{item.title}</MonoLabel>
                  <p className="mt-8 font-display text-2xl font-extrabold leading-tight">
                    {phase === "Recap"
                      ? "What happened after dark"
                      : phase === "Live Event"
                        ? "Now on Stage B"
                        : NIGHTSHIFT.tagline}
                  </p>
                  <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                    <Wordmark className="h-4 opacity-90" />
                    <span className="h-1 w-8 rounded-full bg-[#34E8FF]" />
                  </div>
                </div>
              </article>
            )) : (
              <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-muted">
                No campaign assets are scheduled for this phase yet.
              </div>
            )}
          </div>
        </section>

        <section id="tickets" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="10 · Tickets and credentials"
            title="Access levels inside one visual system"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["General admission", "#34E8FF"],
              ["VIP", "#F5D547"],
              ["Digital wallet", "#6B4DFF"],
              ["Staff badge", "#9AA0B5"],
              ["Artist badge", "#34E8FF"],
              ["Media badge", "#6B4DFF"],
            ].map(([label, accent]) => (
              <NightFrame key={label} accent={accent}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <MonoLabel>{label}</MonoLabel>
                    <p className="mt-3 font-display text-xl font-semibold">NightShift</p>
                    <p className="mt-1 text-xs text-muted">{NIGHTSHIFT.dates}</p>
                  </div>
                  <QRPlaceholder className="size-14" />
                </div>
                <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9AA0B5]">
                  Non-functional QR mark
                </p>
              </NightFrame>
            ))}
            <NightFrame className="md:col-span-2 xl:col-span-3">
              <MonoLabel>Wristband</MonoLabel>
              <div className="mt-4 h-12 rounded-full border border-white/10 bg-gradient-to-r from-[#14182B] via-[#6B4DFF55] to-[#34E8FF55] p-2">
                <div className="flex h-full items-center justify-between rounded-full bg-[#07070C] px-4">
                  <span className="font-display text-sm font-semibold tracking-wide">
                    NIGHTSHIFT
                  </span>
                  <span className="font-mono text-[10px] text-[#34E8FF]">GA · 2026</span>
                </div>
              </div>
            </NightFrame>
          </div>
        </section>

        <section id="environment" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="11 · Environmental graphics"
            title="Scale without losing essential information"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Bus-stop advertisement", "aspect-[4/5]", "radial-gradient(circle at 70% 25%,#6B4DFF88,transparent 38%),linear-gradient(145deg,#14182B,#07070C)"],
              ["Large billboard", "aspect-[21/9]", "linear-gradient(110deg,#34E8FF22 1px,transparent 1px),linear-gradient(#14182B,#07070C)"],
              ["Venue entrance banner", "aspect-[2/3]", "radial-gradient(ellipse at bottom,#34E8FF55,transparent 55%),linear-gradient(#07070C,#14182B)"],
              ["Directional signage", "aspect-[16/9]", "linear-gradient(135deg,#6B4DFF55 25%,transparent 25%),linear-gradient(#14182B,#07070C)"],
              ["Stage backdrop", "aspect-[16/9]", "repeating-radial-gradient(circle at center,#34E8FF22 0 2px,transparent 3px 22px),#07070C"],
              ["Schedule board", "aspect-[4/3]", "linear-gradient(rgba(52,232,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(52,232,255,.12) 1px,transparent 1px),#0B0B12"],
            ].map(([title, ratio, background], index) => (
              <motion.button
                key={title}
                type="button"
                onClick={() => setLightbox(title)}
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.04 }}
                className="text-left"
              >
                <div
                  className={cn(
                    "overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B12] p-5 transition hover:-translate-y-1 hover:border-[#34E8FF]/35",
                    ratio,
                  )}
                  style={{ background, backgroundSize: title === "Schedule board" ? "28px 28px" : undefined }}
                >
                  <MonoLabel>{title}</MonoLabel>
                  <Wordmark className="mt-8 h-6 max-w-[70%]" />
                  <p className="mt-3 max-w-[18ch] text-sm text-muted">{NIGHTSHIFT.location}</p>
                  <span className="absolute bottom-5 right-5 h-1 w-12 bg-[#34E8FF]" />
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        <section id="merch" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="12 · Merchandise"
            title="Simplified graphics derived from the system"
            description="Merchandise avoids dumping the full poster onto every surface. Marks, cropped type, and accent lines become the wearable language."
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <NightFrame className="min-h-56"><MonoLabel>T-shirt</MonoLabel><div className="mx-auto mt-5 grid h-32 w-36 place-items-center bg-[#14182B] [clip-path:polygon(20%_0,38%_10%,62%_10%,80%_0,100%_24%,84%_38%,76%_28%,82%_100%,18%_100%,24%_28%,16%_38%,0_24%)]"><Wordmark className="h-3 w-20" /></div></NightFrame>
            <NightFrame className="min-h-56" accent="#6B4DFF"><MonoLabel>Tote bag</MonoLabel><div className="relative mx-auto mt-12 grid h-28 w-32 place-items-center border border-[#6B4DFF]/50 bg-[#14182B] before:absolute before:-top-8 before:h-12 before:w-16 before:rounded-t-full before:border-4 before:border-b-0 before:border-[#6B4DFF]/50"><span className="font-display text-3xl font-black text-[#6B4DFF]">NS</span></div></NightFrame>
            <NightFrame className="min-h-56"><MonoLabel>Sticker sheet</MonoLabel><div className="mt-7 grid grid-cols-3 gap-3 rounded-xl bg-white/5 p-4">{["NS","17","→","SHIFT","●","LIVE"].map((mark) => <span key={mark} className="grid aspect-square place-items-center rounded-lg border border-[#34E8FF]/30 bg-[#07070C] font-mono text-xs text-[#34E8FF]">{mark}</span>)}</div></NightFrame>
            <NightFrame className="min-h-56" accent="#F5D547"><MonoLabel>Wristband</MonoLabel><div className="mt-16 flex h-12 rotate-[-4deg] items-center justify-between rounded-full border border-[#F5D547]/50 bg-[#14182B] px-5"><Wordmark className="h-3 w-24" /><span className="font-mono text-[9px] text-[#F5D547]">GA / 2026</span></div></NightFrame>
            <NightFrame className="min-h-56" accent="#6B4DFF"><MonoLabel>Hoodie</MonoLabel><div className="relative mx-auto mt-5 grid h-32 w-36 place-items-center rounded-t-[45%] bg-[#0E1020] [clip-path:polygon(24%_12%,38%_0,62%_0,76%_12%,100%_30%,86%_44%,78%_34%,82%_100%,18%_100%,22%_34%,14%_44%,0_30%)]"><span className="mt-8 font-display text-xl font-black text-[#6B4DFF]">SHIFT</span></div></NightFrame>
            <NightFrame className="min-h-56"><MonoLabel>Limited poster</MonoLabel><div className="mx-auto mt-5 aspect-[3/4] w-24 rotate-3 border border-white/15 bg-gradient-to-br from-[#6B4DFF66] via-[#07070C] to-[#34E8FF33] p-3"><Wordmark className="mt-14 h-2 w-full" /></div></NightFrame>
          </div>
        </section>

        <section id="motion" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="13 · Motion campaign"
            title="A deliberate 6–10 second poster reveal"
            description="Animation plays only when you ask it to. Reduced-motion users get a static final frame."
          />
          <NightFrame className="overflow-hidden p-0">
            <div className="relative aspect-[16/10] bg-[#05050A]">
              {reducedMotion || !motionPlaying ? (
                <div className="absolute inset-0 p-6 sm:p-10">
                  <PosterArt poster={NIGHTSHIFT_POSTERS[0]} />
                </div>
              ) : (
                <MotionPoster key={motionKey} onComplete={() => setMotionPlaying(false)} />
              )}
            </div>
            <div className="flex flex-wrap gap-3 border-t border-white/8 p-4">
              <button
                type="button"
                onClick={() => {
                  setMotionPlaying(true);
                  setMotionKey((value) => value + 1);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#EDEDF2] px-4 py-2 text-sm font-semibold text-black"
              >
                <Play className="size-4" />
                Play
              </button>
              <button
                type="button"
                onClick={() => setMotionPlaying(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-muted hover:text-text"
              >
                <Pause className="size-4" />
                Pause
              </button>
              <button
                type="button"
                onClick={() => {
                  setMotionPlaying(true);
                  setMotionKey((value) => value + 1);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-muted hover:text-text"
              >
                <RotateCcw className="size-4" />
                Replay
              </button>
            </div>
            <figure className="grid gap-3 border-t border-white/8 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Image
                src="/projects/nightshift/motion/poster-still.svg"
                alt="NightShift motion poster keyframe still"
                width={1200}
                height={675}
                className="w-full rounded-xl border border-white/10"
                unoptimized
              />
              <figcaption className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#34E8FF]">
                Keyframe still
              </figcaption>
            </figure>
          </NightFrame>
        </section>

        <section id="rollout" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="14 · Campaign rollout"
            title="Messaging tightens as the weekend approaches"
          />
          <ol className="space-y-3">
            {NIGHTSHIFT_ROLLOUT.map((item, index) => (
              <li
                key={item.week}
                className="grid gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-4 md:grid-cols-[140px_1fr]"
              >
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#34E8FF]">
                  {String(index + 1).padStart(2, "0")} · {item.week}
                </span>
                <div>
                  <p className="font-display text-lg font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">{item.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="process" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="15 · Process"
            title="From brief to nocturnal system"
            description="Moodboards, type experiments, and rejected directions show how the system moved from atmosphere to a repeatable campaign language."
          />
          <div className="mb-6">
            <MonoLabel>Image treatment exploration</MonoLabel>
            <input
              type="range"
              min={0}
              max={100}
              value={treatment}
              onChange={(event) => setTreatment(Number(event.target.value))}
              className="mt-4 w-full accent-[#34E8FF]"
              aria-label="Before and after image treatment"
            />
            <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10">
              <Image
                src="/projects/nightshift/images/treatment-before.svg"
                alt="Untreated NightShift campaign image"
                width={1400}
                height={600}
                className="aspect-[21/9] w-full object-cover"
                unoptimized
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - treatment}% 0 0)` }}
              >
                <Image
                  src="/projects/nightshift/images/treatment-after.svg"
                  alt="NightShift image with campaign color treatment"
                  width={1400}
                  height={600}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute inset-y-0 w-px bg-white shadow-[0_0_12px_#34E8FF]" style={{ left: `${treatment}%` }} />
              <div className="absolute inset-0 flex items-end justify-between p-4">
                <span className="rounded bg-black/50 px-2 py-1 font-mono text-[10px] uppercase tracking-wider">
                  Untreated
                </span>
                <span className="rounded bg-black/50 px-2 py-1 font-mono text-[10px] uppercase tracking-wider">
                  Campaign grade
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Moodboard", "Nocturnal references and luminous urban textures"],
              ["Typography tests", "Cropped display vs readable lockups"],
              ["Rejected direction", "Too close to generic club-flyer neon"],
            ].map(([title, note]) => (
              <NightFrame key={title} className="border-dashed">
                <MonoLabel>Process study</MonoLabel>
                <p className="mt-4 font-display text-lg font-semibold">{title}</p>
                <p className="mt-2 text-sm text-muted">{note}</p>
              </NightFrame>
            ))}
          </div>
        </section>

        <section id="reflection" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading eyebrow="16 · Results and reflection" title="What this campaign taught me" />
          <div className="grid gap-4 lg:grid-cols-2">
            <NightFrame>
              <h3 className="font-display text-xl font-semibold">Consistency across formats</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                I kept the grid, date lockup, and accent logic stable, then varied
                crop, category color, and information density. That let every
                adaptation feel related without becoming a lazy crop of the hero poster.
              </p>
            </NightFrame>
            <NightFrame accent="#6B4DFF">
              <h3 className="font-display text-xl font-semibold">Experimentation vs readability</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Oversized type and layered grids create energy, but dates, venue,
                and access information always needed a protected reading path—
                especially on environmental graphics.
              </p>
            </NightFrame>
            <NightFrame accent="#F5D547">
              <h3 className="font-display text-xl font-semibold">Hardest adaptation</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Leaderboard and email formats. With almost no vertical space, the
                system had to communicate identity through lockup, accent, and
                compressed hierarchy rather than atmospheric composition.
              </p>
            </NightFrame>
            <NightFrame>
              <h3 className="font-display text-xl font-semibold">Future improvement</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                I would replace composed mockups with photographed environments,
                finalize After Effects exports for the motion poster, and build a
                stricter component library for social production speed.
              </p>
            </NightFrame>
          </div>
        </section>

        <CaseStudyFooterNav
          prev={{ href: "/projects/voltline", label: "Voltline" }}
          next={{ href: "/projects/signal-magazine", label: "Signal Magazine" }}
          seriesLabel="Design series 2 / 3"
          accent={ACCENT}
        />
      </div>

      <CaseStudyLightbox
        open={Boolean(lightbox)}
        title={lightbox ?? "Environmental application"}
        onClose={() => setLightbox(null)}
        accent={ACCENT}
      >
        <div className="aspect-[16/9] rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_70%_25%,#6B4DFF66,transparent_40%),linear-gradient(145deg,#14182B,#07070C)] p-8">
          <MonoLabel>Environmental application</MonoLabel>
          <Wordmark className="mt-10 h-10 max-w-[75%]" />
          <p className="mt-3 text-muted">{NIGHTSHIFT.tagline}</p>
        </div>
      </CaseStudyLightbox>
    </article>
  );
}

function MotionPoster({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 8200);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-[#05050A]"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1.2 }}
      />
      <motion.div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(237,237,242,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(237,237,242,.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ delay: 0.6, duration: 1 }}
      />
      <motion.p
        className="absolute left-8 top-16 font-display text-6xl font-extrabold text-[#EDEDF2] sm:text-8xl"
        initial={{ x: -40, opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ x: 0, opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ delay: 1.2, duration: 1.1 }}
      >
        NIGHT
      </motion.p>
      <motion.p
        className="absolute left-8 top-36 font-display text-6xl font-extrabold text-[#34E8FF] sm:top-44 sm:text-8xl"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
      >
        SHIFT
      </motion.p>
      <motion.div
        className="absolute inset-x-8 bottom-24 h-40 rounded-2xl bg-gradient-to-r from-[#6B4DFF55] to-[#34E8FF33]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.8, duration: 1 }}
      />
      <motion.div
        className="absolute left-8 right-8 top-1/2 h-px bg-[#34E8FF]"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 4, duration: 1.2 }}
        style={{ transformOrigin: "left" }}
      />
      <motion.div
        className="absolute bottom-10 left-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 5.2, duration: 0.8 }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#EDEDF2]">
          {NIGHTSHIFT.dates} · {NIGHTSHIFT.location}
        </p>
        <p className="mt-2 text-[#34E8FF]">{NIGHTSHIFT.tagline}</p>
      </motion.div>
    </div>
  );
}
