import { z } from "zod";
import { inquirySchema } from "../../../lib/demos/novatech/inquiry/schema";
import { PermanentFailure } from "./errors";

export const workflowInputSchema = z
  .object({
    submissionId: z.string().trim().uuid(),
    requestId: z.string().trim().uuid(),
    inquiry: inquirySchema,
  })
  .strict();

export type WorkflowInput = z.infer<typeof workflowInputSchema>;

export function parseWorkflowInput(event: unknown): WorkflowInput {
  const parsed = workflowInputSchema.safeParse(event);
  if (!parsed.success) {
    throw new PermanentFailure("Workflow input failed NovaTech inquiry validation.");
  }
  return parsed.data;
}