import { Hero } from "@/components/home/Hero";
import { FeaturedProject } from "@/components/home/FeaturedProject";
import { LatestWriting } from "@/components/home/LatestWriting";
import { AboutPreview } from "@/components/home/AboutPreview";
import { ContactCTA } from "@/components/home/ContactCTA";

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
