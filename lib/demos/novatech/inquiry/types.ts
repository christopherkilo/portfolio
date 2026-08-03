/**
 * NovaTech consultation inquiry — shared frontend types.
 * Designed so the API Route Handler accepts the same payload shape.
 */

export const INQUIRY_SERVICE_OPTIONS = [
  "managed-it",
  "computer-repair",
  "networking",
  "cybersecurity",
  "website-development",
  "cloud-solutions",
  "not-sure",
] as const;

export type InquiryServiceOption = (typeof INQUIRY_SERVICE_OPTIONS)[number];

export const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
] as const;

export type CompanySize = (typeof COMPANY_SIZE_OPTIONS)[number];

export const URGENCY_OPTIONS = [
  "planning",
  "within-90-days",
  "within-30-days",
  "urgent",
] as const;

export type InquiryUrgency = (typeof URGENCY_OPTIONS)[number];

export const CONTACT_METHOD_OPTIONS = [
  "email",
  "phone",
  "either",
] as const;

export type PreferredContactMethod = (typeof CONTACT_METHOD_OPTIONS)[number];

export type InquiryInput = {
  name: string;
  businessEmail: string;
  phone: string;
  company: string;
  jobTitle: string;
  selectedService: InquiryServiceOption;
  companySize: CompanySize;
  currentEnvironment: string;
  urgency: InquiryUrgency;
  preferredContactMethod: PreferredContactMethod;
  message: string;
  consent: boolean;
};

export type InquiryFieldErrors = Partial<Record<keyof InquiryInput, string>>;

export type InquiryValidationSuccess = {
  success: true;
  data: InquiryInput;
};

export type InquiryValidationFailure = {
  success: false;
  errors: InquiryFieldErrors;
  formError: string;
};

export type InquiryValidationResult =
  | InquiryValidationSuccess
  | InquiryValidationFailure;

export type InquirySubmitSuccess = {
  ok: true;
  selectedService: InquiryServiceOption;
  inquiryId: string;
  emailSent: boolean;
};

export type InquirySubmitFailure = {
  ok: false;
  message: string;
  retryable: boolean;
  code?: string;
  fieldErrors?: InquiryFieldErrors;
};

export type InquirySubmitResult = InquirySubmitSuccess | InquirySubmitFailure;

export type SubmitInquiryOptions = {
  /** Cloudflare Turnstile response token (required for live submission). */
  turnstileToken?: string;
  /** Client-generated UUID for duplicate protection. */
  submissionId?: string;
  /**
   * Development-only: skip the network call and return a retryable failure.
   * Ignored in production builds.
   */
  forceFailure?: boolean;
  /** Test harness latency override (ms). Ignored for live submissions. */
  delayMs?: number;
};
