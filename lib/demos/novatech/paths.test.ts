import { describe, expect, it } from "vitest";
import {
  PORTFOLIO_ITEMS,
  SERVICES,
} from "@/lib/demos/novatech/constants";
import {
  contactHref,
  filterPortfolioByCategory,
  getServiceById,
  getServiceIds,
  isNavActive,
  isValidServiceId,
  parseServiceQueryParam,
  resolveInquiryServiceParam,
  resolvePortfolioCategoryParam,
  portfolioHref,
  serviceHref,
} from "@/lib/demos/novatech/paths";

describe("NovaTech service routes", () => {
  it("exposes the expected static service IDs", () => {
    expect(getServiceIds()).toEqual([
      "managed-it",
      "computer-repair",
      "networking",
      "cybersecurity",
      "website-development",
      "cloud-solutions",
    ]);
  });

  it("resolves valid service IDs and rejects invalid ones", () => {
    expect(isValidServiceId("cybersecurity")).toBe(true);
    expect(getServiceById("cybersecurity")?.title).toBe("Cybersecurity");
    expect(isValidServiceId("not-a-service")).toBe(false);
    expect(getServiceById("not-a-service")).toBeUndefined();
  });

  it("builds service and consultation links", () => {
    expect(serviceHref("managed-it")).toBe(
      "/demos/novatech-solutions/services/managed-it",
    );
    expect(contactHref()).toBe("/demos/novatech-solutions/contact");
    expect(contactHref("cybersecurity")).toBe(
      "/demos/novatech-solutions/contact?service=cybersecurity",
    );
    expect(
      contactHref("cybersecurity", {
        preserveParams: new URLSearchParams("demoResult=failure"),
      }),
    ).toBe(
      "/demos/novatech-solutions/contact?demoResult=failure&service=cybersecurity",
    );
  });

  it("keeps service detail content fields available for every service", () => {
    for (const service of SERVICES) {
      expect(service.valueProposition.length).toBeGreaterThan(20);
      expect(service.problems.length).toBeGreaterThan(0);
      expect(service.capabilities.length).toBeGreaterThan(0);
      expect(service.process.length).toBe(4);
      expect(service.outcomes.length).toBeGreaterThan(0);
      expect(serviceHref(service.id)).toContain(service.id);
    }
  });
});

describe("NovaTech portfolio filtering", () => {
  it("returns all projects for all/empty filters", () => {
    expect(filterPortfolioByCategory("all")).toHaveLength(PORTFOLIO_ITEMS.length);
    expect(filterPortfolioByCategory(null)).toHaveLength(PORTFOLIO_ITEMS.length);
  });

  it("filters by category and syncs portfolio URLs", () => {
    const networking = filterPortfolioByCategory("Networking");
    expect(networking.every((item) => item.category === "Networking")).toBe(true);
    expect(networking.length).toBeGreaterThan(0);
    expect(portfolioHref("Networking")).toBe(
      "/demos/novatech-solutions/portfolio?category=Networking",
    );
    expect(portfolioHref("all")).toBe("/demos/novatech-solutions/portfolio");
  });

  it("retains valid category query values", () => {
    const resolved = resolvePortfolioCategoryParam("Networking");
    expect(resolved.category).toBe("Networking");
    expect(resolved.shouldCanonicalize).toBe(false);
    expect(portfolioHref(resolved.category)).toContain("category=Networking");
    expect(filterPortfolioByCategory(resolved.category)).toHaveLength(
      filterPortfolioByCategory("Networking").length,
    );
  });

  it("canonicalizes literal all and invalid categories without a replace loop", () => {
    const allLiteral = resolvePortfolioCategoryParam("all");
    expect(allLiteral).toEqual({ category: "all", shouldCanonicalize: true });
    expect(portfolioHref(allLiteral.category)).toBe(
      "/demos/novatech-solutions/portfolio",
    );

    const invalid = resolvePortfolioCategoryParam("Bananas");
    expect(invalid).toEqual({ category: "all", shouldCanonicalize: true });
    expect(portfolioHref(invalid.category)).toBe(
      "/demos/novatech-solutions/portfolio",
    );

    // After canonicalize, clean URL does not request another replace.
    const clean = resolvePortfolioCategoryParam(null);
    expect(clean.shouldCanonicalize).toBe(false);

    // Capitalization variants are not treated as valid.
    expect(resolvePortfolioCategoryParam("networking").shouldCanonicalize).toBe(
      true,
    );
  });

  it("matches result counts to visible filtered items", () => {
    for (const category of ["Networking", "Cybersecurity", "all"] as const) {
      const { category: resolved } = resolvePortfolioCategoryParam(
        category === "all" ? null : category,
      );
      expect(filterPortfolioByCategory(resolved)).toHaveLength(
        filterPortfolioByCategory(resolved).length,
      );
      expect(filterPortfolioByCategory(resolved).length).toBe(
        category === "all"
          ? PORTFOLIO_ITEMS.length
          : PORTFOLIO_ITEMS.filter((item) => item.category === category).length,
      );
    }
  });

  it("links every portfolio item to a valid service", () => {
    for (const item of PORTFOLIO_ITEMS) {
      expect(isValidServiceId(item.serviceId)).toBe(true);
    }
  });
});

describe("NovaTech navigation and contact query parsing", () => {
  it("marks nested service routes under Services as active", () => {
    expect(
      isNavActive(
        "/demos/novatech-solutions/services/cybersecurity",
        "/demos/novatech-solutions/services",
      ),
    ).toBe(true);
    expect(
      isNavActive("/demos/novatech-solutions", "/demos/novatech-solutions"),
    ).toBe(true);
    expect(
      isNavActive(
        "/demos/novatech-solutions/about",
        "/demos/novatech-solutions",
      ),
    ).toBe(false);
  });

  it("parses service query params for consultation context", () => {
    expect(parseServiceQueryParam("cloud-solutions")).toBe("cloud-solutions");
    expect(parseServiceQueryParam("unknown")).toBeNull();
    expect(parseServiceQueryParam(null)).toBeNull();
    expect(resolveInquiryServiceParam("cloud-solutions")).toBe("cloud-solutions");
    expect(resolveInquiryServiceParam("unknown")).toBe("not-sure");
    expect(resolveInquiryServiceParam(null)).toBe("not-sure");
  });
});
