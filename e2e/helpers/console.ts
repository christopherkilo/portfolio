import type { ConsoleMessage, Page } from "@playwright/test";

/**
 * Unexpected console.error / pageerror collector.
 *
 * Intentional exclusions (not application defects):
 * - Browser-extension noise (chrome-extension://, moz-extension://)
 * - Benign aborted requests during client-side navigations
 * - Third-party favicon / font network failures that are not referenced by app code
 */
const IGNORED_CONSOLE = [
  /chrome-extension:\/\//i,
  /moz-extension:\/\//i,
  /safari-extension:\/\//i,
  /The resource .* was preloaded using link preload but not used/i,
];

const IGNORED_PAGE_ERRORS = [
  /chrome-extension:\/\//i,
  /moz-extension:\/\//i,
];

export type ConsoleGuard = {
  errors: string[];
  pageErrors: string[];
  assertClean: () => void;
};

function isIgnored(message: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(message));
}

function formatConsole(message: ConsoleMessage) {
  return `${message.type()}: ${message.text()}`;
}

export function attachConsoleGuard(page: Page): ConsoleGuard {
  const errors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = formatConsole(message);
    if (isIgnored(text, IGNORED_CONSOLE)) return;
    errors.push(text);
  });

  page.on("pageerror", (error) => {
    const text = error.stack ?? error.message;
    if (isIgnored(text, IGNORED_PAGE_ERRORS)) return;
    pageErrors.push(text);
  });

  return {
    errors,
    pageErrors,
    assertClean() {
      if (errors.length || pageErrors.length) {
        const details = [...errors, ...pageErrors].join("\n");
        throw new Error(`Unexpected page errors:\n${details}`);
      }
    },
  };
}
