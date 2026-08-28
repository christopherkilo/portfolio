import { z } from "zod";
import {
  COMPANY_SIZE_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  INQUIRY_SERVICE_OPTIONS,
  URGENCY_OPTIONS,
} from "../../../lib/demos/novatech/inquiry/types";
import { NotificationValidationError } from "./errors";

const uuid = z.string().trim().uuid();

const customerSchema = z
  .object({
    notificationId: z.string().trim().min(1).max(256),
    submissionId: uuid,
    requestId: uuid,
    type: z.literal("customer_confirmation"),
    recipient: z.string().trim().email().max(120),
    name: z.string().trim().min(1).max(80),
    selectedService: z.enum(INQUIRY_SERVICE_OPTIONS),
  })
  .strict();

const staffSchema = z
  .object({
    notificationId: z.string().trim().min(1).max(256),
    submissionId: uuid,
    requestId: uuid,
    type: z.literal("staff_notification"),
    name: z.string().trim().min(1).max(80),
    company: z.string().trim().min(1).max(120),
    selectedService: z.enum(INQUIRY_SERVICE_OPTIONS),
    companySize: z.enum(COMPANY_SIZE_OPTIONS),
    urgency: z.enum(URGENCY_OPTIONS),
    preferredContactMethod: z.enum(CONTACT_METHOD_OPTIONS),
    visitorEmail: z.string().trim().email().max(120),
    contactId: z.string().trim().min(1).max(64),
    dealId: z.string().trim().min(1).max(64),
  })
  .strict();

export const notificationMessageSchema = z.discriminatedUnion("type", [
  customerSchema,
  staffSchema,
]);

export type NotificationMessage = z.infer<typeof notificationMessageSchema>;

export function parseNotificationMessage(raw: unknown): NotificationMessage {
  const parsed = notificationMessageSchema.safeParse(raw);
  if (!parsed.success) {
    throw new NotificationValidationError("Notification message failed schema validation.");
  }
  const suffix = parsed.data.type === "customer_confirmation" ? ":customer" : ":staff";
  if (parsed.data.notificationId !== `${parsed.data.submissionId}${suffix}`) {
    throw new NotificationValidationError("notificationId does not match submissionId and type.");
  }
  return parsed.data;
}

export function parseJsonBody(body: string): unknown {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new NotificationValidationError("Notification message is not valid JSON.");
  }
}
