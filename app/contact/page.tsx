import type { Metadata } from "next";
import { ContactCTA } from "@/components/home/ContactCTA";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${SITE.name} — email, LinkedIn, GitHub, and a message form.`,
};

export default function ContactPage() {
  return (
    <div className="pt-8">
      <ContactCTA />
    </div>
  );
}
