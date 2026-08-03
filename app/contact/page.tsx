import type { Metadata } from "next";
import { ContactCTA } from "@/components/home/ContactCTA";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${SITE.name} at ${SITE.email} — collaborations, product builds, and software roles.`,
};

export default function ContactPage() {
  return (
    <div className="pt-8">
      <ContactCTA />
    </div>
  );
}
