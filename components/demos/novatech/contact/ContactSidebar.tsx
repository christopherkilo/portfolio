import Link from "next/link";
import { Clock3, MapPin, ShieldCheck } from "lucide-react";
import { DEMO_BASE, FAQ_ITEMS, SITE } from "@/lib/demos/novatech/constants";
import { Reveal } from "@/components/demos/novatech/shared/Reveal";

const PROCESS = [
  "Choose a service interest (or “Not sure yet”).",
  "Share business context—no passwords or sensitive secrets.",
  "Complete human verification and submit over HTTPS.",
] as const;

const FAQ_LINKS = FAQ_ITEMS.slice(0, 3);

export function ContactSidebar() {
  return (
    <Reveal delay={0.08}>
      <aside className="flex h-full flex-col gap-5">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Fictional company profile
          </p>
          <h2 className="mt-2 font-display text-lg font-semibold text-ink">
            Demonstration contact details
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Address, phone, and email below are illustrative only. They are not
            monitored and should not be used for real business communication.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>{SITE.address}</li>
            <li>
              <span className="text-ink/80">{SITE.phone}</span>
              <span className="ml-2 text-xs text-muted">(demo)</span>
            </li>
            <li>
              <span className="text-ink/80">{SITE.email}</span>
              <span className="ml-2 text-xs text-muted">(demo)</span>
            </li>
          </ul>
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-bg px-4 py-3">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">Operating hours</p>
              <p className="mt-1 text-sm text-muted">{SITE.hours}</p>
              <p className="mt-1 text-xs text-muted">
                Illustrative schedule for the fictional Austin office profile.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">
            Expected inquiry process
          </h2>
          <ol className="mt-4 space-y-3">
            {PROCESS.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed text-muted">
                <span className="font-mono text-xs text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent-soft px-4 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <p className="text-sm leading-relaxed text-ink">
              Inquiries are validated server-side, checked with Cloudflare
              Turnstile, stored in HubSpot, and acknowledged by email when
              configured. NovaTech remains a fictional portfolio company.
            </p>
          </div>
        </div>

        <div
          className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-map"
          role="img"
          aria-label="Illustrative service area grid for the fictional NovaTech Solutions office"
        >
          <div className="map-grid absolute inset-0 opacity-50" />
          <div className="relative z-10 mx-4 max-w-xs rounded-xl border border-border bg-surface px-4 py-3 text-center shadow-md">
            <MapPin className="mx-auto size-5 text-accent" aria-hidden />
            <p className="mt-2 text-sm font-semibold text-ink">
              Illustrative service area
            </p>
            <p className="mt-1 text-xs text-muted">
              Fictional coverage concept for greater Austin—no live map provider.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">
            Related FAQs
          </h2>
          <ul className="mt-3 space-y-2">
            {FAQ_LINKS.map((item) => (
              <li key={item.id}>
                <Link
                  href={`${DEMO_BASE}/faq#${item.id}`}
                  className="text-sm font-medium text-primary transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {item.question}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={`${DEMO_BASE}/faq`}
            className="mt-4 inline-flex text-sm font-semibold text-ink underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Browse all FAQs
          </Link>
        </div>
      </aside>
    </Reveal>
  );
}
