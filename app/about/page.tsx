import type { Metadata } from "next";
import Image from "next/image";
import { Code2, Cpu, Palette } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ROLES, SITE } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: `About ${SITE.name} — software engineer working across full-stack development, cloud / IT, and graphic design.`,
  path: "/about",
});

const icons = {
  Code2,
  Palette,
  Cpu,
};

/** Transparent cutout portrait — keep PNG alpha; no baked-in plate behind it. */
const PORTRAIT_SRC = "/about/portrait.webp";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <SectionHeader
        as="h1"
        eyebrow="About"
        title={`Hi, I'm ${SITE.name}.`}
        description="I'm a software engineer and full-stack developer working across frontend applications, backend systems, cloud infrastructure, IT, and graphic design."
      />

      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <figure className="mx-auto w-full max-w-[min(100%,22rem)] lg:mx-0 lg:max-w-none">
          {/*
            Square frame matches the 1:1 asset. Background stays transparent so
            the PNG alpha reveals the page surface — never a white or black fill.
          */}
          <div className="relative aspect-square overflow-hidden bg-transparent">
            <Image
              src={PORTRAIT_SRC}
              alt={`${SITE.name}, software engineer`}
              fill
              sizes="(max-width: 640px) min(100vw, 22rem), (max-width: 1024px) 320px, 360px"
              className="object-contain object-center"
              priority
            />
          </div>
        </figure>

        <div className="space-y-8">
          <div className="space-y-5 text-base leading-relaxed text-secondary">
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
              Auth.js, AWS, HubSpot, TanStack Query, and modern backend patterns
              centered around security, validation, and collaboration.
            </p>
            <p>
              I&apos;m currently seeking opportunities where I can continue
              growing as a software engineer while contributing to meaningful
              products and learning from experienced engineering teams.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button href="/contact">Contact Me</Button>
              <Button href="/resume" variant="outline">
                View Resume
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
                  <p className="mt-2 text-sm leading-relaxed text-secondary">
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
