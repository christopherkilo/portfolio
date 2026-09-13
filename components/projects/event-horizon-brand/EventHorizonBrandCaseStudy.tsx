"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  EH_BRAND,
  EH_BRAND_COLORS,
  EH_BRAND_SECTIONS,
} from "@/lib/event-horizon-brand/content";
import {
  BrandFrame,
  HorizonRule,
  MerchLockup,
  PrintEclipse,
  PrintWordmark,
  SpecLabel,
} from "@/components/projects/event-horizon-brand/EventHorizonBrandPrimitives";
import { EventHorizonMerchGallery } from "@/components/projects/event-horizon-brand/EventHorizonMerchGallery";
import {
  BRIDGE_APPLICATIONS,
  EVENTS_APPLICATIONS,
  EventHorizonApplicationGallery,
  SYSTEM_APPLICATIONS,
} from "@/components/projects/event-horizon-brand/EventHorizonApplicationGallery";
import {
  CaseStudyDesktopNav,
  CaseStudyFooterNav,
  CaseStudyMobileToc,
  CaseStudyProgress,
  CaseStudyScrollCue,
  useActiveSection,
} from "@/components/projects/shared/CaseStudyChrome";

const ACCENT = "#FF8C2B";

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
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[#F4F0EB] sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-relaxed text-[#D4CDC6] sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <figcaption className="mt-3 text-sm leading-relaxed text-[#C4BBB3]">
      {children}
    </figcaption>
  );
}

function Plate({
  src,
  alt,
  width,
  height,
  className,
  objectPosition = "center",
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1100px",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  objectPosition?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      sizes={sizes}
      className={cn("h-auto w-full object-cover", className)}
      style={{ objectPosition }}
    />
  );
}

export function EventHorizonBrandCaseStudy() {
  const reducedMotion = useReducedMotion();
  const [copied, setCopied] = useState<string | null>(null);
  const activeSection = useActiveSection(EH_BRAND_SECTIONS);

  const copyHex = useCallback(async (name: string, hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(`${name} ${hex}`);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  }, []);

  return (
    <article className="relative bg-[#0B0B0B] pb-24 text-[#F4F0EB]">
      <p className="sr-only" aria-live="polite">
        {copied ? `Copied ${copied}` : ""}
      </p>
      <CaseStudyProgress accent={ACCENT} />
      <CaseStudyDesktopNav
        sections={EH_BRAND_SECTIONS}
        activeSection={activeSection}
        accent={ACCENT}
      />

      <section className="relative min-h-[88vh] overflow-hidden border-b border-white/8 bg-[#0B0B0B]">
        <Image
          src="/projects/event-horizon-brand/hero.webp"
          alt="Event Horizon visual identity: campaign poster, mobile product interface, admission ticket, and VIP credential."
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-[78%_40%] lg:object-[center_42%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/70 to-[#0B0B0B]/25"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B]/45 via-[#0B0B0B]/12 to-transparent lg:from-[#0B0B0B]/60 lg:via-[#0B0B0B]/20"
        />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-10 pt-24 sm:px-6 lg:px-8 lg:pb-14">
          <Link
            href="/projects"
            className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-[#F4F0EB]/80 transition hover:text-[#F4F0EB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C2B]"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to Projects
          </Link>
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-[#FF8C2B]">
            Brand Identity · {EH_BRAND.year}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-[0.12em] text-[#F4F0EB] sm:text-5xl md:text-6xl lg:text-7xl">
            Event Horizon
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#F4F0EB]/85">
            Brand identity for a cinematic event-discovery platform.
          </p>
          <p className="mt-3 font-display text-xl text-[#F4F0EB] sm:text-2xl">
            {EH_BRAND.statement}
          </p>
          <dl className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Role", EH_BRAND.role],
              ["Scope", EH_BRAND.scope],
              ["Product", EH_BRAND.product],
              ["Year", EH_BRAND.year],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F4F0EB]/70">
                  {label}
                </dt>
                <dd className="mt-1 text-sm text-[#F4F0EB]/85">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Brand Identity", "Visual Systems", "Campaign Design"].map((skill) => (
              <Badge
                key={skill}
                className="border-white/25 bg-black/45 text-[#F4F0EB]"
              >
                {skill}
              </Badge>
            ))}
          </div>
          <div className="mt-8 flex justify-center sm:justify-start">
            <CaseStudyScrollCue href="#overview" reducedMotion={reducedMotion} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6 sm:py-16 md:space-y-28 lg:px-8">
        <CaseStudyMobileToc
          sections={EH_BRAND_SECTIONS}
          activeSection={activeSection}
          accent={ACCENT}
        />

        <section id="overview" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="01 · The product came first"
            title="The product already existed"
            description="Event Horizon began as a working event-discovery product. The branding campaign did not invent a disconnected identity. It named what was already distinctive and turned those decisions into rules that could survive off the screen."
          />
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <BrandFrame>
              <SpecLabel>Existing anchors</SpecLabel>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#D4CDC6]">
                <li>Outfit as the display voice</li>
                <li>Void black and Horizon orange</li>
                <li>Warm contrast instead of cool tech gray</li>
                <li>Cinematic event photography</li>
                <li>A circular motif as the point of gravity</li>
              </ul>
            </BrandFrame>
            <figure>
              <BrandFrame padded={false}>
                <Plate
                  src="/projects/event-horizon-brand/photo-concert.webp"
                  alt="Warm, low-light concert photography used as the product’s existing visual mood."
                  width={1400}
                  height={933}
                  className="aspect-[16/10] sm:aspect-[21/11]"
                  objectPosition="center 35%"
                />
              </BrandFrame>
              <Caption>
                The product already had a mood. Branding had to make that mood portable.
              </Caption>
            </figure>
          </div>
        </section>

        <section id="problem" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="02 · The design problem"
            title="From product style to brand system"
            description="The interface had a recognizable atmosphere. It did not yet have complete rules for print, credentials, tickets, posters, signage, merchandise, or partner materials."
          />
          <BrandFrame className="max-w-3xl">
            <p className="font-display text-2xl font-semibold tracking-tight text-[#F4F0EB] sm:text-3xl">
              What makes something feel like Event Horizon when the website is not present?
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#D4CDC6] sm:text-base">
              That question drove every later decision: how large the mark can be, when it
              should disappear, and which motifs still read as the brand in a dark room.
            </p>
          </BrandFrame>
        </section>

        <section id="territory" className="scroll-mt-[var(--scroll-mt)]">
          <div className="overflow-hidden rounded-[1.75rem] border border-white/8 bg-[#0B0B0B] px-6 py-16 sm:px-10 sm:py-20">
            <SpecLabel>03 · Brand territory</SpecLabel>
            <h2 className="mt-6 font-display text-5xl font-bold uppercase tracking-[0.08em] text-[#F4F0EB] sm:text-6xl md:text-7xl">
              Warm Darkness.
            </h2>
            <HorizonRule className="mt-8 max-w-md" />
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#F4F0EB]/80">
              Black space. Controlled orange light. People and experiences pulled toward
              a center.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#C4BBB3]">
              Gravity is a metaphor, not costume astronomy. The allowed language is a
              circular void, a horizon line, a cropped arc, an interrupted orbit, and
              amber light. Not planets, stars, galaxies, or astronauts. This is an event
              platform.
            </p>
          </div>
        </section>

        <section id="identity" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="04 · Identity"
            title="One gravitational center, two approved lockups"
            description="The identity supports two approved treatments. In the global wordmark, EVENT HORIZON uses a standard wordmark with the O in HORIZON colored Horizon orange. In merchandise lockups, the hollow orange ring appears as a separate symbol above or below the type. A single piece uses one treatment or the other—never both."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <BrandFrame className="flex min-h-52 items-center justify-center bg-[#0B0B0B]">
              <div className="text-center">
                <PrintWordmark className="text-2xl sm:text-3xl" />
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#C4BBB3]">
                  Dark field · orange O wordmark
                </p>
              </div>
            </BrandFrame>
            <BrandFrame className="flex min-h-52 items-center justify-center bg-[#F4F0EB]">
              <div className="text-center">
                <PrintWordmark field="light" className="text-2xl sm:text-3xl" />
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#161310]">
                  Light field · same construction
                </p>
              </div>
            </BrandFrame>
            <BrandFrame className="flex min-h-52 flex-col items-center justify-center gap-4">
              <PrintEclipse size={72} hollow />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C4BBB3]">
                Merchandise ring · hollow center
              </p>
            </BrandFrame>
            <BrandFrame className="flex min-h-52 flex-col items-center justify-center gap-3">
              <MerchLockup />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C4BBB3]">
                Stacked merch lockup
              </p>
            </BrandFrame>
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#D4CDC6]">
            The merchandise ring stays hollow. It does not thicken into a badge, fill
            with orange, or grow elliptical rings. One gravitational center per piece.
          </p>
        </section>

        <section id="color" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="05 · Color"
            title="Void, Horizon, Warm White"
            description="The system lives in black space with one gravitational accent. Nightlife purple is a category color, not identity. VIP gold is status-only."
          />
          <div className="grid gap-3 md:grid-cols-3">
            {EH_BRAND_COLORS.filter((c) => c.primary).map((color) => (
              <button
                key={color.hex}
                type="button"
                onClick={() => copyHex(color.name, color.hex)}
                aria-label={`Copy ${color.name} color ${color.hex}`}
                className="group overflow-hidden rounded-2xl border border-white/8 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C2B]"
              >
                <span
                  className="block aspect-[16/10]"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="flex items-start justify-between gap-3 bg-[#171717] p-4">
                  <span>
                    <span className="block font-display text-lg font-semibold text-[#F4F0EB]">
                      {color.name}
                    </span>
                    <span className="mt-1 block font-mono text-xs text-[#C4BBB3]">
                      {color.hex}
                    </span>
                    <span className="mt-2 block text-sm text-[#D4CDC6]">{color.use}</span>
                  </span>
                  <span className="mt-1 text-[#C4BBB3]" aria-hidden>
                    {copied === `${color.name} ${color.hex}` ? (
                      <Check className="size-4 text-[#FF8C2B]" />
                    ) : (
                      <Copy className="size-4 opacity-60 group-hover:opacity-100" />
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {EH_BRAND_COLORS.filter((c) => !c.primary).map((color) => (
              <button
                key={color.hex}
                type="button"
                onClick={() => copyHex(color.name, color.hex)}
                aria-label={`Copy ${color.name} color ${color.hex}`}
                className="overflow-hidden rounded-xl border border-white/8 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C2B]"
              >
                <span className="block h-16" style={{ backgroundColor: color.hex }} />
                <span className="block bg-[#171717] p-3">
                  <span className="block text-sm font-medium text-[#F4F0EB]">{color.name}</span>
                  <span className="mt-1 block font-mono text-[11px] text-[#C4BBB3]">
                    {color.hex}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section id="type" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="06 · Typography"
            title="Outfit carries energy. Source Sans 3 carries reading."
            description="Hierarchy, not a specimen dump. Outfit is identity and event voice. Source Sans 3 keeps longer copy readable. Outfit Medium handles labels, metadata, and tickets."
          />
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <BrandFrame>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C4BBB3]">
                Outfit Bold
              </p>
              <p className="mt-4 font-display text-4xl font-bold uppercase leading-[0.95] tracking-[0.06em] text-[#F4F0EB] sm:text-5xl">
                Where nights out
                <br />
                gather gravity.
              </p>
            </BrandFrame>
            <div className="grid gap-4">
              <BrandFrame>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#C4BBB3]">
                  Source Sans 3
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#D4CDC6]">
                  Body and explanatory copy. The product, this case study, and longer
                  event descriptions stay in a readable sans so Outfit never has to
                  do every job.
                </p>
              </BrandFrame>
              <BrandFrame>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#C4BBB3]">
                  Outfit Medium · GA · Doors 7:30 PM
                </p>
                <p className="mt-3 font-display text-sm font-medium uppercase tracking-[0.16em] text-[#F4F0EB]">
                  Skyline Jazz Sessions
                </p>
              </BrandFrame>
            </div>
          </div>
        </section>

        <section id="language" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="07 · Graphic language"
            title="The system is stronger than the logo"
            description="These motifs can build a recognizable Event Horizon layout without placing a giant wordmark in the center."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <BrandFrame className="flex min-h-44 flex-col justify-between">
              <HorizonRule className="max-w-none" />
              <p className="mt-8 font-display text-lg font-semibold">Horizon line</p>
              <p className="mt-2 text-sm text-[#D4CDC6]">
                A thin orange rule. It divides, dates, and holds type in place.
              </p>
            </BrandFrame>
            <BrandFrame className="flex min-h-44 flex-col items-start justify-between">
              <PrintEclipse size={56} hollow />
              <div>
                <p className="font-display text-lg font-semibold">Outlined ring</p>
                <p className="mt-2 text-sm text-[#D4CDC6]">
                  Hollow center. Never a filled disc, sunset, or Saturn.
                </p>
              </div>
            </BrandFrame>
            <BrandFrame padded={false} className="relative min-h-44 overflow-hidden">
              <Image
                src="/projects/event-horizon-brand/cropped-arc.svg"
                alt=""
                width={320}
                height={240}
                unoptimized
                className="absolute -right-8 top-0 h-full w-auto opacity-90"
              />
              <div className="relative p-5 sm:p-6">
                <p className="font-display text-lg font-semibold">Cropped arc</p>
                <p className="mt-2 max-w-[12rem] text-sm text-[#D4CDC6]">
                  Apparel-scale gravity. The circle continues off the object.
                </p>
              </div>
            </BrandFrame>
            <BrandFrame className="flex min-h-44 items-center gap-4">
              <Image
                src="/projects/event-horizon-brand/interrupted-orbit.svg"
                alt=""
                width={88}
                height={88}
                unoptimized
                className="size-20"
              />
              <div>
                <p className="font-display text-lg font-semibold">Interrupted orbit</p>
                <p className="mt-2 text-sm text-[#D4CDC6]">
                  Motion implied by a break, not by planets.
                </p>
              </div>
            </BrandFrame>
            <BrandFrame className="relative min-h-44 overflow-hidden sm:col-span-2">
              <span
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(255,140,43,0.28),transparent_55%)]"
              />
              <div className="relative">
                <p className="font-display text-lg font-semibold">Amber wash</p>
                <p className="mt-2 max-w-md text-sm text-[#D4CDC6]">
                  Light pulled toward a center. Used in photography and dark fields,
                  not as a second logo.
                </p>
              </div>
            </BrandFrame>
          </div>
        </section>

        <section id="events" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="08 · Event applications"
            title="The brand doing its actual job"
            description="Tickets, credentials, and wayfinding had to work in the hand and in a dark venue. The mark stays small. Type, contrast, and the horizon line do the recognition."
          />
          <EventHorizonApplicationGallery
            items={EVENTS_APPLICATIONS}
            layout="system"
          />
        </section>

        <section id="posters" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="09 · Poster system"
            title="Photography changes. The system does not."
            description="Skyline Jazz Sessions, Night Market No. 04, and After Dark Design Conference share type, spacing, a horizon line, and restrained orange light. That is what makes them a family."
          />
          <figure>
            <BrandFrame padded={false}>
              <Plate
                src="/projects/event-horizon-brand/posters.webp"
                alt="Three Event Horizon campaign posters: Skyline Jazz Sessions, Night Market No. 04, and After Dark Design, each with photography above a dark type field and a thin horizon line."
                width={1600}
                height={901}
              />
            </BrandFrame>
            <Caption>
              Three events, one structure. Flexibility without inventing a new identity
              for each night.
            </Caption>
          </figure>
        </section>

        <section id="merch" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="10 · Merchandise"
            title="Expressive for guests. Functional for crew."
            description="The system moves off the screen into objects people carry, wear, and use. Consumer backs use the cropped arc and tagline. Staff apparel drops the graphic and says STAFF. Same identity, different jobs."
          />
          <EventHorizonMerchGallery />
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#D4CDC6]">
            Each object is one application of the system. Apparel, drinkware, and
            print keep the same gravity without repeating the same lockup on every
            surface.
          </p>
        </section>

        <section id="bridge" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="11 · Digital + physical"
            title="The same world, two surfaces"
            description="The system moves between two lockups without changing its center of gravity. Digital and editorial applications use the orange-O wordmark; symbol-led merchandise and compact physical applications use the hollow ring with plain type. Each object chooses one treatment—never both."
          />
          <figure>
            <EventHorizonApplicationGallery
              items={BRIDGE_APPLICATIONS}
              layout="bridge"
            />
            <Caption>
              Interface and print share type, void fields, and the same orange gravity.
              The engineering story lives in a separate case study.
            </Caption>
          </figure>
          <p className="mt-6">
            <Link
              href="/projects/event-horizon"
              className="inline-flex min-h-11 items-center text-sm font-medium text-[#FF8C2B] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C2B]"
            >
              View the product case study
            </Link>
          </p>
        </section>

        <section id="close" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading
            eyebrow="12 · The final system"
            title="Where nights out gather gravity."
          />
          <EventHorizonApplicationGallery
            items={SYSTEM_APPLICATIONS}
            layout="system"
          />
        </section>

        <section id="reflection" className="scroll-mt-[var(--scroll-mt)]">
          <SectionHeading eyebrow="13 · What I learned" title="A brand is useful when it can adapt" />
          <p className="max-w-3xl text-sm leading-relaxed text-[#D4CDC6] sm:text-base">
            Extending an existing product identity is different from designing from zero.
            Physical applications exposed spacing problems screens hid, and the system got
            stronger when the mark could recede.
          </p>
          <blockquote className="mt-8 max-w-3xl border-l-2 border-[#FF8C2B] pl-5 font-display text-xl leading-relaxed text-[#F4F0EB] sm:text-2xl">
            Event Horizon taught me that a brand system becomes useful when it can adapt
            without losing recognition. The strongest applications were not the ones with
            the largest logo, but the ones that used the same type, contrast, rhythm, and
            visual gravity in ways appropriate to the object.
          </blockquote>
        </section>

        <CaseStudyFooterNav
          prev={{ href: "/projects/signal-magazine", label: "Signal Magazine" }}
          next={{ href: "/projects/voltline", label: "Voltline" }}
          seriesLabel="Design series 1 / 4"
          accent={ACCENT}
        />
      </div>
    </article>
  );
}
