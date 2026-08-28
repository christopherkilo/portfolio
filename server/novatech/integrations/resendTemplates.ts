import { escapeHtml } from "../mappers/inquiryMapper";
import {
  COMPANY_SIZE_LABELS,
  CONTACT_METHOD_LABELS,
  INQUIRY_SERVICE_LABELS,
  URGENCY_LABELS,
} from "../../../lib/demos/novatech/inquiry/labels";
import type {
  CompanySize,
  InquiryServiceOption,
  InquiryUrgency,
  PreferredContactMethod,
} from "../../../lib/demos/novatech/inquiry/types";

export type CustomerEmailInput = {
  name: string;
  selectedService: InquiryServiceOption;
  appUrl: string;
};

export type StaffEmailInput = {
  name: string;
  visitorEmail: string;
  company: string;
  selectedService: InquiryServiceOption;
  companySize: CompanySize;
  urgency: InquiryUrgency;
  preferredContactMethod: PreferredContactMethod;
  submissionId: string;
  contactId: string;
  dealId: string;
  submittedAt?: string;
  /** Next.js path includes the visitor message. AWS SQS jobs omit it to minimize PII. */
  message?: string;
};

export function firstNameFromFullName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts[0] || "there";
}

export function customerSubject(input: CustomerEmailInput): string {
  return `We received your ${INQUIRY_SERVICE_LABELS[input.selectedService]} inquiry`;
}

export function staffSubject(input: StaffEmailInput): string {
  return `NovaTech inquiry — ${INQUIRY_SERVICE_LABELS[input.selectedService]} — ${input.company}`;
}

export function visitorHtml(input: CustomerEmailInput): string {
  const service = escapeHtml(INQUIRY_SERVICE_LABELS[input.selectedService]);
  const name = escapeHtml(firstNameFromFullName(input.name));
  const link = escapeHtml(`${input.appUrl.replace(/\/$/, "")}/demos/novatech-solutions`);
  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p>Hi ${name},</p>
  <p>Thanks for submitting a consultation inquiry about <strong>${service}</strong>.</p>
  <p>This message confirms that your inquiry was received through the NovaTech Solutions portfolio demonstration. NovaTech is a fictional company used to showcase a production-shaped marketing and inquiry workflow.</p>
  <p>No guaranteed response time is promised for this demonstration. If this environment is configured for staff notifications, the portfolio owner may review the inquiry details.</p>
  <p><a href="${link}">Return to NovaTech Solutions</a></p>
  <p style="color:#555;font-size:12px;">You received this email because an inquiry was submitted with this address.</p>
</body>
</html>`;
}

export function staffHtml(input: StaffEmailInput): string {
  const rows: Array<[string, string]> = [
    ["Name", input.name],
    ["Email", input.visitorEmail],
    ["Company", input.company],
    ["Service", INQUIRY_SERVICE_LABELS[input.selectedService]],
    ["Company size", COMPANY_SIZE_LABELS[input.companySize]],
    ["Urgency", URGENCY_LABELS[input.urgency]],
    ["Preferred contact", CONTACT_METHOD_LABELS[input.preferredContactMethod]],
    ["Submission ID", input.submissionId],
    ["HubSpot contact ID", input.contactId],
    ["HubSpot deal ID", input.dealId],
  ];
  if (input.submittedAt) {
    rows.push(["Submitted at", input.submittedAt]);
  }

  const table = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;vertical-align:top;"><strong>${escapeHtml(label)}</strong></td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const messageBlock = input.message
    ? `
  <h2 style="font-size:16px;margin-top:24px;">Message</h2>
  <pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;background:#f6f6f6;padding:12px;border-radius:8px;">${escapeHtml(input.message)}</pre>`
    : "";

  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <h1 style="font-size:18px;">NovaTech inquiry received</h1>
  <table>${table}</table>${messageBlock}
</body>
</html>`;
}
