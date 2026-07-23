import type { Metadata } from "next";
import { SignalCaseStudy } from "@/components/projects/signal/SignalCaseStudy";
import { SIGNAL } from "@/lib/signal/content";

export const metadata: Metadata = {
  title: "Signal Magazine — Editorial Design Case Study",
  description: `${SIGNAL.issue}: ${SIGNAL.theme}. ${SIGNAL.description}`,
  openGraph: {
    title: "Signal Magazine — Editorial Design Case Study",
    description: `${SIGNAL.issue}: ${SIGNAL.theme}. ${SIGNAL.description}`,
    images: [
      {
        url: "/projects/signal-magazine/cover.svg",
        width: 1200,
        height: 750,
        alt: "Signal Magazine Issue 01 cover",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Signal Magazine — Editorial Design Case Study",
    description: `${SIGNAL.issue}: ${SIGNAL.theme}`,
    images: ["/projects/signal-magazine/cover.svg"],
  },
};

export default function SignalMagazinePage() {
  return <SignalCaseStudy />;
}
