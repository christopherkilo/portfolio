import {
  VERIFICATION_CATEGORY_LABELS,
  type ProjectVerification,
} from "@/lib/case-studies/types";
import { cn } from "@/lib/utils";

type BuiltNotMockedProps = {
  verification: ProjectVerification;
  className?: string;
};

export function BuiltNotMocked({ verification, className }: BuiltNotMockedProps) {
  const items = verification.items.filter((item) => item.detail.trim().length > 0);
  const artifactReceipts = (verification.receipts ?? []).filter(
    (item) => item.label.trim().length > 0 && item.href.trim().length > 0,
  );
  const limitations = (verification.limitations ?? []).filter((item) =>
    item.trim().length > 0,
  );

  if (!items.length && !artifactReceipts.length) return null;

  return (
    <section
      className={cn("mb-12", className)}
      aria-labelledby="built-not-mocked-heading"
    >
      <div className="mb-5 max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] label-accent">
          Verification
        </p>
        <h2
          id="built-not-mocked-heading"
          className="mt-2 font-display text-2xl font-semibold text-text"
        >
          Built, not mocked.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          What was deployed, executed, or observed.
        </p>
      </div>

      {items.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((item, index) => (
            <li
              key={`${item.category}-${index}`}
              className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 backdrop-blur-xl transition hover:border-white/14"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] label-accent">
                {VERIFICATION_CATEGORY_LABELS[item.category]}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-secondary">{item.detail}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {artifactReceipts.length ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 backdrop-blur-xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Artifacts
          </p>
          <ul className="mt-3 space-y-2">
            {artifactReceipts.map((receipt) => (
              <li key={receipt.href}>
                <a
                  href={receipt.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm leading-relaxed text-secondary transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {receipt.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {limitations.length ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-black/25 px-4 py-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Known limits
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {limitations.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-secondary">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
