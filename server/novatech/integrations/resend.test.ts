import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { sendInquiryEmails } from "@/server/novatech/integrations/resend";
import { EmailError } from "@/server/novatech/errors";
import type { NormalizedInquiry } from "@/server/novatech/mappers/inquiryMapper";

const inquiry: NormalizedInquiry = {
  name: "Alex <script>Morgan</script>",
  firstName: "Alex",
  lastName: "<script>Morgan</script>",
  businessEmail: "alex@example.com",
  phone: "555-0100",
  company: "Northwind & Co",
  jobTitle: "Ops",
  selectedService: "cybersecurity",
  serviceLabel: "Cybersecurity",
  companySize: "11-50",
  companySizeLabel: "11–50 employees",
  currentEnvironment: "M365",
  urgency: "planning",
  urgencyLabel: "Planning / exploring",
  preferredContactMethod: "email",
  preferredContactLabel: "Email",
  message: '<img src=x onerror=alert(1)> Need help',
  consent: true,
  submissionId: "11111111-1111-4111-8111-111111111111",
  turnstileToken: "token",
  submittedAt: "2026-07-31T00:00:00.000Z",
};

describe("NovaTech Resend integration", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    process.env.HUBSPOT_ACCESS_TOKEN = "token";
    process.env.HUBSPOT_PIPELINE_ID = "default";
    process.env.HUBSPOT_DEAL_STAGE_ID = "stage";
    process.env.RESEND_API_KEY = "re_test";
    process.env.NOVATECH_FROM_EMAIL = "onboarding@resend.dev";
    process.env.NOVATECH_STAFF_EMAIL = "owner@example.com";
    process.env.TURNSTILE_SECRET_KEY = "ts";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    sendMock.mockReset();
  });

  afterEach(() => {
    process.env = env;
  });

  it("sends visitor and staff emails with escaped content", async () => {
    sendMock.mockResolvedValue({ data: { id: "email-1" }, error: null });

    const result = await sendInquiryEmails(
      inquiry,
      {
        contactId: "c1",
        dealId: "d1",
        contactCreated: true,
      },
      {
        requestId: "11111111-1111-4111-8111-111111111111",
        submissionId: inquiry.submissionId,
      },
    );

    expect(result).toEqual({ visitorSent: true, staffSent: true });
    expect(sendMock).toHaveBeenCalledTimes(2);

    const visitorHtml = sendMock.mock.calls[0][0].html as string;
    const staffHtml = sendMock.mock.calls[1][0].html as string;
    expect(visitorHtml).toContain("Cybersecurity");
    expect(staffHtml).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(staffHtml).not.toContain("<img src=x");
    expect(staffHtml).toContain("Northwind &amp; Co");
    expect(sendMock.mock.calls[1][0].replyTo).toBe("alex@example.com");
  });

  it("returns partial success when only one email fails", async () => {
    sendMock
      .mockResolvedValueOnce({ data: { id: "v" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } });

    const result = await sendInquiryEmails(
      inquiry,
      {
        contactId: "c1",
        dealId: "d1",
        contactCreated: true,
      },
      {
        requestId: "11111111-1111-4111-8111-111111111111",
        submissionId: inquiry.submissionId,
      },
    );
    expect(result.visitorSent).toBe(true);
    expect(result.staffSent).toBe(false);
  });

  it("throws EmailError when both emails fail", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(
      sendInquiryEmails(
        inquiry,
        {
          contactId: "c1",
          dealId: "d1",
          contactCreated: true,
        },
        {
          requestId: "11111111-1111-4111-8111-111111111111",
          submissionId: inquiry.submissionId,
        },
      ),
    ).rejects.toBeInstanceOf(EmailError);
  });
});
