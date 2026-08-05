import { z } from "zod";
import type { DiagnosticReport, Finding, Recommendation } from "@/lib/toolkit/types";

const STORAGE_KEY = "kilo-toolkit-reports-v1";

const findingSchema: z.ZodType<Finding> = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  explanation: z.string(),
  causes: z.array(z.string()),
  nextStep: z.string(),
});

const recommendationSchema: z.ZodType<Recommendation> = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  reason: z.string().optional(),
  benefit: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  module: z.enum(["system", "memory", "network"]),
});

const reportSchema: z.ZodType<DiagnosticReport> = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  overallStatus: z.enum(["healthy", "attention", "critical"]),
  healthScore: z.number().optional(),
  systemSummary: z.string().optional(),
  activeProfile: z.string().optional(),
  systemFindings: z.array(findingSchema),
  memoryFindings: z.array(findingSchema),
  networkFindings: z.array(findingSchema),
  recommendations: z.array(recommendationSchema),
  demoMode: z.literal(true),
});

const reportsSchema = z.array(reportSchema);

export type ReportReadResult = {
  reports: DiagnosticReport[];
  status: "ready" | "empty" | "malformed" | "unavailable";
};

export type ReportExportFormat = "json" | "txt" | "pdf";

export function readReportsResult(): ReportReadResult {
  if (typeof window === "undefined") return { reports: [], status: "unavailable" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { reports: [], status: "empty" };
    const result = reportsSchema.safeParse(JSON.parse(raw));
    return result.success
      ? { reports: result.data, status: "ready" }
      : { reports: [], status: "malformed" };
  } catch {
    return { reports: [], status: "malformed" };
  }
}

export function readReports(): DiagnosticReport[] {
  return readReportsResult().reports;
}

export function writeReports(reports: DiagnosticReport[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reportsSchema.parse(reports)));
}

export function saveReport(report: DiagnosticReport) {
  const reports = readReports();
  writeReports([report, ...reports.filter((item) => item.id !== report.id)]);
}

export function deleteReport(id: string) {
  writeReports(readReports().filter((report) => report.id !== id));
}

export function clearReports() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}

function reportFilename(report: DiagnosticReport, extension: string) {
  return `${report.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatReportText(report: DiagnosticReport) {
  const lines = [
    "KILO TOOLKIT · DIAGNOSTIC REPORT",
    "================================",
    `Name: ${report.name}`,
    `Generated: ${new Date(report.createdAt).toLocaleString()}`,
    `Overall status: ${report.overallStatus}`,
    `Health score: ${report.healthScore ?? "n/a"}`,
    `Active profile: ${report.activeProfile ?? "n/a"}`,
    `Summary: ${report.systemSummary ?? "Demo Mode diagnostic session"}`,
    "",
    "RECOMMENDATIONS",
    "---------------",
    ...report.recommendations.map(
      (item) =>
        `• [${item.priority.toUpperCase()}] ${item.title}\n  Reason: ${item.reason ?? item.description}\n  Benefit: ${item.benefit ?? "Improves session stability."}`,
    ),
    "",
    "SYSTEM FINDINGS",
    ...report.systemFindings.map((item) => `• ${item.title} — ${item.explanation}`),
    "",
    "MEMORY FINDINGS",
    ...report.memoryFindings.map((item) => `• ${item.title} — ${item.explanation}`),
    "",
    "NETWORK FINDINGS",
    ...report.networkFindings.map((item) => `• ${item.title} — ${item.explanation}`),
    "",
    "Demo Mode — illustrative diagnostic data only.",
  ];
  return lines.join("\n");
}

export function exportReport(report: DiagnosticReport, format: ReportExportFormat = "json") {
  if (format === "json") {
    downloadBlob(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
      reportFilename(report, "json"),
    );
    return;
  }

  if (format === "txt") {
    downloadBlob(
      new Blob([formatReportText(report)], { type: "text/plain" }),
      reportFilename(report, "txt"),
    );
    return;
  }

  // PDF: open a print-ready HTML document the user can save as PDF.
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) return;
  const recommendations = report.recommendations
    .map(
      (item) =>
        `<li><strong>${item.title}</strong> (${item.priority})<br/>${item.reason ?? item.description}<br/><em>${item.benefit ?? ""}</em></li>`,
    )
    .join("");
  printWindow.document.write(`<!doctype html><html><head><title>${report.name}</title>
<style>
  body{font:15px/1.55 system-ui,sans-serif;max-width:820px;margin:40px auto;padding:0 24px;color:#171717}
  h1,h2{line-height:1.2} .meta{color:#555} .notice{padding:12px;background:#f4f4f4;border-radius:8px;margin:16px 0}
  li{margin:10px 0}
</style></head><body>
<p><strong>KILO TOOLKIT</strong></p>
<h1>${report.name}</h1>
<p class="meta">${new Date(report.createdAt).toLocaleString()} · Status: ${report.overallStatus} · Health: ${report.healthScore ?? "n/a"} · Profile: ${report.activeProfile ?? "n/a"}</p>
<p class="notice">Demo Mode — illustrative diagnostic data. This report was not collected from the visitor’s computer.</p>
<p>${report.systemSummary ?? "Unified diagnostic session across SystemScope, MemoryMedic, and NetCheck."}</p>
<h2>Recommendations</h2><ul>${recommendations}</ul>
<script>window.print()</script>
</body></html>`);
  printWindow.document.close();
}
