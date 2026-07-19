import { Hero } from "@/components/home/Hero";
import { FeaturedProject } from "@/components/home/FeaturedProject";
import { ProjectSection } from "@/components/home/ProjectSection";
import { AboutPreview } from "@/components/home/AboutPreview";
import { TechnicalLabPreview } from "@/components/home/TechnicalLabPreview";
import { ContactCTA } from "@/components/home/ContactCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProject />
      <div id="projects">
        <ProjectSection category="web" />
        <ProjectSection category="design" />
        <ProjectSection category="it" />
      </div>
      <TechnicalLabPreview />
      <AboutPreview />
      <ContactCTA />
    </>
  );
}
