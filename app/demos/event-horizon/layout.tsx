import type { Metadata } from "next";
import { DemoShell } from "@/components/demos/DemoShell";
import { Providers } from "@/components/demos/event-horizon/layout/Providers";
import "../demos.css";

export const metadata: Metadata = {
  title: "Event Horizon Demo",
  description:
    "Interactive Event Horizon demo — search, filter, and explore fictional events.",
  robots: { index: false, follow: false },
};

export default function EventHorizonDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoShell
      projectTitle="Event Horizon"
      caseStudyHref="/projects/event-horizon"
      notice="Interactive frontend demo with fictional event listings."
    >
      <div data-demo="event-horizon" className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </div>
    </DemoShell>
  );
}
