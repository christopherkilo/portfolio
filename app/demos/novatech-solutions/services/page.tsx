import type { Metadata } from "next";
import { ServiceCards } from "@/components/demos/novatech/home/ServiceCards";
import { CtaBand } from "@/components/demos/novatech/home/CtaBand";
import { SITE } from "@/lib/demos/novatech/constants";

export const metadata: Metadata = {
  title: "Services",
  description: `Illustrative ${SITE.name} service offerings.`,
};

export default function ServicesPage() {
  return (
    <>
      <div className="gradient-hero border-b border-border pt-10">
        <ServiceCards headingLevel="h1" />
      </div>
      <CtaBand />
    </>
  );
}
