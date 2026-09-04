import { getTestimonials } from "@/lib/testimonials";

/**
 * Renders nothing until a verified recommendation exists.
 * Do not populate lib/testimonials.ts with invented quotes.
 */
export function TestimonialsSection() {
  const items = getTestimonials();
  if (!items.length) return null;

  return (
    <section
      id="recommendations"
      className="mx-auto max-w-6xl scroll-mt-[var(--scroll-mt)] px-4 py-[var(--section-y)] sm:px-6 lg:px-8"
      aria-labelledby="recommendations-heading"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] label-accent">
        Recommendations
      </p>
      <h2
        id="recommendations-heading"
        className="mt-2 font-display text-[1.75rem] font-semibold tracking-tight text-text sm:text-3xl"
      >
        What collaborators said
      </h2>
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <li
            key={`${item.author}-${item.quote.slice(0, 24)}`}
            className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl"
          >
            <blockquote className="text-sm leading-relaxed text-secondary">
              <p>“{item.quote}”</p>
              <footer className="mt-4 text-sm text-text">
                <cite className="not-italic font-medium">{item.author}</cite>
                {item.role || item.organization ? (
                  <span className="mt-1 block text-xs text-muted">
                    {[item.role, item.organization].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
              </footer>
            </blockquote>
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center text-xs text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Source
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
