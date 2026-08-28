"use client";

import { Suspense, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/demos/novatech/ui/Button";
import { SectionHeader } from "@/components/demos/novatech/ui/SectionHeader";
import { Reveal } from "@/components/demos/novatech/shared/Reveal";
import { ContactSidebar } from "@/components/demos/novatech/contact/ContactSidebar";
import { ContactFormSkeleton } from "@/components/demos/novatech/contact/ContactFormSkeleton";
import { InquiryFields } from "@/components/demos/novatech/contact/InquiryFields";
import { TurnstileField } from "@/components/demos/novatech/contact/TurnstileField";
import {
  FormErrorSummary,
  InquirySuccess,
  PendingStatus,
  SubmitFailureBanner,
} from "@/components/demos/novatech/contact/FormStatus";
import { CTA, DEMO_BASE } from "@/lib/demos/novatech/constants";
import {
  consultationContextTitle,
  firstInvalidField,
  shouldForceDemoInquiryFailure,
  submitInquiry,
  validateInquiry,
  type InquiryFieldErrors,
  type InquiryInput,
  type InquiryServiceOption,
} from "@/lib/demos/novatech/inquiry";
import { contactHref, resolveInquiryServiceParam } from "@/lib/demos/novatech/paths";

function createInquiryDefaults(): Omit<InquiryInput, "selectedService"> {
  return {
    name: "",
    businessEmail: "",
    phone: "",
    company: "",
    jobTitle: "",
    companySize: "11-50",
    currentEnvironment: "",
    urgency: "planning",
    preferredContactMethod: "email",
    message: "",
    consent: false,
  };
}

type Phase = "editing" | "pending" | "success" | "failure";

function ContactFormInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const formErrorId = useId();
  const selectedService = resolveInquiryServiceParam(
    searchParams.get("service"),
  );
  const forceFailure = shouldForceDemoInquiryFailure(
    searchParams.get("demoResult"),
  );

  const [draft, setDraft] = useState(createInquiryDefaults);
  const [errors, setErrors] = useState<InquiryFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [phase, setPhase] = useState<Phase>("editing");
  const [failureMessage, setFailureMessage] = useState<string | undefined>();
  const [confirmedService, setConfirmedService] =
    useState<InquiryServiceOption | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);

  const values: InquiryInput = { ...draft, selectedService };

  function updateField<K extends Exclude<keyof InquiryInput, "selectedService">>(
    field: K,
    value: InquiryInput[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setFormError(undefined);
    if (phase === "failure") {
      setPhase("editing");
      setFailureMessage(undefined);
    }
  }

  function syncServiceToUrl(service: InquiryServiceOption) {
    setErrors((current) => {
      if (!current.selectedService) return current;
      const next = { ...current };
      delete next.selectedService;
      return next;
    });
    setFormError(undefined);
    if (phase === "failure") {
      setPhase("editing");
      setFailureMessage(undefined);
    }
    router.replace(contactHref(service, { preserveParams: searchParams }), {
      scroll: false,
    });
  }

  function focusField(field: keyof InquiryInput) {
    const form = formRef.current;
    if (!form) return;
    const element = form.elements.namedItem(field);
    if (element instanceof HTMLElement) element.focus();
  }

  function resetTurnstile() {
    setTurnstileToken(null);
    setTurnstileReset((n) => n + 1);
  }

  async function runSubmit(nextValues: InquiryInput) {
    if (phase === "pending") return;

    const validation = validateInquiry(nextValues);
    if (!validation.success) {
      setErrors(validation.errors);
      setFormError(validation.formError);
      setPhase("editing");
      const first = firstInvalidField(validation.errors);
      if (first) focusField(first);
      return;
    }

    if (!turnstileToken) {
      setFormError("Please verify that you’re human and try again.");
      setPhase("editing");
      return;
    }

    setErrors({});
    setFormError(undefined);
    setFailureMessage(undefined);
    setPhase("pending");

    const submissionId = crypto.randomUUID();
    const result = await submitInquiry(validation.data, {
      turnstileToken,
      submissionId,
      forceFailure,
    });

    if (!result.ok) {
      if (result.fieldErrors) setErrors(result.fieldErrors);
      setPhase("failure");
      setFailureMessage(result.message);
      resetTurnstile();
      return;
    }

    setConfirmedService(result.selectedService);
    setPhase("success");
    resetTurnstile();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSubmit(values);
  }

  function resetForm() {
    setDraft(createInquiryDefaults());
    setErrors({});
    setFormError(undefined);
    setFailureMessage(undefined);
    setConfirmedService(null);
    setPhase("editing");
    resetTurnstile();
    router.replace(
      contactHref(selectedService, { preserveParams: searchParams }),
      { scroll: false },
    );
  }

  const contextTitle = consultationContextTitle(selectedService);
  const showForm = phase !== "success";

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <SectionHeader
        eyebrow="Contact"
        title="Request a consultation"
        description="Share your business context to request a consultation. Submissions are validated, protected with human verification, and delivered through the configured CRM and email integrations."
        headingLevel="h1"
      />

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal>
          {phase === "success" && confirmedService ? (
            <InquirySuccess
              selectedService={confirmedService}
              onReset={resetForm}
            />
          ) : null}

          {showForm ? (
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-7"
              noValidate
              aria-describedby={formError ? formErrorId : undefined}
            >
              <div className="mb-5 rounded-xl border border-info/25 bg-info-soft px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-info">
                  Consultation context
                </p>
                <p className="mt-1 text-sm font-medium text-ink">{contextTitle}</p>
              </div>

              <div className="mb-5 min-h-[3.25rem]">
                {phase === "failure" && failureMessage ? (
                  <SubmitFailureBanner
                    message={failureMessage}
                    onRetry={() => void runSubmit(values)}
                  />
                ) : (
                  <FormErrorSummary id={formErrorId} message={formError} />
                )}
              </div>

              <InquiryFields
                values={values}
                errors={errors}
                disabled={phase === "pending"}
                onChange={updateField}
                onServiceChange={syncServiceToUrl}
              />

              <div className="mt-6">
                <TurnstileField
                  disabled={phase === "pending"}
                  resetSignal={turnstileReset}
                  onTokenChange={setTurnstileToken}
                  onError={(message) => {
                    setFormError(message);
                  }}
                />
              </div>

              <p className="mt-5 text-xs leading-relaxed text-muted">
                Submitted details are used to respond to this inquiry through
                the configured CRM and email tools. NovaTech Solutions remains a
                fictional portfolio demonstration company.
              </p>

              <div className="mt-7 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <PendingStatus pending={phase === "pending"} />
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={phase === "pending"}
                    onClick={resetForm}
                  >
                    Clear form
                  </Button>
                  <Button type="submit" disabled={phase === "pending"}>
                    <Send className="size-4" aria-hidden />
                    {phase === "pending" ? "Submitting…" : CTA.primary}
                  </Button>
                </div>
              </div>
            </form>
          ) : null}
        </Reveal>

        <ContactSidebar />
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        Prefer browsing first?{" "}
        <Link
          href={`${DEMO_BASE}/services`}
          className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {CTA.exploreServices}
        </Link>
      </p>
    </section>
  );
}

export function ContactForm() {
  return (
    <Suspense fallback={<ContactFormSkeleton />}>
      <ContactFormInner />
    </Suspense>
  );
}
