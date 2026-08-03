import { describe, expect, it } from "vitest";
import { ZodError, z } from "zod";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/server/taskflow/errors";
import { handleTaskflowRouteError } from "@/server/taskflow/errors/http";

describe("TaskFlow error model", () => {
  it("maps domain errors to stable status codes", () => {
    expect(new ValidationError("bad").status).toBe(400);
    expect(new UnauthorizedError().status).toBe(401);
    expect(new ForbiddenError().status).toBe(403);
    expect(new NotFoundError().status).toBe(404);
    expect(new ConflictError("taken").status).toBe(409);
  });

  it("does not leak Zod internals in responses", async () => {
    const schema = z.object({ title: z.string().min(1) });
    let zodError: ZodError | null = null;
    try {
      schema.parse({ title: "" });
    } catch (error) {
      zodError = error as ZodError;
    }
    expect(zodError).toBeTruthy();
    const response = handleTaskflowRouteError(zodError!);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(JSON.stringify(body)).not.toContain("ZodError");
  });
});
