import type { Metadata } from "next";
import { ABOUT_STATS, SITE } from "@/lib/demos/novatech/constants";
import { SectionHeader } from "@/components/demos/novatech/ui/SectionHeader";
import { Reveal } from "@/components/demos/novatech/shared/Reveal";
import { Button } from "@/components/demos/novatech/ui/Button";
import { CtaBand } from "@/components/demos/novatech/home/CtaBand";

export const metadata: Metadata = {
  title: "About",
  description: `Explore the fictional ${SITE.name} mission in this frontend portfolio demo.`,
};

export default function AboutPage() {
  return (
    <>
      <section className="gradient-hero border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="About"
            title="A technology partner built on trust"
            description="This fictional company profile shows how NovaTech would help organizations run secure, dependable technology."
            headingLevel="h1"
          />
          <div className="grid gap-8 lg:grid-cols-2">
            <Reveal>
              <div className="space-y-4 text-base leading-relaxed text-muted">
                <p>
                  We operate like an extension of your team: clear priorities,
                  documented systems, and support that feels human.
                </p>
                <p>
                  Our specialists cover infrastructure, cybersecurity, cloud,
                  and modern web presence with practical recommendations and
                  transparent reporting.
                </p>
                <Button href="/demos/novatech-solutions/contact">
                  Talk with our team
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="grid grid-cols-2 gap-4">
                {ABOUT_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
                  >
                    <p className="font-display text-3xl font-bold text-primary">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
