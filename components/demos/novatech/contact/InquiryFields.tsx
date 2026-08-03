"use client";

import {
  COMPANY_SIZE_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  INQUIRY_SERVICE_OPTIONS,
  URGENCY_OPTIONS,
  type InquiryFieldErrors,
  type InquiryInput,
  type InquiryServiceOption,
} from "@/lib/demos/novatech/inquiry";
import {
  COMPANY_SIZE_LABELS,
  CONTACT_METHOD_LABELS,
  INQUIRY_SERVICE_LABELS,
  URGENCY_LABELS,
} from "@/lib/demos/novatech/inquiry/labels";
import {
  ENVIRONMENT_LIMITS,
  MESSAGE_LIMITS,
} from "@/lib/demos/novatech/inquiry/schema";
import { cn } from "@/lib/demos/novatech/utils";

const fieldClass =
  "w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-ink outline-none transition focus:border-accent aria-invalid:border-error";

type InquiryFieldsProps = {
  values: InquiryInput;
  errors: InquiryFieldErrors;
  disabled?: boolean;
  onChange: <K extends Exclude<keyof InquiryInput, "selectedService">>(
    field: K,
    value: InquiryInput[K],
  ) => void;
  onServiceChange: (service: InquiryServiceOption) => void;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="mt-1.5 block text-sm text-error">
      {message}
    </span>
  );
}

function Label({
  htmlFor,
  children,
  required,
  optional,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="block text-sm" htmlFor={htmlFor}>
      <span className="mb-1.5 flex flex-wrap items-center gap-2 font-medium text-ink">
        <span>{children}</span>
        {required ? (
          <span className="text-xs font-normal text-muted">
            <span className="sr-only">required</span>
            <span aria-hidden="true">*</span>
          </span>
        ) : null}
        {optional ? (
          <span className="text-xs font-normal text-muted">Optional</span>
        ) : null}
      </span>
    </label>
  );
}

export function InquiryFields({
  values,
  errors,
  disabled,
  onChange,
  onServiceChange,
}: InquiryFieldsProps) {
  return (
    <div className="space-y-6">
      <fieldset disabled={disabled} className="space-y-4">
        <legend className="font-display text-base font-semibold text-ink">
          Contact details
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="inquiry-name" required>
              Full name
            </Label>
            <input
              id="inquiry-name"
              name="name"
              autoComplete="name"
              value={values.name}
              onChange={(e) => onChange("name", e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "inquiry-name-error" : undefined}
              className={fieldClass}
              placeholder="Alex Morgan"
            />
            <FieldError id="inquiry-name-error" message={errors.name} />
          </div>
          <div>
            <Label htmlFor="inquiry-email" required>
              Business email
            </Label>
            <input
              id="inquiry-email"
              name="businessEmail"
              type="email"
              autoComplete="email"
              value={values.businessEmail}
              onChange={(e) => onChange("businessEmail", e.target.value)}
              aria-invalid={Boolean(errors.businessEmail)}
              aria-describedby={
                errors.businessEmail
                  ? "inquiry-email-error inquiry-email-help"
                  : "inquiry-email-help"
              }
              className={fieldClass}
              placeholder="you@company.com"
            />
            <p id="inquiry-email-help" className="mt-1.5 text-xs text-muted">
              Use a work email if you have one—personal emails are fine for this demo.
            </p>
            <FieldError id="inquiry-email-error" message={errors.businessEmail} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="inquiry-phone" optional>
              Phone
            </Label>
            <input
              id="inquiry-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={
                errors.phone ? "inquiry-phone-error inquiry-phone-help" : "inquiry-phone-help"
              }
              className={fieldClass}
              placeholder="(555) 010-2000"
            />
            <p id="inquiry-phone-help" className="mt-1.5 text-xs text-muted">
              Optional. Do not include extension PINs or voicemail codes.
            </p>
            <FieldError id="inquiry-phone-error" message={errors.phone} />
          </div>
          <div>
            <Label htmlFor="inquiry-title" optional>
              Job title
            </Label>
            <input
              id="inquiry-title"
              name="jobTitle"
              autoComplete="organization-title"
              value={values.jobTitle}
              onChange={(e) => onChange("jobTitle", e.target.value)}
              aria-invalid={Boolean(errors.jobTitle)}
              aria-describedby={errors.jobTitle ? "inquiry-title-error" : undefined}
              className={fieldClass}
              placeholder="Operations Manager"
            />
            <FieldError id="inquiry-title-error" message={errors.jobTitle} />
          </div>
        </div>

        <div>
          <Label htmlFor="inquiry-company" required>
            Company
          </Label>
          <input
            id="inquiry-company"
            name="company"
            autoComplete="organization"
            value={values.company}
            onChange={(e) => onChange("company", e.target.value)}
            aria-invalid={Boolean(errors.company)}
            aria-describedby={errors.company ? "inquiry-company-error" : undefined}
            className={fieldClass}
            placeholder="Company name"
          />
          <FieldError id="inquiry-company-error" message={errors.company} />
        </div>
      </fieldset>

      <fieldset disabled={disabled} className="space-y-4">
        <legend className="font-display text-base font-semibold text-ink">
          Engagement context
        </legend>

        <div>
          <Label htmlFor="inquiry-service" required>
            Service interest
          </Label>
          <select
            id="inquiry-service"
            name="selectedService"
            value={values.selectedService}
            onChange={(e) =>
              onServiceChange(e.target.value as InquiryServiceOption)
            }
            aria-invalid={Boolean(errors.selectedService)}
            aria-describedby={
              errors.selectedService
                ? "inquiry-service-error inquiry-service-help"
                : "inquiry-service-help"
            }
            className={fieldClass}
          >
            {INQUIRY_SERVICE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {INQUIRY_SERVICE_LABELS[option]}
              </option>
            ))}
          </select>
          <p id="inquiry-service-help" className="mt-1.5 text-xs text-muted">
            Prefilled from the page you came from when possible. You can change it anytime.
          </p>
          <FieldError
            id="inquiry-service-error"
            message={errors.selectedService}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="inquiry-size" required>
              Company size
            </Label>
            <select
              id="inquiry-size"
              name="companySize"
              value={values.companySize}
              onChange={(e) =>
                onChange(
                  "companySize",
                  e.target.value as InquiryInput["companySize"],
                )
              }
              aria-invalid={Boolean(errors.companySize)}
              aria-describedby={errors.companySize ? "inquiry-size-error" : undefined}
              className={fieldClass}
            >
              {COMPANY_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {COMPANY_SIZE_LABELS[option]}
                </option>
              ))}
            </select>
            <FieldError id="inquiry-size-error" message={errors.companySize} />
          </div>
          <div>
            <Label htmlFor="inquiry-urgency" required>
              Timing
            </Label>
            <select
              id="inquiry-urgency"
              name="urgency"
              value={values.urgency}
              onChange={(e) =>
                onChange("urgency", e.target.value as InquiryInput["urgency"])
              }
              aria-invalid={Boolean(errors.urgency)}
              aria-describedby={errors.urgency ? "inquiry-urgency-error" : undefined}
              className={fieldClass}
            >
              {URGENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {URGENCY_LABELS[option]}
                </option>
              ))}
            </select>
            <FieldError id="inquiry-urgency-error" message={errors.urgency} />
          </div>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink">
            Preferred contact method{" "}
            <span className="text-xs font-normal text-muted">
              <span className="sr-only">required</span>
              <span aria-hidden="true">*</span>
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {CONTACT_METHOD_OPTIONS.map((option) => (
              <label
                key={option}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition focus-within:ring-2 focus-within:ring-accent",
                  values.preferredContactMethod === option
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-bg text-muted hover:text-ink",
                )}
              >
                <input
                  type="radio"
                  name="preferredContactMethod"
                  value={option}
                  checked={values.preferredContactMethod === option}
                  onChange={() => onChange("preferredContactMethod", option)}
                  className="size-3.5 accent-[var(--primary)]"
                />
                {CONTACT_METHOD_LABELS[option]}
              </label>
            ))}
          </div>
          <FieldError
            id="inquiry-method-error"
            message={errors.preferredContactMethod}
          />
        </fieldset>

        <div>
          <Label htmlFor="inquiry-environment" optional>
            Current environment
          </Label>
          <textarea
            id="inquiry-environment"
            name="currentEnvironment"
            rows={3}
            value={values.currentEnvironment}
            onChange={(e) => onChange("currentEnvironment", e.target.value)}
            aria-invalid={Boolean(errors.currentEnvironment)}
            aria-describedby={
              errors.currentEnvironment
                ? "inquiry-environment-error inquiry-environment-help"
                : "inquiry-environment-help"
            }
            className={cn(fieldClass, "resize-y")}
            placeholder="Example: hybrid Microsoft 365, aging on-prem file server, mixed laptops…"
          />
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <p id="inquiry-environment-help">
              High-level only. No passwords, tenant IDs, or security secrets.
            </p>
            <p>
              {values.currentEnvironment.length}/{ENVIRONMENT_LIMITS.max}
            </p>
          </div>
          <FieldError
            id="inquiry-environment-error"
            message={errors.currentEnvironment}
          />
        </div>
      </fieldset>

      <fieldset disabled={disabled} className="space-y-4">
        <legend className="font-display text-base font-semibold text-ink">
          How can NovaTech help?
        </legend>
        <div>
          <Label htmlFor="inquiry-message" required>
            Message
          </Label>
          <textarea
            id="inquiry-message"
            name="message"
            rows={5}
            value={values.message}
            onChange={(e) => onChange("message", e.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={
              errors.message
                ? "inquiry-message-error inquiry-message-help"
                : "inquiry-message-help"
            }
            className={cn(fieldClass, "resize-y")}
            placeholder="What business problem should this consultation explore?"
          />
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <p id="inquiry-message-help">
              Aim for {MESSAGE_LIMITS.min}+ characters. Avoid credentials and confidential data.
            </p>
            <p>
              {values.message.length}/{MESSAGE_LIMITS.max}
            </p>
          </div>
          <FieldError id="inquiry-message-error" message={errors.message} />
        </div>

        <div>
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              id="inquiry-consent"
              name="consent"
              type="checkbox"
              checked={values.consent}
              onChange={(e) => onChange("consent", e.target.checked)}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={
                errors.consent
                  ? "inquiry-consent-error inquiry-consent-help"
                  : "inquiry-consent-help"
              }
              className="mt-1 size-4 rounded border-border accent-[var(--primary)]"
            />
            <span>
              I understand NovaTech Solutions is a fictional portfolio demo and
              that my inquiry details will be processed through the configured
              CRM and email integrations for demonstration purposes.
              <span className="ml-1 text-xs font-normal text-muted">
                <span className="sr-only">required</span>
                <span aria-hidden="true">*</span>
              </span>
            </span>
          </label>
          <p id="inquiry-consent-help" className="mt-1.5 pl-7 text-xs text-muted">
            Required so we can process this inquiry honestly and securely.
          </p>
          <div className="pl-7">
            <FieldError id="inquiry-consent-error" message={errors.consent} />
          </div>
        </div>
      </fieldset>
    </div>
  );
}
