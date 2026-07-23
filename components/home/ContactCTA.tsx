"use client";

import { useId, useState } from "react";
import { CheckCircle2, Loader2, Mail, FileText, Send } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { Reveal } from "@/components/shared/Reveal";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type FormStatus = "idle" | "submitting" | "sent" | "error";
type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

const fieldClass =
  "w-full rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.03] px-3 py-2.5 text-text outline-none transition duration-[var(--duration-fast)] focus:border-primary/40 focus:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-primary/50 aria-[invalid=true]:border-rose-400/50";

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    // Placeholder latency — swap for real backend later
    await new Promise((r) => setTimeout(r, 650));
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
        description="Open to thoughtful collaborations, systems work, and product builds."
      />

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <div className="glass space-y-4 rounded-[var(--radius)] p-6">
            <a
              href={`mailto:${SITE.email}`}
              className="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-muted transition duration-[var(--duration-fast)] hover:bg-white/5 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Mail className="size-4 shrink-0" aria-hidden />
              {SITE.email}
            </a>
            <a
              href={SITE.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-muted transition duration-[var(--duration-fast)] hover:bg-white/5 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <LinkedinIcon className="size-4 shrink-0" />
              LinkedIn
            </a>
            <a
              href={SITE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-muted transition duration-[var(--duration-fast)] hover:bg-white/5 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <GithubIcon className="size-4 shrink-0" />
              GitHub
            </a>
            <Button href={SITE.resume} external variant="outline" className="mt-2">
              <FileText className="size-4" aria-hidden />
              Resume
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <form
            onSubmit={handleSubmit}
            className="glass rounded-[var(--radius)] p-6"
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
                <span className="mb-1.5 block text-muted transition-colors group-focus-within/field:text-secondary">
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
                <span className="mb-1.5 block text-muted transition-colors group-focus-within/field:text-secondary">
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
              <span className="mb-1.5 block text-muted transition-colors group-focus-within/field:text-secondary">
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
                {status === "submitting" ? "Sending…" : "Send Message"}
              </Button>
              {status === "sent" ? (
                <p
                  id={`${formId}-success`}
                  className="inline-flex items-center gap-2 text-sm text-secondary"
                  role="status"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-300" aria-hidden />
                  Message queued — wire this to your form backend later.
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
