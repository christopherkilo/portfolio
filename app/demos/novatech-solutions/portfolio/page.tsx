import type { Metadata } from "next";
import { SITE } from "@/lib/demos/novatech/constants";
import { PortfolioExplorer } from "@/components/demos/novatech/portfolio/PortfolioExplorer";
import { CtaBand } from "@/components/demos/novatech/home/CtaBand";

export const metadata: Metadata = {
  title: "Portfolio",
  description: `Illustrative ${SITE.name} engagement concepts with category filtering.`,
  robots: { index: false, follow: false },
};

export default function PortfolioPage() {
  return (
    <>
      <PortfolioExplorer />
      <CtaBand
        title="Want a similar engagement framed for your team?"
        description="Request a consultation to discuss which illustrative service path fits your situation."
      />
    </>
  );
}
