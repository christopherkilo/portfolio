import axe from "axe-core";

/**
 * jsdom cannot measure contrast. Fail the suite on serious/critical only.
 */
export async function expectNoSeriousA11yViolations(
  container: HTMLElement,
): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
    },
  });
  const blocking = results.violations.filter(
    (violation) =>
      violation.impact === "critical" || violation.impact === "serious",
  );
  const summary = blocking
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.nodes
          .map((node) => node.failureSummary ?? node.html)
          .join(" | ")}`,
    )
    .join("\n");
  expect(blocking, summary).toEqual([]);
}
