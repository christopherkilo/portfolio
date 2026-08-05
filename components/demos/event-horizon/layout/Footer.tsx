import Link from "next/link";
import { EventHorizonLockup } from "@/components/demos/event-horizon/brand/EventHorizonLockup";
import { NAV_LINKS, SITE } from "@/lib/demos/event-horizon/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <EventHorizonLockup size="md" animate={false} className="mb-1" />
            <p className="mt-3 max-w-sm text-sm text-muted">{SITE.description}</p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-4">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="border-t border-border pt-6 text-sm text-muted">
          {SITE.copyright}
        </p>
      </div>
    </footer>
  );
}
