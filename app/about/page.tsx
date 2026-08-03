import type { Metadata } from "next";
import Image from "next/image";
import { Code2, Cpu, Palette } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ROLES, SITE } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { isSvgImageSrc } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE.name} — full-stack developer with a background in IT and web design.`,
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
        title={`Hi, I'm ${SITE.name}.`}
        description="Full-stack developer with a background in IT and web design, focused on software that solves practical problems."
      />

      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <figure className="mx-auto w-full max-w-sm lg:mx-0">
          <div className="gradient-border relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/8 bg-white/[0.03] backdrop-blur-xl">
            <Image
              src="/about/portrait-placeholder.svg"
              alt={`${SITE.name}`}
              fill
              sizes="(max-width: 1024px) 320px, 360px"
              className="object-cover"
              priority
              unoptimized={isSvgImageSrc("/about/portrait-placeholder.svg")}
            />
          </div>
        </figure>

        <div className="space-y-8">
          <div className="space-y-5 text-base leading-relaxed text-muted">
            <p>
              My projects range from customer-facing applications and business
              automation platforms to collaborative software and IT utilities.
            </p>
            <p>
              I enjoy designing systems that are maintainable, scalable, and
              focused on delivering a great user experience while being supported
              by solid backend architecture.
            </p>
            <p>
              Throughout these projects I&apos;ve worked with technologies
              including React, Next.js, TypeScript, PostgreSQL, Supabase, Prisma,
              Auth.js, HubSpot, TanStack Query, and modern backend patterns
              centered around security, validation, and collaboration.
            </p>
            <p>
              I&apos;m currently seeking opportunities where I can continue
              growing as a software developer while contributing to meaningful
              products and learning from experienced engineering teams.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button href="/contact">Contact Me</Button>
              <Button href={`mailto:${SITE.email}`} variant="outline">
                {SITE.email}
              </Button>
            </div>
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
