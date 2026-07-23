"use client";

import { useState } from "react";
import { LoaderCircle, MapPin, Send } from "lucide-react";
import { Button } from "@/components/demos/novatech/ui/Button";
import { SectionHeader } from "@/components/demos/novatech/ui/SectionHeader";
import { Reveal } from "@/components/demos/novatech/shared/Reveal";
import { SITE } from "@/lib/demos/novatech/constants";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "pending" | "success">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const nextErrors: Record<string, string> = {};

    if (!name) nextErrors.name = "Enter your name.";
    if (!email) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!message) nextErrors.message = "Tell us a little about your inquiry.";

    setErrors(nextErrors);
    setStatus("idle");

    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = Object.keys(nextErrors)[0];
      (form.elements.namedItem(firstInvalid) as HTMLElement | null)?.focus();
      return;
    }

    setStatus("pending");
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    form.reset();
    setStatus("success");
  }

  function clearError(field: string) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (status === "success") setStatus("idle");
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Contact"
        title="Let's discuss your technology goals"
        description="Try the inquiry experience with a fictional project brief. This frontend demo validates your entries locally and does not send or store them."
        headingLevel="h1"
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <Reveal>
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm" htmlFor="contact-name">
                <span className="mb-1.5 block font-medium text-ink">
                  Name <span aria-hidden="true">*</span>
                </span>
                <input
                  id="contact-name"
                  name="name"
                  required
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "contact-name-error" : undefined}
                  onChange={() => clearError("name")}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-ink outline-none transition focus:border-accent aria-invalid:border-error"
                  placeholder="Full name"
                />
                {errors.name ? (
                  <span id="contact-name-error" className="mt-1.5 block text-sm text-error">
                    {errors.name}
                  </span>
                ) : null}
              </label>
              <label className="block text-sm" htmlFor="contact-email">
                <span className="mb-1.5 block font-medium text-ink">
                  Email <span aria-hidden="true">*</span>
                </span>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "contact-email-error" : undefined}
                  onChange={() => clearError("email")}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-ink outline-none transition focus:border-accent aria-invalid:border-error"
                  placeholder="you@company.com"
                />
                {errors.email ? (
                  <span id="contact-email-error" className="mt-1.5 block text-sm text-error">
                    {errors.email}
                  </span>
                ) : null}
              </label>
            </div>
            <label className="mt-4 block text-sm" htmlFor="contact-company">
              <span className="mb-1.5 block font-medium text-ink">Company</span>
              <input
                id="contact-company"
                name="company"
                autoComplete="organization"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-ink outline-none transition focus:border-accent"
                placeholder="Company name"
              />
            </label>
            <label className="mt-4 block text-sm" htmlFor="contact-message">
              <span className="mb-1.5 block font-medium text-ink">
                Message <span aria-hidden="true">*</span>
              </span>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "contact-message-error" : undefined}
                onChange={() => clearError("message")}
                className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2.5 text-ink outline-none transition focus:border-accent aria-invalid:border-error"
                placeholder="How can we help?"
              />
              {errors.message ? (
                <span id="contact-message-error" className="mt-1.5 block text-sm text-error">
                  {errors.message}
                </span>
              ) : null}
            </label>
            <div
              className="mt-5 flex flex-wrap items-center gap-3"
              aria-live="polite"
            >
              <Button type="submit" disabled={status === "pending"}>
                {status === "pending" ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
                {status === "pending" ? "Checking inquiry…" : "Try demo inquiry"}
              </Button>
              {status === "success" ? (
                <p className="text-sm text-accent" role="status">
                  Demo complete. Your inquiry was validated locally and was not sent or saved.
                </p>
              ) : null}
            </div>
          </form>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="flex h-full flex-col gap-5">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-ink">
                Demonstration contact profile
              </h2>
              <p className="mt-2 text-sm text-muted">
                The details below are fictional and included to complete the service-business demo.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li>{SITE.address}</li>
                <li>
                  <a className="hover:text-primary" href={`tel:${SITE.phone}`}>
                    {SITE.phone}
                  </a>
                </li>
                <li>
                  <a
                    className="hover:text-primary"
                    href={`mailto:${SITE.email}`}
                  >
                    {SITE.email}
                  </a>
                </li>
                <li>{SITE.hours}</li>
              </ul>
            </div>

            <div
              className="relative flex min-h-[260px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border bg-map"
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
                  Fictional Austin office profile · {SITE.address}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
