import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/demos/novatech/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-footer text-footer-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-display text-xl font-bold">
            <span className="text-footer-accent">Nova</span>Tech Solutions
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-footer-ink/70">
            {SITE.description}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-footer-ink/60">
            Explore
          </p>
          <ul className="mt-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-footer-ink/75 transition hover:text-footer-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-footer-ink/60">
            Demo contact
          </p>
          <ul className="mt-4 space-y-2 text-sm text-footer-ink/75">
            <li>
              <a href={`tel:${SITE.phone}`} className="hover:text-footer-ink">
                {SITE.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="hover:text-footer-ink">
                {SITE.email}
              </a>
            </li>
            <li>{SITE.address}</li>
            <li>{SITE.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-footer-ink/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-footer-ink/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>{SITE.copyright}</p>
          <p>Managed IT · Consulting · Cybersecurity</p>
        </div>
      </div>
    </footer>
  );
}
