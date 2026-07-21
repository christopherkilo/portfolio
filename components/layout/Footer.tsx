import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="max-w-sm">
            <p className="font-display text-lg font-semibold text-text">
              {SITE.name}
              <span className="text-muted">.</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {SITE.title}
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition hover:text-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{SITE.copyright}</p>
          <p>
            Built with{" "}
            <span className="text-text">Next.js</span>,{" "}
            <span className="text-text">Tailwind</span>, and{" "}
            <span className="text-text">Framer Motion</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
