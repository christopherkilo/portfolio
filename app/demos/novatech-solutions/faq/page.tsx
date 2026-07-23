import type { Metadata } from "next";
import { Accordion } from "@/components/demos/novatech/ui/Accordion";
import { SectionHeader } from "@/components/demos/novatech/ui/SectionHeader";
import { CtaBand } from "@/components/demos/novatech/home/CtaBand";
import { SITE } from "@/lib/demos/novatech/constants";

export const metadata: Metadata = {
  title: "FAQ",
  description: `Illustrative FAQ for fictional ${SITE.name}.`,
};

export default function FaqPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="FAQ"
          title="Answers before the kickoff call"
          description="Explore practical answers about support, security, remote work, and onboarding."
          align="center"
          headingLevel="h1"
        />
        <Accordion />
      </section>
      <CtaBand />
    </>
  );
}
