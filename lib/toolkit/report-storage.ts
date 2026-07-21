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
  priority: z.enum(["low", "medium", "high"]),
  module: z.enum(["system", "memory", "network"]),
});

const reportSchema: z.ZodType<DiagnosticReport> = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  overallStatus: z.enum(["healthy", "attention", "critical"]),
  systemFindings: z.array(findingSchema),
  memoryFindings: z.array(findingSchema),
  networkFindings: z.array(findingSchema),
  recommendations: z.array(recommendationSchema),
  demoMode: z.literal(true),
});

const reportsSchema = z.array(reportSchema);

export function readReports(): DiagnosticReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const result = reportsSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : [];
  } catch {
    return [];
  }
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

export function exportReport(report: DiagnosticReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${report.name.toLowerCase().replaceAll(" ", "-")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
