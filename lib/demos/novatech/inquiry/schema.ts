import { z } from "zod";
import {
  COMPANY_SIZE_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  INQUIRY_SERVICE_OPTIONS,
  URGENCY_OPTIONS,
  type InquiryFieldErrors,
  type InquiryInput,
  type InquiryValidationResult,
} from "@/lib/demos/novatech/inquiry/types";

const MESSAGE_MIN = 20;
const MESSAGE_MAX = 1200;
const ENVIRONMENT_MAX = 400;

/**
 * Shared Zod schema for NovaTech consultation inquiries.
 * Authoritative contract for the contact form and POST /api/novatech/inquiries.
 */
export const inquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80, "Keep the name under 80 characters."),
  businessEmail: z
    .string()
    .trim()
    .min(1, "Enter a business email address.")
    .email("Enter a valid business email address.")
    .max(120, "Keep the email under 120 characters.")
    .transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .trim()
    .max(40, "Keep the phone number under 40 characters.")
    .refine(
      (value) => value === "" || /^[\d\s()+.-]{7,40}$/.test(value),
      "Enter a valid phone number or leave this field blank.",
    ),
  company: z
    .string()
    .trim()
    .min(1, "Enter your company name.")
    .max(120, "Keep the company name under 120 characters."),
  jobTitle: z
    .string()
    .trim()
    .max(80, "Keep the job title under 80 characters."),
  selectedService: z.enum(INQUIRY_SERVICE_OPTIONS, {
    message: "Choose a service interest.",
  }),
  companySize: z.enum(COMPANY_SIZE_OPTIONS, {
    message: "Choose a company size range.",
  }),
  currentEnvironment: z
    .string()
    .trim()
    .max(ENVIRONMENT_MAX, `Keep this under ${ENVIRONMENT_MAX} characters.`),
  urgency: z.enum(URGENCY_OPTIONS, {
    message: "Choose a timing preference.",
  }),
  preferredContactMethod: z.enum(CONTACT_METHOD_OPTIONS, {
    message: "Choose a preferred contact method.",
  }),
  message: z
    .string()
    .trim()
    .min(
      MESSAGE_MIN,
      `Share a bit more detail (at least ${MESSAGE_MIN} characters).`,
    )
    .max(MESSAGE_MAX, `Keep the message under ${MESSAGE_MAX} characters.`),
  consent: z.literal(true, {
    message: "Confirm you understand how this inquiry will be processed.",
  }),
});

export type InquirySchemaInput = z.infer<typeof inquirySchema>;

/**
 * API request body: inquiry fields + Turnstile token + client submission id.
 * Rejects unknown top-level keys.
 */
export const inquiryApiRequestSchema = inquirySchema
  .extend({
    turnstileToken: z
      .string()
      .trim()
      .min(1, "Please verify that you’re human and try again."),
    submissionId: z
      .string()
      .trim()
      .uuid("A valid submission id is required."),
  })
  .strict();

export type InquiryApiRequest = z.infer<typeof inquiryApiRequestSchema>;

export const MESSAGE_LIMITS = {
  min: MESSAGE_MIN,
  max: MESSAGE_MAX,
} as const;

export const ENVIRONMENT_LIMITS = {
  max: ENVIRONMENT_MAX,
} as const;

const FIELD_ORDER: (keyof InquiryInput)[] = [
  "name",
  "businessEmail",
  "phone",
  "company",
  "jobTitle",
  "selectedService",
  "companySize",
  "currentEnvironment",
  "urgency",
  "preferredContactMethod",
  "message",
  "consent",
];

export function validateInquiry(input: unknown): InquiryValidationResult {
  const parsed = inquirySchema.safeParse(input);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  const errors: InquiryFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) {
      errors[key as keyof InquiryInput] = issue.message;
    }
  }

  const count = Object.keys(errors).length;
  return {
    success: false,
    errors,
    formError:
      count === 1
        ? "Please fix the highlighted field to continue."
        : `Please fix ${count} highlighted fields to continue.`,
  };
}

export function firstInvalidField(
  errors: InquiryFieldErrors,
): keyof InquiryInput | null {
  for (const field of FIELD_ORDER) {
    if (errors[field]) return field;
  }
  return null;
}

export function inquiryFromFormData(formData: FormData): Record<string, unknown> {
  return {
    name: String(formData.get("name") ?? ""),
    businessEmail: String(formData.get("businessEmail") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    company: String(formData.get("company") ?? ""),
    jobTitle: String(formData.get("jobTitle") ?? ""),
    selectedService: String(formData.get("selectedService") ?? ""),
    companySize: String(formData.get("companySize") ?? ""),
    currentEnvironment: String(formData.get("currentEnvironment") ?? ""),
    urgency: String(formData.get("urgency") ?? ""),
    preferredContactMethod: String(
      formData.get("preferredContactMethod") ?? "",
    ),
    message: String(formData.get("message") ?? ""),
    consent: formData.get("consent") === "on" || formData.get("consent") === "true",
  };
}

export function zodIssuesToFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
