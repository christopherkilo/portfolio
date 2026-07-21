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
          <div className="space-y-4 rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl">
            <a
              href={`mailto:${SITE.email}`}
              className="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-text"
            >
              <Mail className="icon-interactive size-4" aria-hidden />
              {SITE.email}
            </a>
            <a
              href={SITE.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-text"
            >
              <LinkedinIcon className="icon-interactive size-4" />
              LinkedIn
            </a>
            <a
              href={SITE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-text"
            >
              <GithubIcon className="icon-interactive size-4" />
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
            className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="group/field block text-sm">
                <span className="mb-1.5 block text-muted transition-colors group-focus-within/field:text-secondary">
                  Name
                </span>
                <input
                  name="name"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-text outline-none transition focus:border-primary/40 focus:bg-white/[0.05]"
                  placeholder="Your name"
                />
              </label>
              <label className="group/field block text-sm">
                <span className="mb-1.5 block text-muted transition-colors group-focus-within/field:text-secondary">
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-text outline-none transition focus:border-primary/40 focus:bg-white/[0.05]"
                  placeholder="you@example.com"
                />
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
                className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-text outline-none transition focus:border-primary/40 focus:bg-white/[0.05]"
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
