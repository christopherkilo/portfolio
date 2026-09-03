import { assertPublicRealtimeConfig } from "./public-config";

describe("assertPublicRealtimeConfig", () => {
  it("accepts only URL + publishable key", () => {
    expect(
      assertPublicRealtimeConfig({
        supabaseUrl: "https://example.supabase.co",
        publishableKey: "sb_publishable_test",
      }),
    ).toEqual({
      supabaseUrl: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

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
