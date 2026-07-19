"use client";

import { useState } from "react";
import { Mail, FileText, Send } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { Reveal } from "@/components/shared/Reveal";
import { SITE } from "@/lib/constants";

export function ContactCTA() {
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sent");
  }

  return (
    <section
      id="contact"
      className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8"
    >
      <SectionHeader
        eyebrow="Contact"
        title="Let's build something deliberate"
        description="Open to thoughtful collaborations, systems work, and product builds. Placeholders ready to swap for real details."
      />

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <div className="space-y-4 rounded-2xl border border-border bg-surface/70 p-6">
            <a
              href={`mailto:${SITE.email}`}
              className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-text"
            >
              <Mail className="size-4 text-secondary" aria-hidden />
              {SITE.email}
            </a>
            <a
              href={SITE.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-text"
            >
              <LinkedinIcon className="size-4 text-secondary" />
              LinkedIn
            </a>
            <a
              href={SITE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-text"
            >
              <GithubIcon className="size-4 text-secondary" />
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
            className="rounded-2xl border border-border bg-surface/70 p-6"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted">Name</span>
                <input
                  name="name"
                  required
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text outline-none transition focus:border-primary/50"
                  placeholder="Your name"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text outline-none transition focus:border-primary/50"
                  placeholder="you@example.com"
                />
              </label>
            </div>
            <label className="mt-4 block text-sm">
              <span className="mb-1.5 block text-muted">Message</span>
              <textarea
                name="message"
                required
                rows={5}
                className="w-full resize-y rounded-xl border border-border bg-bg px-3 py-2.5 text-text outline-none transition focus:border-primary/50"
                placeholder="Tell me about the project or problem…"
              />
            </label>
            <div className="mt-5 flex items-center gap-3">
              <Button type="submit">
                <Send className="size-4" aria-hidden />
                Send message
              </Button>
              {status === "sent" ? (
                <p className="text-sm text-secondary" role="status">
                  Placeholder sent — wire this to your form backend later.
                </p>
              ) : null}
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
