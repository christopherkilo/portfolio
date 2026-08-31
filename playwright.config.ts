import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

const startExistingBuild = `npx next start --hostname localhost --port ${PORT}`;
const localWebServer = `sh -c 'if [ -d .next ]; then ${startExistingBuild}; else npm run build && ${startExistingBuild}; fi'`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"], ["list"]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: {
    command: process.env.CI ? startExistingBuild : localWebServer,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /visual\.spec\.ts/,
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testMatch: /(smoke|a11y)\.spec\.ts/,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testMatch: /(smoke|a11y)\.spec\.ts/,
    },
    {
      name: "visual",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /visual\.spec\.ts/,
      snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
    },
  ],
});
