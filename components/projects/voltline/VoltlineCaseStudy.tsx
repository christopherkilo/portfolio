"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, Copy, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/shared/Reveal";
import { cn } from "@/lib/utils";
import {
  VOLTLINE,
  VOLTLINE_COLORS,
  VOLTLINE_CONCEPTS,
  VOLTLINE_DONT,
  VOLTLINE_PRODUCTS,
  VOLTLINE_SECTIONS,
} from "@/lib/voltline/content";
import {
  AccentBar,
  DirectionMarker,
  ModularFrame,
  SignalLines,
  SpecLabel,
} from "@/components/projects/voltline/VoltlinePrimitives";
import {
  CaseStudyDesktopNav,
  CaseStudyFooterNav,
  CaseStudyLightbox,
  CaseStudyMobileToc,
  CaseStudyProgress,
  CaseStudyScrollCue,
  useActiveSection,
} from "@/components/projects/shared/CaseStudyChrome";

const LOGO_VARIANTS = [
  {
    id: "wordmark",
    label: "Primary wordmark",
    src: "/projects/voltline/logo-wordmark.svg",
    className: "h-10 w-auto sm:h-12",
  },
  {
    id: "stacked",
    label: "Stacked lockup",
    src: "/projects/voltline/logo-stacked.svg",
    className: "h-20 w-auto",
  },
  {
    id: "symbol",
    label: "Compact symbol",
    src: "/projects/voltline/logo-symbol.svg",
    className: "h-14 w-14",
  },
] as const;

const APPLICATIONS = [
  { id: "card", title: "Business card", ratio: "aspect-[1.75/1]" },
  { id: "letterhead", title: "Letterhead", ratio: "aspect-[8.5/11]" },
  { id: "badge", title: "Employee ID", ratio: "aspect-[2/3]" },
  { id: "box", title: "Shipping box", ratio: "aspect-square" },
  { id: "manual", title: "Instruction card", ratio: "aspect-[4/3]" },
  { id: "warranty", title: "Warranty card", ratio: "aspect-[3/2]" },
  { id: "web", title: "Website hero", ratio: "aspect-[16/9]" },
  { id: "social", title: "Social profile", ratio: "aspect-square" },
  { id: "wallpaper", title: "Desktop wallpaper", ratio: "aspect-[16/10]" },
  { id: "banner", title: "Trade-show banner", ratio: "aspect-[2/5]" },
] as const;

const SOCIAL = [
  { id: "square", title: "Square ad", ratio: "aspect-square", copy: "Build with quieter power." },
  { id: "story", title: "Story graphic", ratio: "aspect-[9/16]", copy: "Desk tools that stay out of the way." },
  { id: "banner", title: "Wide banner", ratio: "aspect-[21/9]", copy: "Precision accessories for serious work." },
  { id: "launch", title: "Launch announcement", ratio: "aspect-[4/5]", copy: "Axis is ready." },
  { id: "feature", title: "Feature highlight", ratio: "aspect-[4/5]", copy: "Hot-swap. Gasket mount. USB-C." },
  { id: "compare", title: "Comparison graphic", ratio: "aspect-[16/9]", copy: "Axis · Pulse · Core" },
] as const;

const GUIDELINE_PAGES = [
  "Brand introduction",
  "Logo rules",
  "Color",
  "Typography",
  "Layout",
  "Imagery",
  "Packaging",
  "Digital application",
] as const;

const GUIDELINE_CONTENT: Record<(typeof GUIDELINE_PAGES)[number], string> = {
  "Brand introduction":
    "Defines Voltline’s purpose, positioning, and controlled-energy principle so every expression begins from the same strategic idea.",
  "Logo rules":
    "Documents lockup selection, clear space, minimum size, and one-color use across physical and digital production.",
  Color:
    "Sets the graphite-led palette and reserves Electric Lime for interaction, status, and product identification.",
  Typography:
    "Establishes display, body, and mono roles with practical hierarchy examples for packaging and interface copy.",
  Layout:
    "Uses modular frames, disciplined spacing, and directional alignment to create motion without visual noise.",
  Imagery:
    "Pairs precise product crops with low-contrast environments, leaving room for specifications and functional callouts.",
  Packaging:
    "Keeps one family structure across Axis, Pulse, and Core while accent bars make each product immediately identifiable.",
  "Digital application":
    "Translates the system into responsive pages, campaign modules, and accessible active states with consistent hierarchy.",
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
      <SpecLabel>{eyebrow}</SpecLabel>
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

function VoltlineMark({
  variant = "wordmark",
  onLight = false,
  className,
}: {
  variant?: (typeof LOGO_VARIANTS)[number]["id"];
  onLight?: boolean;
  className?: string;
}) {
  const item = LOGO_VARIANTS.find((entry) => entry.id === variant) ?? LOGO_VARIANTS[0];
  return (
    <Image
      src={item.src}
      alt={`Voltline ${item.label}`}
      width={variant === "symbol" ? 64 : variant === "stacked" ? 300 : 560}
      height={variant === "symbol" ? 64 : variant === "stacked" ? 180 : 96}
      className={cn(item.className, onLight && "brightness-0", className)}
      unoptimized
    />
  );
}

export function VoltlineCaseStudy() {
  const reducedMotion = useReducedMotion();
  const [logoVariant, setLogoVariant] = useState<(typeof LOGO_VARIANTS)[number]["id"]>("wordmark");
  const [copied, setCopied] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<(typeof APPLICATIONS)[number] | null>(null);
  const [compare, setCompare] = useState<"before" | "after">("after");
  const [guidelinePage, setGuidelinePage] = useState(0);
  const activeSection = useActiveSection(VOLTLINE_SECTIONS);

  const copyHex = useCallback(async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  }, []);

  return (
    <article className="relative pb-24">
      <CaseStudyProgress accent="#C8FF3D" />
      <CaseStudyDesktopNav
        sections={VOLTLINE_SECTIONS}
        activeSection={activeSection}
        accent="#C8FF3D"
      />

      <section className="relative overflow-hidden border-b border-white/8 bg-[#070707]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF3D]"
            >
              <ArrowLeft className="size-4" />
              Back to Projects
            </Link>
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-[#C8FF3D]">
              {VOLTLINE.category} · {VOLTLINE.year}
            </p>
            <h1 className="mt-4 font-display text-5xl font-semibold tracking-[0.08em] text-text sm:text-6xl lg:text-7xl">
              VOLTLINE
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              A complete brand identity for a premium technology-accessories
              company—built around precision geometry, controlled energy, and
              systems that stay consistent from packaging to product launch ads.
            </p>
            <p className="mt-4 max-w-xl font-display text-xl text-text">
              {VOLTLINE.statement}
            </p>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  Role
                </dt>
                <dd className="mt-1 text-sm text-secondary">{VOLTLINE.role}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  Tools
                </dt>
                <dd className="mt-1 text-sm text-secondary">
                  {VOLTLINE.tools.join(" · ")}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Brand Strategy", "Logo Design", "Typography", "Packaging", "Visual Systems"].map(
                (skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ),
              )}
            </div>
          </div>

          <Reveal>
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
              <Image
                src="/projects/voltline/cover.svg"
                alt="Voltline identity system cover presentation"
                width={1200}
                height={750}
                priority
                unoptimized
                className="h-auto w-full"
              />
            </div>
          </Reveal>
        </div>
        <div className="flex justify-center pb-8">
          <CaseStudyScrollCue href="#overview" reducedMotion={reducedMotion} />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-28 px-4 py-16 sm:px-6 lg:px-8">
        <CaseStudyMobileToc
          sections={VOLTLINE_SECTIONS}
          activeSection={activeSection}
          accent="#C8FF3D"
        />
        <section id="overview" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="01 · Project overview"
            title="A premium accessories brand that earns trust through clarity"
            description="Voltline needed an identity that felt fast and technical without borrowing the visual language of arcade-ready gaming brands. The system had to scale from a tiny product icon to trade-show architecture while remaining readable, modular, and calm."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Positioning", VOLTLINE.statement],
              ["Category", "Creator and professional technology accessories"],
              ["Deliverable", "Logo system, color, type, packaging family, and campaign kit"],
            ].map(([label, value]) => (
              <ModularFrame key={label}>
                <SpecLabel>{label}</SpecLabel>
                <p className="mt-4 text-sm leading-relaxed text-secondary">{value}</p>
              </ModularFrame>
            ))}
          </div>
        </section>

        <section id="challenge" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="02 · The challenge"
            title="Communicate performance without becoming a gaming cliché"
            description="Most accessories brands either disappear into generic tech gray or overcorrect into neon spectacle. The brief was to design a system that feels energetic to enthusiasts while remaining credible for developers, designers, and remote professionals."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <ModularFrame>
              <h3 className="font-display text-xl font-semibold">Constraints</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                <li>No animal mascots, flames, or lightning-bolt marks.</li>
                <li>Accent color reserved for interaction and product ID, not decoration.</li>
                <li>Logo must survive embroidery, packaging foil, and 16px favicons.</li>
                <li>Family packaging must share one structure with clear product variation.</li>
              </ul>
            </ModularFrame>
            <ModularFrame>
              <h3 className="font-display text-xl font-semibold">Design opportunity</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Precision can be emotional. Controlled forward angles, modular
                spacing, and quiet accent moments create a sense of speed without
                relying on aggressive gaming conventions. The identity uses
                alignment and negative space as the brand&apos;s primary energy.
              </p>
            </ModularFrame>
          </div>
        </section>

        <section id="audience" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="03 · Audience and positioning"
            title="Built for people who care how their tools feel"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VOLTLINE.audience.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-secondary"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {VOLTLINE.values.map((value) => (
              <Badge key={value} tone="secondary">
                {value}
              </Badge>
            ))}
          </div>
        </section>

        <section id="concept" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="04 · Concept development"
            title="From keyword board to a selected geometric system"
            description="The process shows the decision path from keyword board to the selected geometric system, including the directions that were tested and rejected."
          />
          <div className="mb-6 flex flex-wrap gap-2">
            {VOLTLINE.keywords.map((word) => (
              <span
                key={word}
                className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted"
              >
                {word}
              </span>
            ))}
          </div>
          <div className="mb-6 inline-flex rounded-xl border border-white/10 p-1">
            {(["before", "after"] as const).map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => setCompare(state)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm capitalize transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF3D]",
                  compare === state
                    ? "bg-white text-black"
                    : "text-muted hover:text-text",
                )}
              >
                {state === "before" ? "Early direction" : "Final direction"}
              </button>
            ))}
          </div>
          <ModularFrame className="mb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={compare}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                className="grid gap-6 md:grid-cols-2"
              >
                {compare === "before" ? (
                  <>
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                      <Image
                        src="/projects/voltline/images/concept-explorations.svg"
                        alt="Voltline early logo concept explorations"
                        width={900}
                        height={620}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                      <SpecLabel>Early exploration</SpecLabel>
                      <p className="mt-6 font-display text-2xl">Rejected direction</p>
                      <p className="mt-3 text-sm text-muted">
                        Initial routes either overloaded the signal motif with
                        angled cuts or became too soft and static. Neither balanced
                        premium restraint with the forward motion the category needs.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                      <VoltlineMark variant="symbol" className="text-white" />
                      <p className="mt-6 font-display text-2xl">Aligned V / L system</p>
                      <p className="mt-3 text-sm text-muted">
                        The final mark keeps modular geometry, strong negative
                        space, and a compact L counterweight that implies
                        connection without literal circuitry.
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                      <SignalLines />
                      <p className="mt-6 font-display text-2xl">Supporting language</p>
                      <p className="mt-3 text-sm text-muted">
                        Signal lines, cropped frames, and specification labels
                        carry the brand even when the logo is absent.
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </ModularFrame>
          <div className="grid gap-4 md:grid-cols-3">
            {VOLTLINE_CONCEPTS.map((concept) => (
              <article
                key={concept.title}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold">{concept.title}</h3>
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
                      concept.status === "Selected"
                        ? "bg-[#C8FF3D]/15 text-[#C8FF3D]"
                        : "bg-white/5 text-muted",
                    )}
                  >
                    {concept.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{concept.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="logo" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="05 · Logo system"
            title="A geometric V/L mark with modular lockups"
            description="All logo assets live in /public/projects/voltline so future vector replacements can drop in without rewriting components."
          />
          <div className="mb-6 flex flex-wrap gap-2">
            {LOGO_VARIANTS.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setLogoVariant(variant.id)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF3D]",
                  logoVariant === variant.id
                    ? "border-[#C8FF3D]/40 bg-[#C8FF3D]/10 text-text"
                    : "border-white/10 text-muted hover:text-text",
                )}
              >
                {variant.label}
              </button>
            ))}
          </div>
          <ModularFrame className="mb-8 grid min-h-56 place-items-center">
            <motion.div
              key={logoVariant}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <VoltlineMark variant={logoVariant} />
            </motion.div>
          </ModularFrame>
          <div className="grid gap-4 lg:grid-cols-2">
            <ModularFrame>
              <SpecLabel>Construction grid</SpecLabel>
              <motion.svg
                viewBox="0 0 200 200"
                className="mt-6 h-56 w-full text-white"
                initial={reducedMotion ? false : { opacity: 0.35 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <g stroke="currentColor" strokeOpacity="0.15">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <g key={index}>
                      <line x1={20 * index} y1="0" x2={20 * index} y2="200" />
                      <line x1="0" y1={20 * index} x2="200" y2={20 * index} />
                    </g>
                  ))}
                </g>
                <motion.path
                  d="M40 40h36l24 72 24-72h36L116 160H84L40 40Z"
                  fill="currentColor"
                  initial={reducedMotion ? false : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1 }}
                />
                <rect x="132" y="112" width="36" height="12" fill="#C8FF3D" />
                <rect x="132" y="112" width="12" height="48" fill="#C8FF3D" />
              </motion.svg>
            </ModularFrame>
            <div className="grid gap-4">
              <ModularFrame>
                <SpecLabel>Clear space</SpecLabel>
                <p className="mt-4 text-sm text-muted">
                  Maintain clear space equal to the height of the L counterweight
                  on all sides. Never crowd the mark with photography edges or UI chrome.
                </p>
              </ModularFrame>
              <ModularFrame>
                <SpecLabel>Minimum size</SpecLabel>
                <div className="mt-4 flex items-end gap-6">
                  <VoltlineMark variant="symbol" className="h-10 w-10" />
                  <VoltlineMark variant="symbol" className="h-6 w-6" />
                  <span className="font-mono text-xs text-muted">16px digital minimum</span>
                </div>
              </ModularFrame>
              <ModularFrame>
                <SpecLabel>One-color / reversed</SpecLabel>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="grid place-items-center rounded-xl bg-[#F4F4F1] p-4">
                    <VoltlineMark variant="symbol" onLight className="h-10 w-10" />
                  </div>
                  <div className="grid place-items-center rounded-xl bg-black p-4">
                    <VoltlineMark variant="symbol" className="h-10 w-10" />
                  </div>
                </div>
              </ModularFrame>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-rose-400/15 bg-rose-400/[0.04] p-5">
            <h3 className="font-display text-lg font-semibold">Incorrect use</h3>
            <ul className="mt-3 grid gap-2 text-sm text-muted md:grid-cols-2">
              {VOLTLINE_DONT.map((item) => (
                <li key={item} className="flex gap-2">
                  <X className="mt-0.5 size-4 shrink-0 text-rose-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="color" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="06 · Color palette"
            title="Carbon foundations with a single electric accent"
            description="Electric Lime is reserved for calls to action, active states, and product identifiers. The rest of the system stays graphite-led so the accent remains meaningful."
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {VOLTLINE_COLORS.map((color) => (
              <button
                key={color.hex}
                type="button"
                onClick={() => void copyHex(color.hex)}
                className="group overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] text-left transition hover:border-[#C8FF3D]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF3D]"
                aria-label={`Copy ${color.name} hex ${color.hex}`}
              >
                <div className="h-28" style={{ backgroundColor: color.hex }} />
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-lg font-semibold">{color.name}</p>
                    <span className="text-[#C8FF3D]">
                      {copied === color.hex ? <Check className="size-4" /> : <Copy className="size-4 opacity-60 group-hover:opacity-100" />}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-muted">{color.hex}</p>
                  <p className="font-mono text-xs text-muted">RGB {color.rgb}</p>
                  <p className="text-sm leading-relaxed text-secondary">{color.use}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section id="type" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="07 · Typography"
            title="Geometric display with calm body clarity"
            description="Outfit carries the industrial display voice already used across this portfolio. Source Sans keeps long-form reading comfortable, while JetBrains Mono handles specifications and metadata."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <ModularFrame className="space-y-6">
              <div>
                <SpecLabel>Display</SpecLabel>
                <p className="mt-2 font-display text-5xl font-semibold tracking-tight">
                  VOLTLINE AXIS
                </p>
              </div>
              <div>
                <SpecLabel>Section heading</SpecLabel>
                <p className="mt-2 font-display text-2xl font-semibold">
                  Precision without spectacle
                </p>
              </div>
              <div>
                <SpecLabel>Body</SpecLabel>
                <p className="mt-2 text-base leading-relaxed text-secondary">
                  The type pairing favors clarity under dense product information.
                  Display faces stay geometric and tightly spaced; body copy remains
                  open enough for packaging panels and guidelines text.
                </p>
              </div>
            </ModularFrame>
            <ModularFrame className="space-y-5">
              <div>
                <SpecLabel>Caption / metadata</SpecLabel>
                <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
                  SKU VL-AXIS-87 · REV 02
                </p>
              </div>
              <div>
                <SpecLabel>Button label</SpecLabel>
                <p className="mt-2 text-sm font-semibold tracking-wide">Explore the system</p>
              </div>
              <div>
                <SpecLabel>Numeric specification</SpecLabel>
                <p className="mt-2 font-mono text-3xl text-[#C8FF3D]">8000 Hz</p>
              </div>
              <DirectionMarker label="Type hierarchy lock" />
            </ModularFrame>
          </div>
          <ModularFrame className="mt-4">
            <SpecLabel>Type scale specimen</SpecLabel>
            <div className="mt-5 divide-y divide-white/8">
              <div className="grid gap-2 py-4 sm:grid-cols-[7rem_1fr] sm:items-baseline">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  Display · 48
                </span>
                <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Precision in every connection
                </p>
              </div>
              <div className="grid gap-2 py-4 sm:grid-cols-[7rem_1fr] sm:items-baseline">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  Body · 16
                </span>
                <p className="max-w-2xl text-base leading-relaxed text-secondary">
                  Performance tools designed to support focused, everyday work.
                </p>
              </div>
              <div className="grid gap-2 py-4 sm:grid-cols-[7rem_1fr] sm:items-baseline">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  Mono · 12
                </span>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#C8FF3D]">
                  VL-AXIS-87 · INPUT 5V · REV 02
                </p>
              </div>
            </div>
          </ModularFrame>
        </section>

        <section id="language" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="08 · Supporting graphic language"
            title="A kit that works even when the logo is absent"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ModularFrame>
              <SpecLabel>Modular lines</SpecLabel>
              <SignalLines className="mt-8" />
            </ModularFrame>
            <ModularFrame>
              <SpecLabel>Cropped frame</SpecLabel>
              <div className="mt-8 aspect-video rounded-xl border border-white/15 bg-gradient-to-br from-white/10 to-transparent" />
            </ModularFrame>
            <ModularFrame>
              <SpecLabel>Spec label</SpecLabel>
              <div className="mt-8 space-y-3">
                <SpecLabel>Latency class A</SpecLabel>
                <SpecLabel>Desk-ready</SpecLabel>
              </div>
            </ModularFrame>
            <ModularFrame>
              <SpecLabel>Accent bar</SpecLabel>
              <div className="mt-10 space-y-3">
                <AccentBar />
                <AccentBar className="w-20" />
                <AccentBar className="w-8" />
              </div>
            </ModularFrame>
          </div>
        </section>

        <section id="applications" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="09 · Brand applications"
            title="Collateral that proves the system under real constraints"
            description="These are composed CSS/SVG mockup presentations with replaceable image slots for future photo-realistic assets."
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {APPLICATIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightbox(item)}
                className="group rounded-2xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF3D]"
              >
                <div
                  className={cn(
                    "overflow-hidden rounded-2xl border border-white/10 bg-[#101010] p-4 transition group-hover:-translate-y-1 group-hover:border-[#C8FF3D]/35",
                    item.ratio,
                  )}
                >
                  <ApplicationPreview id={item.id} />
                </div>
                <p className="mt-3 text-sm font-medium text-text">{item.title}</p>
                <p className="text-xs text-muted">Click to enlarge</p>
              </button>
            ))}
          </div>
        </section>

        <section id="packaging" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="10 · Packaging"
            title="One structure, three product identities"
            description="Axis, Pulse, and Core share hierarchy, grid logic, and technical panels. Accent bars and product names create family variation."
          />
          <div className="flex snap-x gap-4 overflow-x-auto pb-2">
            {VOLTLINE_PRODUCTS.map((product) => (
              <article
                key={product.id}
                className="w-[min(320px,85vw)] shrink-0 snap-start rounded-3xl border border-white/10 bg-[#0A0A0A] p-5"
              >
                <div
                  className="mb-4 h-2 rounded-full"
                  style={{ backgroundColor: product.accent }}
                />
                <SpecLabel>{product.id.toUpperCase()} SERIES</SpecLabel>
                <h3 className="mt-3 font-display text-2xl font-semibold">{product.name}</h3>
                <p className="mt-2 text-sm text-muted">{product.tagline}</p>
                <div className="mt-6 aspect-[3/4] rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-4">
                  <VoltlineMark variant="symbol" className="h-8 w-8" />
                  <p className="mt-8 font-display text-xl tracking-wide">VOLTLINE</p>
                  <p className="mt-2 text-sm text-secondary">{product.name}</p>
                  <div className="mt-auto pt-16">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                      Spec panel
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-secondary">
                      {product.specs.map((spec) => (
                        <li key={spec}>· {spec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="social" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="11 · Social and advertising"
            title="Layouts that adapt by ratio, not by crop"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SOCIAL.map((item) => {
              const isWideBanner = item.id === "banner";
              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A]"
                >
                  <div
                    className={cn(
                      "relative flex flex-col p-5",
                      item.ratio,
                      isWideBanner ? "justify-between gap-3" : "justify-start",
                    )}
                  >
                    <SpecLabel>Campaign · {item.title}</SpecLabel>
                    <p
                      className={cn(
                        "font-display font-semibold leading-tight",
                        isWideBanner
                          ? "mt-1 max-w-none text-lg sm:text-xl"
                          : "mt-8 max-w-[14ch] text-2xl sm:text-3xl",
                      )}
                    >
                      {item.copy}
                    </p>
                    <div
                      className={cn(
                        "flex items-end justify-between gap-3",
                        isWideBanner ? "mt-auto pt-1" : "absolute bottom-5 left-5 right-5",
                      )}
                    >
                      <VoltlineMark variant="wordmark" className="h-5 w-auto shrink-0" />
                      <AccentBar className="w-8 shrink-0" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="guidelines" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="12 · Brand guidelines preview"
            title="A compact standards document, page by page"
          />
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-2">
              {GUIDELINE_PAGES.map((page, index) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setGuidelinePage(index)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8FF3D]",
                    guidelinePage === index
                      ? "border-[#C8FF3D]/35 bg-[#C8FF3D]/10 text-text"
                      : "border-white/8 text-muted hover:text-text",
                  )}
                >
                  <span>{page}</span>
                  <span className="font-mono text-[10px]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </button>
              ))}
            </div>
            <motion.div
              key={guidelinePage}
              initial={reducedMotion ? false : { rotateY: -8, opacity: 0.6 }}
              animate={{ rotateY: 0, opacity: 1 }}
              className="min-h-[420px] rounded-[1.5rem] border border-white/10 bg-[#111] p-8 [transform-style:preserve-3d]"
              style={{ perspective: 1000 }}
            >
              <SpecLabel>Guidelines spread</SpecLabel>
              <h3 className="mt-4 font-display text-3xl font-semibold">
                {GUIDELINE_PAGES[guidelinePage]}
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
                {GUIDELINE_CONTENT[GUIDELINE_PAGES[guidelinePage]]}
              </p>
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <VoltlineMark variant="symbol" className="h-8 w-8" />
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <AccentBar />
                  <p className="mt-4 font-mono text-xs text-muted">Rule sample block</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="reflection" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="13 · Final reflection"
            title="What this identity taught me"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <ModularFrame>
              <h3 className="font-display text-xl font-semibold">Strongest decision</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Reserving Electric Lime for functional moments. Once the accent
                stopped decorating every surface, the brand immediately felt more
                premium and more intentional.
              </p>
            </ModularFrame>
            <ModularFrame>
              <h3 className="font-display text-xl font-semibold">Challenge</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Designing energy without gaming clichés. Forward motion had to
                come from alignment, spacing, and modular geometry instead of
                lightning metaphors or RGB excess.
              </p>
            </ModularFrame>
            <ModularFrame>
              <h3 className="font-display text-xl font-semibold">What I learned</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                A complete identity is a system of relationships. The logo only
                works if packaging, type, and campaign layouts can carry the same
                logic when the mark is small—or missing entirely.
              </p>
            </ModularFrame>
            <ModularFrame>
              <h3 className="font-display text-xl font-semibold">Future revision</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                I would refine the interim artwork into final composed mockups,
                photograph real print pieces, and expand the guidelines into a
                shareable PDF with production-ready spacing diagrams.
              </p>
            </ModularFrame>
          </div>
        </section>

        <CaseStudyFooterNav
          prev={{ href: "/projects/signal-magazine", label: "Signal Magazine" }}
          next={{ href: "/projects/nightshift", label: "NightShift" }}
          seriesLabel="Design series 1 / 3"
          accent="#C8FF3D"
        />
      </div>

      <CaseStudyLightbox
        open={!!lightbox}
        title={lightbox?.title ?? ""}
        onClose={() => setLightbox(null)}
        accent="#C8FF3D"
      >
        <p className="mb-4 text-sm text-muted">Application mockup</p>
        <div
          className={cn(
            "rounded-2xl border border-white/10 bg-[#101010] p-6",
            lightbox?.ratio,
          )}
        >
          {lightbox ? <ApplicationPreview id={lightbox.id} large /> : null}
        </div>
      </CaseStudyLightbox>
    </article>
  );
}

function ApplicationPreview({
  id,
  large = false,
}: {
  id: (typeof APPLICATIONS)[number]["id"];
  large?: boolean;
}) {
  const scale = large ? "sm:scale-110" : "";

  switch (id) {
    case "card":
      return (
        <div className={cn("flex h-full items-center gap-4 rounded-lg bg-[#080808] p-4", scale)}>
          <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#C8FF3D]">
            <VoltlineMark variant="symbol" onLight className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <VoltlineMark variant="wordmark" className="h-4 w-auto" />
            <div className="mt-4 space-y-1">
              <div className="h-px w-4/5 bg-white/25" />
              <div className="h-px w-3/5 bg-white/15" />
              <div className="h-px w-2/5 bg-white/15" />
            </div>
          </div>
        </div>
      );
    case "letterhead":
      return (
        <div className="flex h-full flex-col bg-[#F1F1ED] p-4 text-black">
          <div className="flex items-center justify-between border-b border-black/20 pb-3">
            <VoltlineMark variant="wordmark" onLight className="h-3 w-auto" />
            <span className="font-mono text-[7px] uppercase tracking-wider">VL / 01</span>
          </div>
          <div className="mt-8 space-y-2">
            {[88, 100, 94, 72, 98, 82, 55].map((width, index) => (
              <div
                key={index}
                className="h-px bg-black/20"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
          <div className="mt-auto h-1 w-10 bg-[#7DAA00]" />
        </div>
      );
    case "badge":
      return (
        <div className="flex h-full flex-col rounded-xl bg-[#E9E9E4] p-3 text-black">
          <div className="flex items-center justify-between">
            <VoltlineMark variant="symbol" onLight className="h-5 w-5" />
            <span className="font-mono text-[6px]">ID 024</span>
          </div>
          <div className="mx-auto mt-5 aspect-[4/5] w-3/5 bg-gradient-to-br from-black/10 to-black/30" />
          <p className="mt-4 text-center font-display text-xs font-semibold">MARA VOSS</p>
          <p className="text-center font-mono text-[6px] uppercase tracking-widest">
            Product systems
          </p>
          <div className="mx-auto mt-auto h-1 w-8 bg-[#7DAA00]" />
        </div>
      );
    case "box":
      return (
        <div className="relative grid h-full place-items-center overflow-hidden rounded-lg border border-white/10 bg-[#090909]">
          <div className="absolute right-0 top-0 h-14 w-14 bg-[#C8FF3D] [clip-path:polygon(100%_0,100%_100%,0_0)]" />
          <VoltlineMark variant="symbol" className={cn("h-16 w-16", large && "sm:h-24 sm:w-24")} />
          <p className="absolute bottom-3 left-3 font-mono text-[7px] uppercase tracking-[0.2em] text-muted">
            Axis series
          </p>
        </div>
      );
    case "manual":
      return (
        <div className="flex h-full flex-col rounded-lg bg-[#EDEDE8] p-4 text-black">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-semibold">QUICK START</p>
            <VoltlineMark variant="symbol" onLight className="h-5 w-5" />
          </div>
          <div className="mt-5 grid flex-1 grid-cols-3 gap-2">
            {["Connect", "Configure", "Create"].map((step, index) => (
              <div key={step} className="border-t border-black/25 pt-2">
                <span className="font-mono text-lg font-semibold text-[#668A00]">
                  0{index + 1}
                </span>
                <p className="mt-2 text-[7px] font-semibold uppercase">{step}</p>
                <div className="mt-2 h-px w-full bg-black/15" />
              </div>
            ))}
          </div>
        </div>
      );
    case "warranty":
      return (
        <div className="grid h-full place-items-center border border-double border-white/25 p-3 text-center">
          <div>
            <VoltlineMark variant="symbol" className="mx-auto h-7 w-7" />
            <p className="mt-3 font-display text-sm font-semibold tracking-wide">
              LIMITED WARRANTY
            </p>
            <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.18em] text-muted">
              Registered product protection
            </p>
            <div className="mx-auto mt-4 h-px w-20 bg-[#C8FF3D]" />
          </div>
        </div>
      );
    case "web":
      return (
        <div className="relative flex h-full flex-col overflow-hidden rounded-lg bg-[#070707] p-4">
          <div className="flex items-center justify-between">
            <VoltlineMark variant="wordmark" className="h-3 w-auto" />
            <div className="flex gap-1.5">
              <span className="size-1 rounded-full bg-white/30" />
              <span className="size-1 rounded-full bg-white/30" />
              <span className="size-1 rounded-full bg-[#C8FF3D]" />
            </div>
          </div>
          <p className="mt-auto max-w-[12ch] font-display text-xl font-semibold leading-none sm:text-2xl">
            QUIETER POWER. SHARPER WORK.
          </p>
          <div className="mt-4 flex h-7 items-center justify-between rounded-sm bg-[#C8FF3D] px-3 font-mono text-[7px] uppercase text-black">
            <span>Explore Axis</span>
            <span>→</span>
          </div>
        </div>
      );
    case "social":
      return (
        <div className="grid h-full place-items-center bg-[#111]">
          <div className="grid aspect-square w-3/5 place-items-center overflow-hidden rounded-full border border-[#C8FF3D]/30 bg-black shadow-[0_0_40px_rgba(200,255,61,0.12)]">
            <VoltlineMark
              variant="symbol"
              className={cn("h-1/2 w-1/2", large && "sm:h-3/5 sm:w-3/5")}
            />
          </div>
        </div>
      );
    case "wallpaper":
      return (
        <div
          className="relative h-full overflow-hidden rounded-lg bg-[#090909]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          <div className="absolute bottom-4 right-4 flex items-end gap-2">
            <span className="font-mono text-[6px] uppercase tracking-widest text-muted">
              Stay aligned
            </span>
            <VoltlineMark variant="symbol" className="h-8 w-8" />
          </div>
        </div>
      );
    case "banner":
      return (
        <div className="relative flex h-full flex-col overflow-hidden bg-[#080808] p-3">
          <VoltlineMark variant="symbol" className="h-7 w-7" />
          <p className="mt-8 font-display text-2xl font-semibold leading-[0.82] [writing-mode:vertical-rl]">
            VOLT
            <br />
            LINE
          </p>
          <div className="absolute bottom-0 right-0 h-2/5 w-2 bg-[#C8FF3D]" />
          <p className="mt-auto font-mono text-[6px] uppercase tracking-[0.2em] text-muted">
            Precision accessories
          </p>
        </div>
      );
    default:
      return null;
  }
}
