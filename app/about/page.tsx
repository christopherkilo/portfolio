import type { Metadata } from "next";
import Image from "next/image";
import { Code2, Cpu, Palette } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ROLES, SITE } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE.name} — developer, designer, and IT professional.`,
};

const icons = {
  Code2,
  Palette,
  Cpu,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="About"
        title={`Meet ${SITE.name}`}
        description="Placeholder biography for an experienced builder who moves fluidly between code, craft, and infrastructure."
      />

      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <figure className="mx-auto w-full max-w-sm lg:mx-0">
          <div className="gradient-border relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/8 bg-white/[0.03] backdrop-blur-xl">
            <Image
              src="/about/portrait-placeholder.svg"
              alt={`Portrait placeholder for ${SITE.name}`}
              fill
              sizes="(max-width: 1024px) 320px, 360px"
              className="object-cover"
              priority
              unoptimized
            />
          </div>
          <figcaption className="mt-3 text-center text-xs tracking-[0.16em] text-muted uppercase lg:text-left">
            Photo coming soon
          </figcaption>
        </figure>

        <div className="space-y-8">
          <div className="space-y-5 text-base leading-relaxed text-muted">
            <p>
              I design and ship interfaces that feel calm under complexity—
              pairing strong TypeScript foundations with motion that earns its
              place. When the work calls for it, I step into brand systems and
              visual direction with the same restraint.
            </p>
            <p>
              On the IT side, I diagnose hardware, deploy fleets, and document
              networks so the next person inherits clarity instead of folklore.
              The through-line is craft: careful decisions, readable systems, and
              polish that doesn&apos;t shout.
            </p>
            <p>
              This site uses placeholder copy and assets so real projects,
              credentials, and case studies can drop in with minimal friction.
            </p>
            <Button href="/contact">Start a conversation</Button>
          </div>

          <div className="space-y-4">
            {ROLES.map((role) => {
              const Icon = icons[role.icon];
              return (
                <article
                  key={role.id}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 backdrop-blur-xl"
                >
                  <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-secondary">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h2 className="font-display text-lg font-semibold text-text">
                    {role.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {role.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
