import { DEMO_DISCLOSURE } from "@/lib/toolkit/constants";
import { fillConclusion } from "@/lib/toolkit/guided/engine";
import type { DiagnosticReading, TroubleshootingSession } from "@/lib/toolkit/guided/types";
import { getWorkflow } from "@/lib/toolkit/guided/workflows";
import type { DiagnosticReport, Finding, Recommendation } from "@/lib/toolkit/types";
import { statusFromScore } from "@/lib/toolkit/simulation";

function findingToReportFinding(
  item: TroubleshootingSession["findings"][number],
): Finding {
  return {
    id: item.id,
    title: `${item.category}: ${item.status}`,
    severity: item.status === "high" ? "warning" : item.status === "attention" ? "warning" : "info",
    explanation: `${item.explanation} Observed: ${item.observedValue}. ${item.confidence}`,
    causes: [item.category],
    nextStep: item.nextAction,
  };
}

function actionToRecommendation(
  workflowId: string,
  actionId: string,
): Recommendation | null {
  const workflow = getWorkflow(workflowId);
  const action = workflow?.actions[actionId];
  if (!action) return null;
  return {
    id: action.id,
    title: action.title,
    description: action.why,
    reason: action.why,
    benefit: action.caution ?? (action.simulated ? "Simulated demonstration action." : "Guidance only."),
    priority: action.classification === "try-now" ? "high" : action.classification === "monitor" ? "medium" : "low",
    module: action.relatedModule === "memory" ? "memory" : action.relatedModule === "network" ? "network" : "system",
  };
}

export function buildGuideReport(input: {
  session: TroubleshootingSession;
  reading: DiagnosticReading;
  healthScore: number;
}): DiagnosticReport | null {
  const workflow = input.session.workflowId ? getWorkflow(input.session.workflowId) : null;
  if (!workflow || !input.session.startedAt) return null;

  const summaryStep = workflow.steps.find((step) => step.type === "summary");
  const conclusion =
    summaryStep && summaryStep.type === "summary"
      ? fillConclusion(
          summaryStep.conclusionTemplate,
          input.reading,
          input.session.findings.map((item) => item.category),
        )
      : "Guided troubleshooting session completed.";

  const skipped =
    input.session.skippedStepIds.length > 0
      ? ` Skipped checks: ${input.session.skippedStepIds.join(", ")}.`
      : "";
  const actionsTaken =
    input.session.simulatedActions.length > 0
      ? ` Simulated actions: ${input.session.simulatedActions.map((item) => item.label).join("; ")}.`
      : " No simulated remediation actions were taken.";

  const recommendations = input.session.recommendedActionIds
    .map((id) => actionToRecommendation(workflow.id, id))
    .filter((item): item is Recommendation => Boolean(item));

  const guideFindings = input.session.findings.map(findingToReportFinding);
  const systemFindings = guideFindings.filter((item) => !item.id.includes("mem") && !item.id.includes("network") && !item.id.includes("latency") && !item.id.includes("dns") && !item.id.includes("loss"));
  const memoryFindings = guideFindings.filter((item) => item.id.includes("mem") || item.id.includes("freeze-memory"));
  const networkFindings = guideFindings.filter(
    (item) =>
      item.id.includes("latency") ||
      item.id.includes("loss") ||
      item.id.includes("dns") ||
      item.id.includes("network"),
  );

  return {
    id: crypto.randomUUID(),
    name: `Guided Troubleshooting · ${workflow.title}`,
    createdAt: new Date().toISOString(),
    overallStatus: statusFromScore(input.healthScore),
    healthScore: input.healthScore,
    activeProfile: input.reading.profileLabel,
    systemSummary: [
      `Workflow: ${workflow.title}.`,
      `Scenario: ${input.reading.profileLabel}.`,
      conclusion,
      skipped,
      actionsTaken,
      DEMO_DISCLOSURE,
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
    systemFindings: systemFindings.length ? systemFindings : guideFindings.slice(0, 2),
    memoryFindings,
    networkFindings,
    recommendations:
      recommendations.length > 0
        ? recommendations
        : [
            {
              id: "guide-complete",
              title: "Review the guided summary",
              description: conclusion,
              reason: "Session completed without queued action IDs.",
              benefit: "Export preserves the demonstration trail.",
              priority: "low",
              module: "system",
            },
          ],
    demoMode: true,
  };
}
