import { describe, expect, it } from "vitest";
import { absoluteUrl, pageMetadata } from "./seo";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("SEO helpers", () => {
  it("builds absolute URLs from the site metadata base", () => {
    expect(absoluteUrl("/")).toBe("https://www.christopherkilo.com");
    expect(absoluteUrl("/projects")).toBe(
      "https://www.christopherkilo.com/projects",
    );
  });

  it("assigns a self-referencing canonical per path", () => {
    const home = pageMetadata({
      title: "Home",
      description: "Portfolio",
      path: "/",
    });
    const projects = pageMetadata({
      title: "Projects",
      description: "Work",
      path: "/projects",
    });
    expect(home.alternates?.canonical).toBe("/");
    expect(projects.alternates?.canonical).toBe("/projects");
    expect(home.openGraph?.url).toBe("https://www.christopherkilo.com");
    expect(projects.openGraph?.url).toBe(
      "https://www.christopherkilo.com/projects",
    );
  });

  it("keeps demos, APIs, and auth out of the sitemap and robots index", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls.some((url) => url.includes("/demos/"))).toBe(false);
    expect(urls.some((url) => url.includes("/api/"))).toBe(false);
    expect(urls).toContain("https://www.christopherkilo.com");
    expect(urls).toContain("https://www.christopherkilo.com/projects");
    expect(urls).toContain("https://www.christopherkilo.com/blog");
    expect(urls).toContain("https://www.christopherkilo.com/about");
    expect(urls).toContain("https://www.christopherkilo.com/resume");
    expect(urls).toContain("https://www.christopherkilo.com/contact");

    const rules = robots();
    expect(rules.rules).toMatchObject({
      disallow: ["/demos/", "/api/", "/auth/"],
    });
  });
});
