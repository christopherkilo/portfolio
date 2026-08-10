"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Loader2, Mail, Send } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { Reveal } from "@/components/shared/Reveal";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type FormStatus = "idle" | "submitting" | "sent" | "error";
type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

const fieldClass =
  "w-full min-h-11 rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.03] px-3 py-3 text-base text-text outline-none transition duration-[var(--duration-fast)] placeholder:text-tertiary focus:border-primary/40 focus:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-primary/50 aria-[invalid=true]:border-rose-400/50";

export function ContactCTA() {
  const formId = useId();
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(form: HTMLFormElement): FieldErrors {
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const next: FieldErrors = {};

    if (!name) next.name = "Please enter your name.";
    if (!email) next.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address.";
    }
    if (!message) next.message = "Please include a short message.";
    else if (message.length < 10) {
      next.message = "Message should be at least 10 characters.";
    }

    return next;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      const first = form.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }

    setStatus("submitting");
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const subject = encodeURIComponent(`Portfolio contact from ${name}`);
    const body = encodeURIComponent(`From: ${name} <${email}>\n\n${message}`);
    // Intentional mailto handoff — no contact-form backend.
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
    setStatus("sent");
    form.reset();
  }

  return (
    <section
      id="contact"
      className="mx-auto max-w-6xl scroll-mt-[var(--scroll-mt)] px-4 py-[var(--section-y)] sm:px-6 lg:px-8"
      aria-labelledby={`${formId}-title`}
    >
      <SectionHeader
        id={`${formId}-title`}
        eyebrow="Contact"
        title="Let's build something deliberate"
        description="Whether you're interested in working together, discussing a project, or have an opportunity you'd like to share, I'd be happy to hear from you."
      />

      <p className="mb-8 max-w-2xl text-base leading-relaxed text-secondary">
        Reach me directly at{" "}
        <a
          href={`mailto:${SITE.email}`}
          className="break-all text-text underline decoration-white/20 underline-offset-2 transition hover:decoration-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {SITE.email}
        </a>
        .
      </p>
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <div className="glass space-y-4 rounded-[var(--radius)] p-4 sm:p-6">
            <a
              href={`mailto:${SITE.email}`}
              className="group flex min-h-11 items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-secondary transition duration-[var(--duration-fast)] hover:bg-white/5 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Mail className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 break-all">{SITE.email}</span>
            </a>
            <a
              href={SITE.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-11 items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-secondary transition duration-[var(--duration-fast)] hover:bg-white/5 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <LinkedinIcon className="size-4 shrink-0" />
              LinkedIn
            </a>
            <a
              href={SITE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-11 items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-secondary transition duration-[var(--duration-fast)] hover:bg-white/5 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <GithubIcon className="size-4 shrink-0" />
              GitHub
            </a>
            <Link
              href="/resume"
              className="group flex min-h-11 items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-secondary transition duration-[var(--duration-fast)] hover:bg-white/5 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FileText className="size-4 shrink-0" aria-hidden />
              Resume
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <form
            onSubmit={handleSubmit}
            className="glass rounded-[var(--radius)] p-4 sm:p-6"
            noValidate
            aria-describedby={
              status === "sent"
                ? `${formId}-success`
                : status === "error"
                  ? `${formId}-error`
                  : undefined
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="group/field block text-sm">
                <span className="mb-1.5 block text-secondary transition-colors group-focus-within/field:text-text">
                  Name
                </span>
                <input
                  name="name"
                  autoComplete="name"
                  required
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? `${formId}-name-err` : undefined}
                  className={fieldClass}
                  placeholder="Your name"
                  disabled={status === "submitting"}
                />
                {errors.name ? (
                  <span
                    id={`${formId}-name-err`}
                    className="mt-1.5 block text-xs text-rose-300"
                    role="alert"
                  >
                    {errors.name}
                  </span>
                ) : null}
              </label>
              <label className="group/field block text-sm">
                <span className="mb-1.5 block text-secondary transition-colors group-focus-within/field:text-text">
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? `${formId}-email-err` : undefined}
                  className={fieldClass}
                  placeholder="you@example.com"
                  disabled={status === "submitting"}
                />
                {errors.email ? (
                  <span
                    id={`${formId}-email-err`}
                    className="mt-1.5 block text-xs text-rose-300"
                    role="alert"
                  >
                    {errors.email}
                  </span>
                ) : null}
              </label>
            </div>
            <label className="group/field mt-4 block text-sm">
              <span className="mb-1.5 block text-secondary transition-colors group-focus-within/field:text-text">
                Message
              </span>
              <textarea
                name="message"
                required
                rows={5}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={
                  errors.message ? `${formId}-message-err` : undefined
                }
                className={cn(fieldClass, "resize-y")}
                placeholder="Tell me about the project or problem…"
                disabled={status === "submitting"}
              />
              {errors.message ? (
                <span
                  id={`${formId}-message-err`}
                  className="mt-1.5 block text-xs text-rose-300"
                  role="alert"
                >
                  {errors.message}
                </span>
              ) : null}
            </label>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={status === "submitting"}>
                {status === "submitting" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
                {status === "submitting" ? "Opening…" : "Send via email"}
              </Button>
              {status === "sent" ? (
                <p
                  id={`${formId}-success`}
                  className="flex min-w-0 flex-wrap items-start gap-2 text-sm leading-relaxed text-secondary"
                  role="status"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden />
                  <span className="min-w-0">
                    Your email app should open with this message. If it
                    doesn&apos;t, write me at{" "}
                    <a
                      href={`mailto:${SITE.email}`}
                      className="break-all underline decoration-white/20 underline-offset-2 transition hover:text-text hover:decoration-primary/50"
                    >
                      {SITE.email}
                    </a>
                    .
                  </span>
                </p>
              ) : null}
              {status === "error" && Object.keys(errors).length > 0 ? (
                <p id={`${formId}-error`} className="sr-only" role="alert">
                  Please fix the highlighted fields.
                </p>
              ) : null}
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
