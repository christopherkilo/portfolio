import type {
  CompanySize,
  InquiryServiceOption,
  InquiryUrgency,
  PreferredContactMethod,
} from "@/lib/demos/novatech/inquiry/types";
import { getServiceById } from "@/lib/demos/novatech/paths";

export const INQUIRY_SERVICE_LABELS: Record<InquiryServiceOption, string> = {
  "managed-it": "Managed IT",
  "computer-repair": "Computer Repair",
  networking: "Networking",
  cybersecurity: "Cybersecurity",
  "website-development": "Website Development",
  "cloud-solutions": "Cloud Solutions",
  "not-sure": "Not sure yet",
};

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  "1-10": "1–10 employees",
  "11-50": "11–50 employees",
  "51-200": "51–200 employees",
  "201-500": "201–500 employees",
  "500+": "500+ employees",
};

export const URGENCY_LABELS: Record<InquiryUrgency, string> = {
  planning: "Planning / exploring",
  "within-90-days": "Within 90 days",
  "within-30-days": "Within 30 days",
  urgent: "Urgent — systems impacted",
};

export const CONTACT_METHOD_LABELS: Record<PreferredContactMethod, string> = {
  email: "Email",
  phone: "Phone",
  either: "Either is fine",
};

export function inquiryServiceLabel(service: InquiryServiceOption): string {
  return INQUIRY_SERVICE_LABELS[service];
}

export function consultationContextTitle(
  service: InquiryServiceOption,
): string {
  if (service === "not-sure") return "General consultation";
  const known = getServiceById(service);
  return known ? `${known.title} consultation` : INQUIRY_SERVICE_LABELS[service];
}
