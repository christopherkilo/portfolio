import type { Metadata } from "next";
import { VoltlineCaseStudy } from "@/components/projects/voltline/VoltlineCaseStudy";
import { VOLTLINE } from "@/lib/voltline/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Voltline — Brand Identity Case Study",
  description: `${VOLTLINE.statement} A complete visual identity system for a premium technology-accessories company.`,
  path: "/projects/voltline",
  images: [{ url: "/projects/voltline/cover.svg", width: 1200, height: 750, alt: "Voltline brand identity cover" }],
});

export default function VoltlinePage() {
  return <VoltlineCaseStudy />;
}
