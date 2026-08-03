import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "@/server/novatech/integrations/turnstile";
import { TurnstileError } from "@/server/novatech/errors";

const ctx = {
  requestId: "11111111-1111-4111-8111-111111111111",
  submissionId: "22222222-2222-4222-8222-222222222222",
};

describe("NovaTech Turnstile verification", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.NOVATECH_ALLOW_TURNSTILE_DEV_BYPASS;
    delete process.env.TURNSTILE_SECRET_KEY;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = env;
  });

  it("accepts the development mock token when bypass is enabled", async () => {
    process.env.NOVATECH_ALLOW_TURNSTILE_DEV_BYPASS = "true";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(
      verifyTurnstileToken({ token: "dev-mock-token", context: ctx }),
    ).resolves.toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts a valid Siteverify success", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, hostname: "localhost" }), {
        status: 200,
      }),
    );
    await expect(
      verifyTurnstileToken({
        token: "good-token",
        remoteIp: "1.2.3.4",
        context: ctx,
      }),
    ).resolves.toBeUndefined();
  });

  it("rejects invalid tokens", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          "error-codes": ["invalid-input-response"],
        }),
        { status: 200 },
      ),
    );
    await expect(
      verifyTurnstileToken({ token: "bad-token", context: ctx }),
    ).rejects.toBeInstanceOf(TurnstileError);
  });

  it("maps Cloudflare timeouts to TurnstileError", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Aborted"));
    await expect(
      verifyTurnstileToken({ token: "token", context: ctx }),
    ).rejects.toBeInstanceOf(TurnstileError);
  });

  it("maps unavailable Siteverify responses to TurnstileError", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 503 }),
    );
    await expect(
      verifyTurnstileToken({ token: "token", context: ctx }),
    ).rejects.toBeInstanceOf(TurnstileError);
  });

  it("requires a token when the secret is configured", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    await expect(
      verifyTurnstileToken({ token: "  ", context: ctx }),
    ).rejects.toMatchObject({
      code: "TURNSTILE_REQUIRED",
    });
  });
});
