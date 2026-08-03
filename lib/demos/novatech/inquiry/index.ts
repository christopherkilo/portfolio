export type {
  CompanySize,
  InquiryFieldErrors,
  InquiryInput,
  InquiryServiceOption,
  InquirySubmitFailure,
  InquirySubmitResult,
  InquirySubmitSuccess,
  InquiryUrgency,
  InquiryValidationFailure,
  InquiryValidationResult,
  InquiryValidationSuccess,
  PreferredContactMethod,
  SubmitInquiryOptions,
} from "@/lib/demos/novatech/inquiry/types";

export {
  COMPANY_SIZE_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  INQUIRY_SERVICE_OPTIONS,
  URGENCY_OPTIONS,
} from "@/lib/demos/novatech/inquiry/types";

export {
  ENVIRONMENT_LIMITS,
  MESSAGE_LIMITS,
  firstInvalidField,
  inquiryApiRequestSchema,
  inquiryFromFormData,
  inquirySchema,
  validateInquiry,
  zodIssuesToFieldErrors,
} from "@/lib/demos/novatech/inquiry/schema";
export type { InquiryApiRequest, InquirySchemaInput } from "@/lib/demos/novatech/inquiry/schema";

export type {
  InquiryApiErrorBody,
  InquiryApiResponse,
  InquiryApiSuccess,
  InquiryApiSuccessData,
} from "@/lib/demos/novatech/inquiry/apiContract";

export { submitInquiry } from "@/lib/demos/novatech/inquiry/submitInquiry";

export { shouldForceDemoInquiryFailure } from "@/lib/demos/novatech/inquiry/demoResult";
export type { DemoResultEnv } from "@/lib/demos/novatech/inquiry/demoResult";

export {
  COMPANY_SIZE_LABELS,
  CONTACT_METHOD_LABELS,
  INQUIRY_SERVICE_LABELS,
  URGENCY_LABELS,
  consultationContextTitle,
  inquiryServiceLabel,
} from "@/lib/demos/novatech/inquiry/labels";
