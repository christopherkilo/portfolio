import type { Metadata } from "next";
import { ContactForm } from "@/components/demos/novatech/home/ContactForm";
import { SITE } from "@/lib/demos/novatech/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: `Request a consultation in the fictional ${SITE.name} demo. Entries are validated locally and are not sent or stored.`,
  robots: { index: false, follow: false },
};

export default function ContactPage() {
  return (
    <div className="pt-4">
      <ContactForm />
    </div>
  );
}
