import { safeAngularNextPath } from "./safe-next-path";

describe("safeAngularNextPath", () => {
  it("allows local app routes", () => {
    expect(safeAngularNextPath("/projects")).toBe("/projects");
  });

  it("rejects open redirects", () => {
    expect(safeAngularNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeAngularNextPath("//evil.example")).toBe("/dashboard");
    expect(safeAngularNextPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("allows Angular invite next only with a valid token query", () => {
    const token = "a".repeat(20);
    expect(safeAngularNextPath(`/invite?token=${token}`)).toBe(
      `/invite?token=${token}`,
    );
  });

  it("rejects unsafe Angular invite next values", () => {
    expect(safeAngularNextPath("/invite?token=short")).toBe("/dashboard");
    expect(
      safeAngularNextPath(`/invite?token=${"a".repeat(20)}&host=evil`),
    ).toBe("/dashboard");
    expect(safeAngularNextPath("/invite")).toBe("/dashboard");
    expect(
      safeAngularNextPath(`//evil.example/invite?token=${"a".repeat(20)}`),
    ).toBe("/dashboard");
    expect(
      safeAngularNextPath(`https://evil.example/invite?token=${"a".repeat(20)}`),
    ).toBe("/dashboard");
  });
});
