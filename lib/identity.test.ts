import { describe, expect, it } from "vitest";
import { ROLES, SITE } from "./constants";

describe("professional identity", () => {
  it("keeps Software Engineer as the primary title", () => {
    expect(SITE.title).toBe("Software Engineer");
    expect(SITE.disciplines).toEqual([
      "Full-Stack Development",
      "Cloud / IT",
      "Graphic Design",
    ]);
  });

  it("does not present frontend, backend, and full-stack as peer hero titles", () => {
    const blob = `${SITE.title} ${SITE.disciplines.join(" ")} ${SITE.description}`;
    expect(blob).not.toMatch(/Frontend Developer/);
    expect(blob).not.toMatch(/Backend Developer/);
    expect(blob).not.toMatch(/Web Developer/);
    expect(SITE.title).not.toMatch(/\//);
  });

  it("keeps About capability cards aligned to supporting disciplines", () => {
    expect(ROLES.map((role) => role.title)).toEqual([
      "Full-Stack Development",
      "Graphic Design",
      "IT Technician",
    ]);
  });
});
