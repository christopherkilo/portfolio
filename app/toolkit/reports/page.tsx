"use client";

import { Copy, Download, FileText, Pencil, Printer, Trash2 } from "lucide-react";
import { useToolkit } from "@/components/toolkit/ToolkitContext";
import { DemoModeBadge, ModuleHeader, StatusBadge } from "@/components/toolkit/ToolkitUI";
import { exportReport } from "@/lib/toolkit/report-storage";
import type { DiagnosticReport } from "@/lib/toolkit/types";

export default function ReportsPage() {
  const { reports, setReports } = useToolkit();

  function rename(report: DiagnosticReport) {
    const name = window.prompt("Report name", report.name)?.trim();
    if (!name) return;
    setReports(reports.map((item) => (item.id === report.id ? { ...item, name } : item)));
  }

  function duplicate(report: DiagnosticReport) {
    setReports([
      {
        ...report,
        id: crypto.randomUUID(),
        name: `${report.name} copy`,
        createdAt: new Date().toISOString(),
      },
      ...reports,
    ]);
  }

  function remove(report: DiagnosticReport) {
    if (window.confirm(`Delete “${report.name}”?`)) {
      setReports(reports.filter((item) => item.id !== report.id));
    }
  }

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Saved diagnostics"
        title="Reports"
        description="Review, rename, duplicate, and export diagnostic sessions as JSON, TXT, or print-ready PDF."
        action={<DemoModeBadge compact />}
      />
      {reports.length === 0 ? (
        <section className="grid min-h-[420px] place-items-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/[0.05]">
              <FileText className="size-6 text-secondary" />
            </span>
            <h2 className="mt-5 font-display text-2xl font-semibold">No saved reports yet</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Run a Full Scan from the top status bar. Completed scans are validated and stored locally
              in this browser.
            </p>
          </div>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {reports.map((report) => (
            <article key={report.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold">{report.name}</h2>
                    <StatusBadge status={report.overallStatus} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(report.createdAt).toLocaleString()}
                    {typeof report.healthScore === "number" ? ` · Health ${report.healthScore}` : ""}
                    {report.activeProfile ? ` · ${report.activeProfile}` : ""}
                  </p>
                </div>
              </div>
              {report.systemSummary ? (
                <p className="mt-4 text-sm leading-relaxed text-muted">{report.systemSummary}</p>
              ) : null}
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-black/20 p-3">
                  <p className="font-display text-xl">{report.systemFindings.length}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted">System</p>
                </div>
                <div className="rounded-xl bg-black/20 p-3">
                  <p className="font-display text-xl">{report.memoryFindings.length}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted">Memory</p>
                </div>
                <div className="rounded-xl bg-black/20 p-3">
                  <p className="font-display text-xl">{report.networkFindings.length}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted">Network</p>
                </div>
              </div>
              {report.recommendations.length ? (
                <ul className="mt-4 space-y-2 text-sm text-muted">
                  {report.recommendations.slice(0, 2).map((item) => (
                    <li key={item.id} className="rounded-xl bg-black/20 p-3">
                      <strong className="text-text">{item.title}</strong>
                      <span className="mt-1 block text-xs">
                        {item.reason ?? item.description}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2">
                <Action label="Rename" icon={<Pencil />} onClick={() => rename(report)} />
                <Action label="Duplicate" icon={<Copy />} onClick={() => duplicate(report)} />
                <Action label="Export PDF" icon={<Printer />} onClick={() => exportReport(report, "pdf")} />
                <Action label="Export TXT" icon={<FileText />} onClick={() => exportReport(report, "txt")} />
                <Action label="Export JSON" icon={<Download />} onClick={() => exportReport(report, "json")} />
                <Action label="Delete" icon={<Trash2 />} onClick={() => remove(report)} danger />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Action({
  label,
  icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: React.ReactElement<{ className?: string }>;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border border-white/8 px-3 py-2 text-xs transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${danger ? "text-rose-300" : "text-muted hover:text-text"}`}
    >
      {icon && <span className="[&_svg]:size-3.5">{icon}</span>}
      {label}
    </button>
  );
}
