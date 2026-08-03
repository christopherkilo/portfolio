import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("NovaTech UI wiring", () => {
  it("makes service cards link to detail pages", () => {
    const source = read("components/demos/novatech/home/ServiceCards.tsx");
    expect(source).toContain("serviceHref(service.id)");
    expect(source).toContain("CTA.learnMore");
    expect(source).not.toContain("aria-label={`${service.title}");
  });

  it("uses consultation CTAs that preserve service context", () => {
    const hero = read("components/demos/novatech/home/Hero.tsx");
    const cta = read("components/demos/novatech/home/CtaBand.tsx");
    const contact = read("components/demos/novatech/home/ContactForm.tsx");
    const constants = read("lib/demos/novatech/constants.ts");
    expect(constants).toContain('primary: "Request a consultation"');
    expect(hero).toContain("CTA.primary");
    expect(cta).toContain("contactHref(serviceId)");
    expect(contact).toContain("resolveInquiryServiceParam");
    expect(contact).toContain('searchParams.get("service")');
    expect(contact).toContain("submitInquiry");
    expect(contact).toContain("validateInquiry");
  });

  it("keeps mobile menu focus and escape behavior", () => {
    const menu = read("components/demos/novatech/layout/MobileMenu.tsx");
    expect(menu).toContain('e.key === "Escape"');
    expect(menu).toContain('role="dialog"');
    expect(menu).toContain("aria-modal");
    expect(menu).toContain("overflow = \"hidden\"");
    expect(menu).toContain("returnFocusTarget?.focus()");
    expect(menu).toContain("CTA.primary");
    expect(menu).toContain('aria-hidden="true"');
    expect(menu).not.toContain('aria-label="Close menu"');
  });

  it("generates static params for service detail routes", () => {
    const page = read(
      "app/demos/novatech-solutions/services/[serviceId]/page.tsx",
    );
    expect(page).toContain("generateStaticParams");
    expect(page).toContain("generateMetadata");
    expect(page).toContain("notFound()");
    expect(page).toContain("Breadcrumbs");
    expect(page).toContain("robots: { index: false, follow: false }");
  });

  it("syncs portfolio filters with the URL and canonicalizes invalid values", () => {
    const explorer = read(
      "components/demos/novatech/portfolio/PortfolioExplorer.tsx",
    );
    expect(explorer).toContain("portfolioHref(category)");
    expect(explorer).toContain("resolvePortfolioCategoryParam");
    expect(explorer).toContain("shouldCanonicalize");
    expect(explorer).toContain("router.replace(portfolioHref(\"all\")");
    expect(explorer).toContain('aria-pressed');
    expect(explorer).toContain("All projects");
  });

  it("uses a layout-preserving contact Suspense skeleton", () => {
    const form = read("components/demos/novatech/home/ContactForm.tsx");
    const skeleton = read(
      "components/demos/novatech/contact/ContactFormSkeleton.tsx",
    );
    expect(form).toContain("ContactFormSkeleton");
    expect(skeleton).toContain('aria-busy="true"');
    expect(skeleton).toContain("sr-only");
    expect(skeleton).toContain("motion-safe:animate-pulse");
    expect(skeleton).toContain("lg:grid-cols-[1.15fr_0.85fr]");
  });

  it("wires development-only demo failure without a visible toggle", () => {
    const form = read("components/demos/novatech/home/ContactForm.tsx");
    expect(form).toContain("shouldForceDemoInquiryFailure");
    expect(form).toContain('searchParams.get("demoResult")');
    expect(form).toContain("forceFailure");
    expect(form).toContain("preserveParams: searchParams");
    expect(form).not.toContain("Force failure");
    expect(form).not.toContain("demo failure toggle");
  });
});
