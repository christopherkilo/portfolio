import type { Metadata } from "next";
import { EventHorizonBrandCaseStudy } from "@/components/projects/event-horizon-brand/EventHorizonBrandCaseStudy";
import { EH_BRAND } from "@/lib/event-horizon-brand/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Event Horizon — Brand Identity Case Study",
  description: `${EH_BRAND.statement} A visual identity and campaign system extending Event Horizon from a digital event-discovery product into tickets, environments, and physical merchandise.`,
  path: "/projects/event-horizon-brand",
  images: [
    {
      url: "/projects/event-horizon-brand/cover-identity.webp",
      width: 1600,
      height: 1000,
      alt: "Event Horizon brand identity with campaign poster, mobile interface, event ticket, and VIP credential",
    },
  ],
});

export default function EventHorizonBrandPage() {
  return <EventHorizonBrandCaseStudy />;
}
