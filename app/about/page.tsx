import type { Metadata } from "next";
import { AboutPage } from "@/components/about/AboutPage";
import { SITE } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: `About ${SITE.name} — software engineer working across full-stack development, cloud / IT, and graphic design.`,
  path: "/about",
});

export default function AboutRoute() {
  return <AboutPage />;
}
