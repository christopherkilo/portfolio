import "server-only";

import type { InquiryApiRequest } from "@/lib/demos/novatech/inquiry/schema";
import {
  COMPANY_SIZE_LABELS,
  CONTACT_METHOD_LABELS,
  INQUIRY_SERVICE_LABELS,
  URGENCY_LABELS,
} from "@/lib/demos/novatech/inquiry/labels";

export type NormalizedInquiry = {
  name: string;
  firstName: string;
  lastName: string;
  businessEmail: string;
  phone?: string;
  company: string;
  jobTitle?: string;
  selectedService: InquiryApiRequest["selectedService"];
  serviceLabel: string;
  companySize: InquiryApiRequest["companySize"];
  companySizeLabel: string;
  currentEnvironment?: string;
  urgency: InquiryApiRequest["urgency"];
  urgencyLabel: string;
  preferredContactMethod: InquiryApiRequest["preferredContactMethod"];
  preferredContactLabel: string;
  message: string;
  consent: true;
  submissionId: string;
  turnstileToken: string;
  submittedAt: string;
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Unknown", lastName: "Visitor" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "Visitor" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/** Normalize validated API input for CRM + email (no provider IDs from client). */
export function mapInquiryForBackend(
  input: InquiryApiRequest,
  submittedAt = new Date().toISOString(),
): NormalizedInquiry {
  const { firstName, lastName } = splitName(input.name);
  return {
    name: input.name.trim(),
    firstName,
    lastName,
    businessEmail: input.businessEmail.trim().toLowerCase(),
    phone: emptyToUndefined(input.phone),
    company: input.company.trim(),
    jobTitle: emptyToUndefined(input.jobTitle),
    selectedService: input.selectedService,
    serviceLabel: INQUIRY_SERVICE_LABELS[input.selectedService],
    companySize: input.companySize,
    companySizeLabel: COMPANY_SIZE_LABELS[input.companySize],
    currentEnvironment: emptyToUndefined(input.currentEnvironment),
    urgency: input.urgency,
    urgencyLabel: URGENCY_LABELS[input.urgency],
    preferredContactMethod: input.preferredContactMethod,
    preferredContactLabel: CONTACT_METHOD_LABELS[input.preferredContactMethod],
    message: input.message.trim(),
    consent: true,
    submissionId: input.submissionId,
    turnstileToken: input.turnstileToken,
    submittedAt,
  };
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildDealName(inquiry: NormalizedInquiry): string {
  return `NovaTech Inquiry — ${inquiry.serviceLabel} — ${inquiry.company}`;
}

export function buildCrmNoteBody(inquiry: NormalizedInquiry): string {
  const lines = [
    "NovaTech Solutions consultation inquiry",
    `Submission ID: ${inquiry.submissionId}`,
    `Submitted at (UTC): ${inquiry.submittedAt}`,
    "",
    `Service: ${inquiry.serviceLabel}`,
    `Company size: ${inquiry.companySizeLabel}`,
    `Urgency: ${inquiry.urgencyLabel}`,
    `Preferred contact: ${inquiry.preferredContactLabel}`,
    `Current environment: ${inquiry.currentEnvironment ?? "(not provided)"}`,
    "",
    "Visitor message:",
    inquiry.message,
  ];
  return lines.join("\n");
}
