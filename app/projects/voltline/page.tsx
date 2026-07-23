import type { Metadata } from "next";
import { VoltlineCaseStudy } from "@/components/projects/voltline/VoltlineCaseStudy";
import { VOLTLINE } from "@/lib/voltline/content";

export const metadata: Metadata = {
  title: "Voltline — Brand Identity Case Study",
  description: `${VOLTLINE.statement} A complete visual identity system for a premium technology-accessories company.`,
  openGraph: {
    title: "Voltline — Brand Identity Case Study",
    description: VOLTLINE.statement,
    images: [{ url: "/projects/voltline/cover.svg", width: 1200, height: 750, alt: "Voltline brand identity cover" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Voltline — Brand Identity Case Study",
    description: VOLTLINE.statement,
    images: ["/projects/voltline/cover.svg"],
  },
};

export default function VoltlinePage() {
  return <VoltlineCaseStudy />;
}
