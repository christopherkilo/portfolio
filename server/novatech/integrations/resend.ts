import "server-only";

import { Resend } from "resend";
import { getNovatechServerEnv } from "@/server/novatech/env";
import {
  ConfigurationError,
  EmailError,
} from "@/server/novatech/errors";
import {
  elapsedMs,
  emailDomainOnly,
  logger,
  nowMs,
  type InquiryLogContext,
} from "@/server/novatech/logger";
import {
  escapeHtml,
  type NormalizedInquiry,
} from "@/server/novatech/mappers/inquiryMapper";
import type { HubSpotInquiryResult } from "@/server/novatech/integrations/hubspot";

export type EmailDeliveryResult = {
  visitorSent: boolean;
  staffSent: boolean;
};

export type ResendWorkflowContext = Pick<
  InquiryLogContext,
  "requestId" | "submissionId"
>;

function visitorHtml(inquiry: NormalizedInquiry, appUrl: string): string {
  const service = escapeHtml(inquiry.serviceLabel);
  const name = escapeHtml(inquiry.firstName);
  const link = escapeHtml(`${appUrl}/demos/novatech-solutions`);
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

function staffHtml(
  inquiry: NormalizedInquiry,
  crm: HubSpotInquiryResult,
): string {
  const rows: Array<[string, string]> = [
    ["Name", inquiry.name],
    ["Email", inquiry.businessEmail],
    ["Phone", inquiry.phone ?? "—"],
    ["Company", inquiry.company],
    ["Job title", inquiry.jobTitle ?? "—"],
    ["Service", inquiry.serviceLabel],
    ["Company size", inquiry.companySizeLabel],
    ["Urgency", inquiry.urgencyLabel],
    ["Preferred contact", inquiry.preferredContactLabel],
    ["Environment", inquiry.currentEnvironment ?? "—"],
    ["Submission ID", inquiry.submissionId],
    ["HubSpot contact ID", crm.contactId],
    ["HubSpot deal ID", crm.dealId],
    ["Submitted at", inquiry.submittedAt],
  ];

  const table = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;vertical-align:top;"><strong>${escapeHtml(label)}</strong></td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <h1 style="font-size:18px;">NovaTech inquiry received</h1>
  <table>${table}</table>
  <h2 style="font-size:16px;margin-top:24px;">Message</h2>
  <pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;background:#f6f6f6;padding:12px;border-radius:8px;">${escapeHtml(inquiry.message)}</pre>
</body>
</html>`;
}

/**
 * Send visitor confirmation + staff notification after CRM success.
 */
export async function sendInquiryEmails(
  inquiry: NormalizedInquiry,
  crm: HubSpotInquiryResult,
  context: ResendWorkflowContext,
): Promise<EmailDeliveryResult> {
  const started = nowMs();
  const base = {
    requestId: context.requestId,
    submissionId: context.submissionId,
    integration: "resend" as const,
    selectedService: inquiry.selectedService,
    emailDomain: emailDomainOnly(inquiry.businessEmail),
  };

  let env;
  try {
    env = getNovatechServerEnv();
  } catch {
    logger.error("resend.email.failed", {
      ...base,
      status: "missing_env",
      errorCode: "CONFIGURATION_ERROR",
      durationMs: elapsedMs(started),
    });
    throw new ConfigurationError(undefined, { alreadyLogged: true });
  }

  const resend = new Resend(env.resendApiKey);
  const result: EmailDeliveryResult = {
    visitorSent: false,
    staffSent: false,
  };

  try {
    const visitor = await resend.emails.send({
      from: env.fromEmail,
      to: inquiry.businessEmail,
      subject: `We received your ${inquiry.serviceLabel} inquiry`,
      html: visitorHtml(inquiry, env.appUrl),
      replyTo: env.staffEmail,
    });
    if (visitor.error) {
      logger.warn("resend.email.failed", {
        ...base,
        status: "visitor_failed",
        failureType: "provider_error",
        errorCode: "EMAIL_UNAVAILABLE",
        durationMs: elapsedMs(started),
      });
    } else {
      result.visitorSent = true;
      logger.info("resend.visitor_email.succeeded", {
        ...base,
        durationMs: elapsedMs(started),
      });
    }
  } catch (error) {
    logger.warn("resend.email.failed", {
      ...base,
      status: "visitor_failed",
      failureType: error instanceof Error ? error.name : "unknown",
      errorCode: "EMAIL_UNAVAILABLE",
      durationMs: elapsedMs(started),
    });
  }

  try {
    const staff = await resend.emails.send({
      from: env.fromEmail,
      to: env.staffEmail,
      replyTo: inquiry.businessEmail,
      subject: `NovaTech inquiry — ${inquiry.serviceLabel} — ${inquiry.company}`,
      html: staffHtml(inquiry, crm),
    });
    if (staff.error) {
      logger.warn("resend.email.failed", {
        ...base,
        status: "staff_failed",
        failureType: "provider_error",
        errorCode: "EMAIL_UNAVAILABLE",
        durationMs: elapsedMs(started),
      });
    } else {
      result.staffSent = true;
      logger.info("resend.staff_email.succeeded", {
        ...base,
        durationMs: elapsedMs(started),
      });
    }
  } catch (error) {
    logger.warn("resend.email.failed", {
      ...base,
      status: "staff_failed",
      failureType: error instanceof Error ? error.name : "unknown",
      errorCode: "EMAIL_UNAVAILABLE",
      durationMs: elapsedMs(started),
    });
  }

  if (!result.visitorSent && !result.staffSent) {
    throw new EmailError(undefined, { alreadyLogged: true });
  }

  return result;
}
