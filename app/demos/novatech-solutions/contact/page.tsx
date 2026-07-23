import type { Metadata } from "next";
import { ContactForm } from "@/components/demos/novatech/home/ContactForm";
import { SITE } from "@/lib/demos/novatech/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: `Fictional ${SITE.name} inquiry form demo.`,
};

export default function ContactPage() {
  return (
    <div className="pt-4">
      <ContactForm />
    </div>
  );
}
