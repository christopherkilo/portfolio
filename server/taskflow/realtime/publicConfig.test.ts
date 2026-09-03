import { describe, expect, it } from "vitest";
import {
  assertPublicRealtimeConfig,
  toPublicRealtimeConfig,
} from "@/server/taskflow/realtime/publicConfig";

describe("toPublicRealtimeConfig", () => {
  it("exposes only the browser-safe URL and publishable key", () => {
    const env = {
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
      secretKey: "super-secret",
    };
    expect(toPublicRealtimeConfig(env)).toEqual({
      supabaseUrl: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
    });
    expect(JSON.stringify(toPublicRealtimeConfig(env))).not.toContain("secret");
  });
});

describe("assertPublicRealtimeConfig", () => {
  it("rejects secret-bearing payloads", () => {
    expect(() =>
      assertPublicRealtimeConfig({
        supabaseUrl: "https://example.supabase.co",
        publishableKey: "pub",
        secretKey: "nope",
      }),
    ).toThrow(/must not include secrets/);
  });

  it("rejects a service-role key string", () => {
    expect(() =>
      assertPublicRealtimeConfig({
        supabaseUrl: "https://example.supabase.co",
        publishableKey: "service_role_key_value",
      }),
    ).toThrow(/service-role/);
  });
});
