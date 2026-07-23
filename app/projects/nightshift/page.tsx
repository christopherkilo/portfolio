import type { Metadata } from "next";
import { NightshiftCaseStudy } from "@/components/projects/nightshift/NightshiftCaseStudy";
import { NIGHTSHIFT } from "@/lib/nightshift/content";

export const metadata: Metadata = {
  title: "NightShift — Integrated Campaign Case Study",
  description: `${NIGHTSHIFT.tagline} An integrated campaign for a nighttime festival combining art, technology, music, and immersive media.`,
  openGraph: {
    title: "NightShift — Integrated Campaign Case Study",
    description: `${NIGHTSHIFT.tagline} Integrated campaign case study.`,
    images: [
      {
        url: "/projects/nightshift/cover.svg",
        width: 1200,
        height: 750,
        alt: "NightShift festival campaign cover",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NightShift — Integrated Campaign Case Study",
    description: NIGHTSHIFT.tagline,
    images: ["/projects/nightshift/cover.svg"],
  },
};

export default function NightshiftPage() {
  return <NightshiftCaseStudy />;
}
