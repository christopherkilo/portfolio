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
    setReports(reports.map((item) => item.id === report.id ? { ...item, name } : item));
  }

  function duplicate(report: DiagnosticReport) {
    setReports([{ ...report, id: crypto.randomUUID(), name: `${report.name} copy`, createdAt: new Date().toISOString() }, ...reports]);
  }

  function remove(report: DiagnosticReport) {
    if (window.confirm(`Delete “${report.name}”?`)) setReports(reports.filter((item) => item.id !== report.id));
  }

  function printReport(report: DiagnosticReport) {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><title>${report.name}</title><style>body{font:15px/1.5 system-ui;max-width:850px;margin:40px auto;padding:0 24px;color:#171717}h1,h2{line-height:1.15}.notice{padding:12px;background:#f4f4f4;border-radius:8px}.finding{border-top:1px solid #ddd;padding:12px 0}</style></head><body><p>KILO TOOLKIT</p><h1>${report.name}</h1><p>${new Date(report.createdAt).toLocaleString()} · ${report.overallStatus}</p><p class="notice">DEMO MODE — SIMULATED SYSTEM DATA. This report does not contain diagnostics read from the visitor’s computer.</p>${[
      ["System findings", report.systemFindings],
      ["Memory findings", report.memoryFindings],
      ["Network findings", report.networkFindings],
    ].map(([title, findings]) => `<h2>${title}</h2>${(findings as DiagnosticReport["systemFindings"]).map((finding) => `<div class="finding"><strong>${finding.title}</strong><p>${finding.explanation}</p><p>Next step: ${finding.nextStep}</p></div>`).join("")}`).join("")}<script>window.print()</script></body></html>`);
    printWindow.document.close();
  }

  return (
    <div className="space-y-8">
      <ModuleHeader eyebrow="Saved diagnostics" title="Reports" description="Review, rename, duplicate, print, and export locally saved simulated diagnostic sessions." action={<DemoModeBadge compact />} />
      {reports.length === 0 ? (
        <section className="grid min-h-[420px] place-items-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
          <div className="max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/[0.05]"><FileText className="size-6 text-secondary" /></span><h2 className="mt-5 font-display text-2xl font-semibold">No saved reports yet</h2><p className="mt-2 text-sm leading-relaxed text-muted">Run a Full Scan from the top status bar. Completed Demo Mode scans are validated and stored locally in this browser.</p></div>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {reports.map((report) => (
            <article key={report.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-xl font-semibold">{report.name}</h2><StatusBadge status={report.overallStatus} /></div><p className="mt-1 text-xs text-muted">{new Date(report.createdAt).toLocaleString()}</p></div><DemoModeBadge compact /></div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center"><div className="rounded-xl bg-black/20 p-3"><p className="font-display text-xl">{report.systemFindings.length}</p><p className="text-[10px] uppercase tracking-wider text-muted">System</p></div><div className="rounded-xl bg-black/20 p-3"><p className="font-display text-xl">{report.memoryFindings.length}</p><p className="text-[10px] uppercase tracking-wider text-muted">Memory</p></div><div className="rounded-xl bg-black/20 p-3"><p className="font-display text-xl">{report.networkFindings.length}</p><p className="text-[10px] uppercase tracking-wider text-muted">Network</p></div></div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Action label="Rename" icon={<Pencil />} onClick={() => rename(report)} />
                <Action label="Duplicate" icon={<Copy />} onClick={() => duplicate(report)} />
                <Action label="Print HTML" icon={<Printer />} onClick={() => printReport(report)} />
                <Action label="Export JSON" icon={<Download />} onClick={() => exportReport(report)} />
                <Action label="Delete" icon={<Trash2 />} onClick={() => remove(report)} danger />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Action({ label, icon, onClick, danger = false }: { label: string; icon: React.ReactElement<{ className?: string }>; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl border border-white/8 px-3 py-2 text-xs transition hover:bg-white/5 ${danger ? "text-rose-300" : "text-muted hover:text-text"}`}>{icon && <span className="[&_svg]:size-3.5">{icon}</span>}{label}</button>;
}
