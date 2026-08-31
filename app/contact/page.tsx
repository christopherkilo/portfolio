import type { Metadata } from "next";
import { ContactCTA } from "@/components/home/ContactCTA";
import { SITE } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: `Contact ${SITE.name} at ${SITE.email} — collaborations, product builds, and software roles.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="pt-8">
      <ContactCTA headingAs="h1" />
    </div>
  );
}
