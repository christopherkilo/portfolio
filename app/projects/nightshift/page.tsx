import type { Metadata } from "next";
import { NightshiftCaseStudy } from "@/components/projects/nightshift/NightshiftCaseStudy";
import { NIGHTSHIFT } from "@/lib/nightshift/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "NightShift — Integrated Campaign Case Study",
  description: `${NIGHTSHIFT.tagline} An integrated campaign for a nighttime festival combining art, technology, music, and immersive media.`,
  path: "/projects/nightshift",
  images: [
    {
      url: "/projects/nightshift/cover.svg",
      width: 1200,
      height: 750,
      alt: "NightShift festival campaign cover",
    },
  ],
});

export default function NightshiftPage() {
  return <NightshiftCaseStudy />;
}
