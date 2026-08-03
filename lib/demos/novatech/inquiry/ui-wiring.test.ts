import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("NovaTech consultation form wiring", () => {
  it("uses the API submission adapter instead of an inline timeout", () => {
    const form = read("components/demos/novatech/home/ContactForm.tsx");
    expect(form).toContain("submitInquiry");
    expect(form).toContain("validateInquiry");
    expect(form).toContain("InquirySuccess");
    expect(form).toContain("SubmitFailureBanner");
    expect(form).toContain("TurnstileField");
    expect(form).toContain("turnstileToken");
    expect(form).not.toContain("window.setTimeout");
  });

  it("preserves URL service preselection and not-sure fallback", () => {
    const form = read("components/demos/novatech/home/ContactForm.tsx");
    const paths = read("lib/demos/novatech/paths.ts");
    expect(form).toContain("resolveInquiryServiceParam");
    expect(form).toContain("consultationContextTitle");
    expect(paths).toContain('return "not-sure"');
  });

  it("keeps accessibility hooks on inquiry fields", () => {
    const fields = read(
      "components/demos/novatech/contact/InquiryFields.tsx",
    );
    expect(fields).toContain("aria-invalid");
    expect(fields).toContain("aria-describedby");
    expect(fields).toContain('type="checkbox"');
    expect(fields).toContain('type="radio"');
    expect(fields).toContain("htmlFor");
  });

  it("renders a polished success state for real submissions", () => {
    const status = read("components/demos/novatech/contact/FormStatus.tsx");
    expect(status).toContain("Inquiry received");
    expect(status).toContain("emailSent");
    expect(status).toContain("confirmation email could not be");
    expect(status).toContain("Start another inquiry");
    expect(status).not.toContain("Demo inquiry validated");
    expect(status).not.toContain("not sent or stored");
    expect(status).not.toContain("ticket #");
  });

  it("posts to the NovaTech inquiries API and avoids logging payloads", () => {
    const adapter = read("lib/demos/novatech/inquiry/submitInquiry.ts");
    expect(adapter).toContain('/api/novatech/inquiries');
    expect(adapter).toContain("does not log inquiry payloads");
    expect(adapter).toContain("forceFailure");
    expect(adapter).toContain("turnstileToken");
    expect(adapter).toContain("submissionId");
  });

  it("exposes development-only failure helpers without a UI toggle", () => {
    const helper = read("lib/demos/novatech/inquiry/demoResult.ts");
    const form = read("components/demos/novatech/home/ContactForm.tsx");
    expect(helper).toContain("NEXT_PUBLIC_NOVATECH_DEMO_RESULT");
    expect(helper).toContain('demoResultParam === "failure"');
    expect(helper).toContain('NODE_ENV === "production"');
    expect(form).toContain("shouldForceDemoInquiryFailure");
    expect(form).not.toContain("Force demo failure");
  });
});
