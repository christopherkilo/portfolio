import { describe, expect, it } from "vitest";
import {
  requestPublicOrigin,
  safeNextPath,
  signInPathForNext,
} from "./safeNextPath";

describe("safeNextPath", () => {
  it("defaults to the React dashboard", () => {
    expect(safeNextPath(null)).toBe("/demos/taskflow/dashboard");
  });

  it("allows React TaskFlow paths and invite query strings", () => {
    expect(safeNextPath("/demos/taskflow/projects")).toBe(
      "/demos/taskflow/projects",
    );
    expect(
      safeNextPath("/demos/taskflow/invite?token=abc"),
    ).toBe("/demos/taskflow/invite?token=abc");
  });

  it("allows exact Angular app paths", () => {
    expect(safeNextPath("/projects", "/dashboard")).toBe("/projects");
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
  });

  it("allows Angular invite next only with a valid token query", () => {
    const token = "a".repeat(20);
    expect(safeNextPath(`/invite?token=${token}`, "/dashboard")).toBe(
      `/invite?token=${token}`,
    );
  });

  it("rejects unsafe Angular invite next values", () => {
    expect(safeNextPath("/invite?token=short", "/dashboard")).toBe("/dashboard");
    expect(
      safeNextPath(`/invite?token=${"a".repeat(20)}&host=evil`, "/dashboard"),
    ).toBe("/dashboard");
    expect(safeNextPath("/invite", "/dashboard")).toBe("/dashboard");
    expect(
      safeNextPath(`//evil.example/invite?token=${"a".repeat(20)}`, "/dashboard"),
    ).toBe("/dashboard");
  });

  it("rejects open redirects", () => {
    expect(safeNextPath("https://evil.example/phish")).toBe(
      "/demos/taskflow/dashboard",
    );
    expect(safeNextPath("//evil.example")).toBe("/demos/taskflow/dashboard");
    expect(safeNextPath("///evil.example")).toBe("/demos/taskflow/dashboard");
    expect(safeNextPath("javascript:alert(1)")).toBe(
      "/demos/taskflow/dashboard",
    );
    expect(safeNextPath("/\\evil.example")).toBe("/demos/taskflow/dashboard");
  });

  it("rejects lookalike Angular paths", () => {
    expect(safeNextPath("/dashboard-admin", "/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/projects/../signin", "/dashboard")).toBe(
      "/dashboard",
    );
  });
});

describe("signInPathForNext", () => {
  it("sends Angular invite next values to Angular sign-in", () => {
    expect(signInPathForNext(`/invite?token=${"a".repeat(20)}`)).toBe("/signin");
  });

  it("sends React next values to React sign-in", () => {
    expect(signInPathForNext("/demos/taskflow/dashboard")).toBe(
      "/demos/taskflow/signin",
    );
  });
});

describe("requestPublicOrigin", () => {
  it("uses the request URL origin by default", () => {
    const request = new Request("http://localhost:3000/auth/callback");
    expect(requestPublicOrigin(request)).toBe("http://localhost:3000");
  });

  it("trusts loopback X-Forwarded-Host from the Angular proxy", () => {
    const request = new Request("http://127.0.0.1:3000/auth/callback", {
      headers: {
        "x-forwarded-host": "localhost:4200",
        "x-forwarded-proto": "http",
      },
    });
    expect(requestPublicOrigin(request)).toBe("http://localhost:4200");
  });

  it("ignores non-loopback forwarded hosts", () => {
    const request = new Request("http://localhost:3000/auth/callback", {
      headers: {
        "x-forwarded-host": "evil.example",
        "x-forwarded-proto": "https",
      },
    });
    expect(requestPublicOrigin(request)).toBe("http://localhost:3000");
  });
});
