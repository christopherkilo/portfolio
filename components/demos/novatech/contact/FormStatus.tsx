"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/demos/novatech/ui/Button";
import { CTA, DEMO_BASE, PORTFOLIO_ITEMS } from "@/lib/demos/novatech/constants";
import {
  consultationContextTitle,
  type InquiryServiceOption,
} from "@/lib/demos/novatech/inquiry";
import { contactHref, serviceHref } from "@/lib/demos/novatech/paths";

type PendingStatusProps = {
  pending: boolean;
};

export function PendingStatus({ pending }: PendingStatusProps) {
  return (
    <p
      className="min-h-5 text-sm text-muted"
      aria-live="polite"
      role="status"
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          Submitting your inquiry…
        </span>
      ) : null}
    </p>
  );
}

type FormErrorSummaryProps = {
  message?: string;
  id?: string;
};

export function FormErrorSummary({
  message,
  id = "inquiry-form-error",
}: FormErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message) ref.current?.focus();
  }, [message]);

  if (!message) {
    return <div className="min-h-0" aria-hidden />;
  }

  return (
    <div
      ref={ref}
      id={id}
      tabIndex={-1}
      role="alert"
      className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="inline-flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{message}</span>
      </span>
    </div>
  );
}

type SubmitFailureProps = {
  message: string;
  onRetry: () => void;
};

export function SubmitFailureBanner({ message, onRetry }: SubmitFailureProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [message]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="rounded-xl border border-error/30 bg-error/10 px-4 py-4 text-sm text-error outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <p className="inline-flex items-start gap-2 font-medium">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        {message}
      </p>
      <div className="mt-3">
        <Button type="button" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  );
}

type InquirySuccessProps = {
  selectedService: InquiryServiceOption;
  emailSent?: boolean;
  onReset: () => void;
};

export function InquirySuccess({
  selectedService,
  emailSent = true,
  onReset,
}: InquirySuccessProps) {
  const ref = useRef<HTMLDivElement>(null);
  const relatedPortfolio = PORTFOLIO_ITEMS.filter(
    (item) =>
      selectedService !== "not-sure" && item.serviceId === selectedService,
  ).slice(0, 2);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      aria-labelledby="inquiry-success-title"
      className="rounded-2xl border border-border bg-surface p-6 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-8"
    >
      <div className="inline-flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="size-6" aria-hidden />
      </div>
      <h2
        id="inquiry-success-title"
        className="mt-4 font-display text-2xl font-semibold text-ink"
      >
        Inquiry received
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
        Thanks — your consultation inquiry was submitted successfully.
        NovaTech Solutions is a fictional portfolio demonstration; there is no
        guaranteed response time from a live MSP team.
      </p>
      {!emailSent ? (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          Your inquiry was received, but the confirmation email could not be
          sent. Your details were still recorded.
        </p>
      ) : null}

      <div className="mt-6 rounded-xl border border-border bg-bg px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Selected focus
        </p>
        <p className="mt-1 font-medium text-ink">
          {consultationContextTitle(selectedService)}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" onClick={onReset}>
          Start another inquiry
        </Button>
        <Button href={DEMO_BASE} variant="outline">
          Return home
        </Button>
        {selectedService !== "not-sure" ? (
          <Button href={serviceHref(selectedService)} variant="ghost">
            Review {consultationContextTitle(selectedService).replace(
              " consultation",
              "",
            )}
          </Button>
        ) : (
          <Button href={`${DEMO_BASE}/services`} variant="ghost">
            {CTA.exploreServices}
          </Button>
        )}
      </div>

      {relatedPortfolio.length ? (
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-sm font-semibold text-ink">
            Related illustrative work
          </p>
          <ul className="mt-3 space-y-2">
            {relatedPortfolio.map((item) => (
              <li key={item.id}>
                <Link
                  href={`${DEMO_BASE}/portfolio?category=${encodeURIComponent(item.category)}`}
                  className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-8 border-t border-border pt-6">
          <Link
            href={`${DEMO_BASE}/portfolio`}
            className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {CTA.viewWork}
          </Link>
        </div>
      )}

      <p className="mt-6 text-xs text-muted">
        Want to try a different service context?{" "}
        <Link
          href={contactHref("cybersecurity")}
          className="font-medium text-primary hover:underline"
        >
          Open with Cybersecurity preselected
        </Link>
        .
      </p>
    </div>
  );
}
