import "server-only";

import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

export const eventIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid event id or slug.");

export const eventQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  category: z
    .enum(["All", "Music", "Tech", "Arts", "Food", "Sports", "Nightlife"])
    .optional()
    .default("All"),
  city: z.string().trim().max(80).optional().default("All"),
  date: z
    .string()
    .optional()
    .default("")
    .refine(
      (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "date must be YYYY-MM-DD",
    ),
  sort: z
    .enum(["date-asc", "date-desc", "popular", "title"])
    .optional()
    .default("date-asc"),
  featured: z.boolean().optional().default(false),
  page: paginationSchema.shape.page,
  pageSize: paginationSchema.shape.pageSize,
});

export const favoriteCreateSchema = z.object({
  eventId: eventIdSchema,
});

export const reservationCreateSchema = z.object({
  eventId: eventIdSchema,
  ticketTypeId: z.string().trim().min(1).max(120),
  quantity: z.number().int().min(1).max(20),
  idempotencyKey: z
    .string()
    .trim()
    .min(8)
    .max(80)
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid idempotency key."),
});

export const reservationCancelSchema = z.object({
  id: z.string().trim().min(1).max(120),
});

export const reservationListQuerySchema = z.object({
  status: z.enum(["confirmed", "cancelled", "all"]).optional().default("all"),
  page: paginationSchema.shape.page,
  pageSize: paginationSchema.shape.pageSize,
});

export type EventQueryInput = z.infer<typeof eventQuerySchema>;
export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>;
