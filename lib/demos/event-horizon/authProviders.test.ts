import { describe, expect, it } from "vitest";
import {
  isGitHubAuthConfigured,
  resolveConfiguredAuthProviders,
} from "./authProviders";

describe("optional auth providers", () => {
  it("always includes Google as the primary provider", () => {
    expect(resolveConfiguredAuthProviders({})).toEqual(["google"]);
    expect(
      resolveConfiguredAuthProviders({
        AUTH_GITHUB_ID: "",
        AUTH_GITHUB_SECRET: "",
      }),
    ).toEqual(["google"]);
  });

  it("registers GitHub only when both credentials are present", () => {
    expect(
      resolveConfiguredAuthProviders({
        AUTH_GITHUB_ID: "gh-id",
        AUTH_GITHUB_SECRET: "",
      }),
    ).toEqual(["google"]);

    expect(
      resolveConfiguredAuthProviders({
        AUTH_GITHUB_ID: "",
        AUTH_GITHUB_SECRET: "gh-secret",
      }),
    ).toEqual(["google"]);

    expect(
      resolveConfiguredAuthProviders({
        AUTH_GITHUB_ID: "gh-id",
        AUTH_GITHUB_SECRET: "gh-secret",
      }),
    ).toEqual(["google", "github"]);
  });

  it("ignores whitespace-only GitHub credentials", () => {
    expect(
      isGitHubAuthConfigured({
        AUTH_GITHUB_ID: "   ",
        AUTH_GITHUB_SECRET: "secret",
      }),
    ).toBe(false);
  });
});
