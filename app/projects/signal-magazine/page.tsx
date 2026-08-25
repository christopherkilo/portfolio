import type { Metadata } from "next";
import { SignalCaseStudy } from "@/components/projects/signal/SignalCaseStudy";
import { SIGNAL } from "@/lib/signal/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Signal Magazine — Editorial Design Case Study",
  description: `${SIGNAL.issue}: ${SIGNAL.theme}. ${SIGNAL.description}`,
  path: "/projects/signal-magazine",
  images: [
    {
      url: "/projects/signal-magazine/cover.svg",
      width: 1200,
      height: 750,
      alt: "Signal Magazine Issue 01 cover",
    },
  ],
});

export default function SignalMagazinePage() {
  return <SignalCaseStudy />;
}
