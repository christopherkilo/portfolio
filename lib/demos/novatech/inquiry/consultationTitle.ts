import { getServiceById } from "@/lib/demos/novatech/paths";
import { INQUIRY_SERVICE_LABELS } from "@/lib/demos/novatech/inquiry/labels";
import type { InquiryServiceOption } from "@/lib/demos/novatech/inquiry/types";

export function consultationContextTitle(
  service: InquiryServiceOption,
): string {
  if (service === "not-sure") return "General consultation";
  const known = getServiceById(service);
  return known ? `${known.title} consultation` : INQUIRY_SERVICE_LABELS[service];
}