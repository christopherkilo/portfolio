import { Hero } from "@/components/home/Hero";
import { FeaturedProject } from "@/components/home/FeaturedProject";
import { LatestWriting } from "@/components/home/LatestWriting";
import { AboutPreview } from "@/components/home/AboutPreview";
import { ContactCTA } from "@/components/home/ContactCTA";
import { SITE } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: `${SITE.name} — ${SITE.title}`,
  description: SITE.description,
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProject />
      <LatestWriting />
      <AboutPreview />
      <ContactCTA />
    </>
  );
}
