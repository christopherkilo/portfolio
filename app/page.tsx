import { Hero } from "@/components/home/Hero";
import { FeaturedProject } from "@/components/home/FeaturedProject";
import { AboutPreview } from "@/components/home/AboutPreview";
import { ContactCTA } from "@/components/home/ContactCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProject />
      <AboutPreview />
      <ContactCTA />
    </>
  );
}
