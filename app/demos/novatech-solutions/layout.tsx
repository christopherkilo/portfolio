import type { Metadata } from "next";
import { DemoShell } from "@/components/demos/DemoShell";
import { SiteShell } from "@/components/demos/novatech/layout/SiteShell";
import "../demos.css";

export const metadata: Metadata = {
  title: {
    default: "NovaTech Solutions Demo",
    template: "%s · NovaTech Solutions Demo",
  },
  description:
    "Fictional managed IT marketing demo for NovaTech Solutions — illustrative services, portfolio concepts, and a frontend consultation inquiry.",
  robots: { index: false, follow: false },
};

export default function NovaTechDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoShell
      projectTitle="NovaTech Solutions"
      caseStudyHref="/projects/novatech-solutions"
      notice="Fictional company website demo — illustrative content only."
    >
      <div data-demo="novatech" className="flex min-h-full flex-col">
        <SiteShell>{children}</SiteShell>
      </div>
    </DemoShell>
  );
}
