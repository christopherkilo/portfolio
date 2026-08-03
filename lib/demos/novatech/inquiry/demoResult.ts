/**
 * Development-only helpers for forcing the demo inquiry failure UI.
 *
 * Production builds ignore URL `demoResult` unless the env var is set
 * intentionally. Never enable forced failure by default.
 */

export type DemoResultEnv = {
  NODE_ENV?: string;
  NEXT_PUBLIC_NOVATECH_DEMO_RESULT?: string;
};

/**
 * Returns true when the demo adapter should simulate a retryable failure.
 *
 * - Development: `?demoResult=failure` or `NEXT_PUBLIC_NOVATECH_DEMO_RESULT=failure`
 * - Production: only the env var (intentional configuration); URL param ignored
 */
export function shouldForceDemoInquiryFailure(
  demoResultParam: string | null | undefined,
  env: DemoResultEnv = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_NOVATECH_DEMO_RESULT:
      process.env.NEXT_PUBLIC_NOVATECH_DEMO_RESULT,
  },
): boolean {
  const envForced = env.NEXT_PUBLIC_NOVATECH_DEMO_RESULT === "failure";

  if (env.NODE_ENV === "production") {
    return envForced;
  }

  return demoResultParam === "failure" || envForced;
}
