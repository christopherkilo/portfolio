import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getRelatedServices,
  getServiceById,
  getServiceIds,
  resolveInquiryServiceParam,
} from "@/lib/demos/novatech/paths";
import { SERVICES } from "@/lib/demos/novatech/constants";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("NovaTech release quality wiring", () => {
  it("provides branded loading, error, and not-found experiences", () => {
    expect(existsSync(join(root, "app/demos/novatech-solutions/loading.tsx"))).toBe(
      true,
    );
    expect(existsSync(join(root, "app/demos/novatech-solutions/error.tsx"))).toBe(
      true,
    );
    expect(
      existsSync(join(root, "app/demos/novatech-solutions/not-found.tsx")),
    ).toBe(true);

    const notFound = read("app/demos/novatech-solutions/not-found.tsx");
    expect(notFound).toContain("CTA.exploreServices");
    expect(notFound).toContain("CTA.viewWork");
    expect(notFound).toContain("robots");

    const errorPage = read("app/demos/novatech-solutions/error.tsx");
    expect(errorPage).toContain("Retry");
    expect(errorPage).toContain("Return home");
  });

  it("uses a title template and homepage metadata", () => {
    const layout = read("app/demos/novatech-solutions/layout.tsx");
    const home = read("app/demos/novatech-solutions/page.tsx");
    const serviceDetail = read(
      "app/demos/novatech-solutions/services/[serviceId]/page.tsx",
    );
    expect(layout).toContain('template: "%s · NovaTech Solutions Demo"');
    expect(layout).toContain("robots: { index: false, follow: false }");
    expect(home).toContain("export const metadata");
    expect(serviceDetail).toContain("robots: { index: false, follow: false }");
    expect(serviceDetail).toContain('title: "Service not found"');
  });

  it("keeps service card links accessible without overwriting names", () => {
    const cards = read("components/demos/novatech/home/ServiceCards.tsx");
    expect(cards).toContain("serviceHref(service.id)");
    expect(cards).toContain("CTA.learnMore");
    expect(cards).not.toContain("aria-label={`${service.title}");
  });

  it("converts static shells away from unnecessary client boundaries", () => {
    expect(read("components/demos/novatech/layout/Breadcrumbs.tsx")).not.toContain(
      '"use client"',
    );
    expect(read("components/demos/novatech/home/CtaBand.tsx")).not.toContain(
      '"use client"',
    );
    expect(
      read("components/demos/novatech/contact/ContactSidebar.tsx"),
    ).not.toContain('"use client"');
  });

  it("includes NovaTech reduced-motion and focus-visible CSS", () => {
    const css = read("app/demos/demos.css");
    expect(css).toContain('[data-demo="novatech"] :focus-visible');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain('[data-demo="novatech"] *');
  });

  it("opens FAQ panels from hash links", () => {
    const accordion = read("components/demos/novatech/ui/Accordion.tsx");
    expect(accordion).toContain("hashchange");
    expect(accordion).toContain("window.location.hash");
  });

  it("resolves related services for every published service", () => {
    for (const service of SERVICES) {
      const related = getRelatedServices(service);
      expect(related.length).toBeGreaterThan(0);
      for (const item of related) {
        expect(getServiceById(item.id)?.id).toBe(item.id);
      }
    }
    expect(getServiceIds()).toHaveLength(6);
    expect(resolveInquiryServiceParam("bogus")).toBe("not-sure");
  });
});
