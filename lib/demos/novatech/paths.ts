import {
  DEMO_BASE,
  PORTFOLIO_ITEMS,
  SERVICES,
  type Service,
  type ServiceId,
} from "@/lib/demos/novatech/constants";
import {
  INQUIRY_SERVICE_OPTIONS,
  type InquiryServiceOption,
} from "@/lib/demos/novatech/inquiry/types";

export type ContactHrefOptions = {
  /**
   * Existing query string to preserve (e.g. `demoResult`).
   * `service` from this object is overwritten by `serviceId`.
   */
  preserveParams?: Pick<URLSearchParams, "toString"> | null;
  /** Explicitly set or clear `demoResult` (null deletes the key). */
  demoResult?: string | null;
};

/**
 * Build a contact URL. Passing `preserveParams` keeps unrelated query keys
 * (e.g. `demoResult`) when updating `service`.
 */
export function contactHref(
  serviceId?: string | null,
  options?: ContactHrefOptions,
): string {
  const params = new URLSearchParams(options?.preserveParams?.toString() ?? "");

  if (!serviceId || serviceId === "not-sure") {
    params.delete("service");
  } else {
    params.set("service", serviceId);
  }

  if (options && "demoResult" in options) {
    if (options.demoResult == null || options.demoResult === "") {
      params.delete("demoResult");
    } else {
      params.set("demoResult", options.demoResult);
    }
  }

  const qs = params.toString();
  return qs ? `${DEMO_BASE}/contact?${qs}` : `${DEMO_BASE}/contact`;
}

export function serviceHref(serviceId: string): string {
  return `${DEMO_BASE}/services/${serviceId}`;
}

export function portfolioHref(category?: string | null): string {
  if (!category || category === "all") return `${DEMO_BASE}/portfolio`;
  return `${DEMO_BASE}/portfolio?category=${encodeURIComponent(category)}`;
}

/**
 * Resolve a portfolio `?category=` value.
 * Capitalization must match published categories exactly.
 * Invalid or literal `all` values should canonicalize to the clean portfolio URL.
 */
export function resolvePortfolioCategoryParam(
  requested: string | null | undefined,
  categories: readonly string[] = getPortfolioCategories(),
): {
  category: string;
  /** True when the URL should be replaced with the canonical unfiltered path. */
  shouldCanonicalize: boolean;
} {
  if (requested == null || requested === "") {
    return { category: "all", shouldCanonicalize: false };
  }
  if (requested === "all") {
    return { category: "all", shouldCanonicalize: true };
  }
  if (categories.includes(requested)) {
    return { category: requested, shouldCanonicalize: false };
  }
  return { category: "all", shouldCanonicalize: true };
}

export function isNavActive(pathname: string, href: string): boolean {
  if (href === DEMO_BASE) return pathname === DEMO_BASE;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((service) => service.id === id);
}

export function isValidServiceId(id: string): id is ServiceId {
  return SERVICES.some((service) => service.id === id);
}

export function getServiceIds(): ServiceId[] {
  return SERVICES.map((service) => service.id);
}

export function getRelatedServices(service: Service): Service[] {
  return service.relatedServiceIds
    .map((id) => getServiceById(id))
    .filter((item): item is Service => Boolean(item));
}

export function getPortfolioCategories(): string[] {
  return Array.from(
    new Set(PORTFOLIO_ITEMS.map((item) => item.category)),
  ).sort((a, b) => a.localeCompare(b));
}

export function filterPortfolioByCategory(category?: string | null) {
  if (!category || category === "all") return PORTFOLIO_ITEMS;
  return PORTFOLIO_ITEMS.filter((item) => item.category === category);
}

export function parseServiceQueryParam(
  value: string | null | undefined,
): ServiceId | null {
  if (!value) return null;
  return isValidServiceId(value) ? value : null;
}

/** Resolve URL ?service= into a safe inquiry selection (defaults to not-sure). */
export function resolveInquiryServiceParam(
  value: string | null | undefined,
): InquiryServiceOption {
  if (!value) return "not-sure";
  if ((INQUIRY_SERVICE_OPTIONS as readonly string[]).includes(value)) {
    return value as InquiryServiceOption;
  }
  return "not-sure";
}
