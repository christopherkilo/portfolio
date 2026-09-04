import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-black/40 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="max-w-sm">
            <p className="font-display text-lg font-semibold text-text">
              {SITE.name}
              <span className="text-muted">.</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              {SITE.title}
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-2 gap-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center px-2.5 text-sm text-secondary transition hover:text-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/work"
                  className="inline-flex min-h-11 items-center px-2.5 text-sm text-secondary transition hover:text-text"
                >
                  All Work
                </Link>
              </li>
              <li>
                <Link
                  href="/#engineering-lab"
                  className="inline-flex min-h-11 items-center px-2.5 text-sm text-secondary transition hover:text-text"
                >
                  Lab
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{SITE.copyright}</p>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap gap-x-4 gap-y-1 sm:justify-end">
              <a
                href={SITE.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-secondary transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                GitHub
              </a>
              <a
                href={SITE.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-secondary transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                LinkedIn
              </a>
            </div>
            <a
              href={`mailto:${SITE.email}`}
              className="inline-flex min-h-11 max-w-full items-center break-all text-secondary transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {SITE.email}
            </a>
            <p>
              Built with{" "}
              <span className="text-text">Next.js</span>,{" "}
              <span className="text-text">Tailwind</span>, and{" "}
              <span className="text-text">Framer Motion</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
