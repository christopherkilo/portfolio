const TRUST_SIGNALS = [
  "Certified Processes",
  "Managed IT",
  "Cloud Ready",
  "Security Focused",
  "Business Continuity",
  "Documented Playbooks",
] as const;

/** Subtle enterprise credibility strip — no fake customer logos. */
export function TrustSignals() {
  return (
    <section
      className="border-b border-border bg-surface/80"
      aria-label="Trust signals"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2.5 px-4 py-5 sm:gap-3 sm:px-6 lg:px-8">
        <p className="mr-1 w-full text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted sm:mr-3 sm:w-auto sm:text-left">
          Built for trust
        </p>
        {TRUST_SIGNALS.map((label) => (
          <span
            key={label}
            className="nt-trust-chip rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide"
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
