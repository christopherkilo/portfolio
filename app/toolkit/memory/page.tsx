"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Filter, Search } from "lucide-react";
import { useToolkit } from "@/components/toolkit/ToolkitContext";
import { ChartPanel, FindingCard, LoadingPanel, MetricCard, ModuleHeader, StatusBadge } from "@/components/toolkit/ToolkitUI";
import { recommendRam } from "@/lib/toolkit/recommendation-engine";
import type { ProcessRecord } from "@/lib/toolkit/types";

const workloads = ["Office and browsing", "Programming", "Graphic design", "Gaming", "Video editing", "Virtual machines", "Mixed professional use"];

export default function MemoryMedicPage() {
  const { memory, loading } = useToolkit();
  const [range, setRange] = useState<"5m" | "30m" | "1h">("5m");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [highOnly, setHighOnly] = useState(false);
  const [sort, setSort] = useState<"memory" | "name">("memory");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ram, setRam] = useState(16);
  const [workload, setWorkload] = useState("Programming");
  const [appCount, setAppCount] = useState(8);
  const [gaming, setGaming] = useState(false);
  const [vms, setVms] = useState(false);
  const [creative, setCreative] = useState(false);
  const [future, setFuture] = useState("Similar");
  const [showRecommendation, setShowRecommendation] = useState(false);

  const processes = useMemo(() => {
    if (!memory) return [];
    return [...memory.processes]
      .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
      .filter((item) => category === "All" || item.category === category)
      .filter((item) => !highOnly || item.memoryMb >= 1000)
      .sort((a, b) => sort === "memory" ? b.memoryMb - a.memoryMb : a.name.localeCompare(b.name));
  }, [memory, query, category, highOnly, sort]);

  if (loading || !memory) return <LoadingPanel label="Loading MemoryMedic…" />;

  const recommendation = recommendRam({
    installedGb: ram,
    workload,
    applicationCount: appCount,
    gaming,
    virtualMachines: vms,
    creativeWork: creative,
    futureWorkload: future as "Similar" | "Moderately heavier" | "Significantly heavier",
  });

  return (
    <div className="space-y-8">
      <ModuleHeader eyebrow="Memory analysis" title="MemoryMedic" description="Understand what is consuming RAM, identify pressure patterns, and turn workload details into practical upgrade guidance." />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Installed memory" value={`${memory.installedGb} GB`} detail="DDR5 · dual channel" />
        <MetricCard label="Memory in use" value={`${memory.inUseGb} GB`} detail={`${memory.usagePercent}% utilized`} />
        <MetricCard label="Available" value={`${memory.availableGb} GB`} detail={`${memory.cachedGb} GB cached`} />
        <MetricCard label="Committed" value={`${memory.committedGb} GB`} detail={`${memory.compressedMb} MB compressed`} />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl font-semibold">Usage timeline</h2><div className="flex rounded-xl border border-white/8 bg-white/[0.03] p-1">{(["5m", "30m", "1h"] as const).map((item) => <button type="button" key={item} onClick={() => setRange(item)} className={`rounded-lg px-3 py-1.5 text-xs ${range === item ? "bg-white/10 text-text" : "text-muted"}`}>{item === "5m" ? "Last 5 minutes" : item === "30m" ? "Last 30 minutes" : "Last hour"}</button>)}</div></div>
        <ChartPanel title="Memory utilization" data={memory.timeline[range]} summary={`Memory usage over the selected simulated range averages near ${memory.usagePercent} percent.`} />
      </section>

      <section id="processes" className="scroll-mt-24">
        <h2 className="font-display text-xl font-semibold">Process explorer</h2>
        <p className="mt-1 text-sm text-muted">Simulated process categories teach diagnostic reasoning. Browser Demo Mode cannot end real processes.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <label className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3"><Search className="size-4 text-muted" /><span className="sr-only">Search processes</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search processes…" className="w-full bg-transparent py-2.5 text-sm outline-none" /></label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter process category" className="rounded-xl border border-white/8 bg-[#0a0a0a] px-3 py-2 text-sm text-muted"><option>All</option>{[...new Set(memory.processes.map((item) => item.category))].map((item) => <option key={item}>{item}</option>)}</select>
          <select value={sort} onChange={(event) => setSort(event.target.value as "memory" | "name")} aria-label="Sort processes" className="rounded-xl border border-white/8 bg-[#0a0a0a] px-3 py-2 text-sm text-muted"><option value="memory">Memory high to low</option><option value="name">Name A–Z</option></select>
          <button type="button" onClick={() => setHighOnly((value) => !value)} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm ${highOnly ? "border-primary/30 bg-primary/[0.08] text-primary" : "border-white/8 text-muted"}`}><Filter className="size-4" />High memory</button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/8">
          <div className="hidden grid-cols-[1.4fr_1fr_.8fr_.7fr_.7fr] gap-3 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-wider text-muted md:grid"><span>Process</span><span>Category</span><span>Memory</span><span>Status</span><span>Guidance</span></div>
          {processes.length ? processes.map((process) => <ProcessRow key={process.id} process={process} open={expanded === process.id} onToggle={() => setExpanded(expanded === process.id ? null : process.id)} />) : <p className="p-8 text-center text-sm text-muted">No simulated processes match these filters.</p>}
        </div>
      </section>

      <section><h2 className="mb-4 font-display text-xl font-semibold">Memory findings</h2><div className="grid gap-3 lg:grid-cols-2">{memory.findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)}</div></section>

      <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-5 sm:p-6">
        <h2 className="font-display text-2xl font-semibold">RAM recommendation tool</h2>
        <p className="mt-2 text-sm text-muted">Answer a few workload questions to receive general capacity guidance.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm text-muted">Current installed RAM<select value={ram} onChange={(event) => setRam(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-white/8 bg-[#0a0a0a] p-3 text-text"><option value={8}>8 GB</option><option value={16}>16 GB</option><option value={32}>32 GB</option><option value={64}>64 GB</option></select></label>
          <label className="text-sm text-muted">Primary workload<select value={workload} onChange={(event) => setWorkload(event.target.value)} className="mt-2 w-full rounded-xl border border-white/8 bg-[#0a0a0a] p-3 text-text">{workloads.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm text-muted">Applications commonly open<input type="range" min="2" max="24" value={appCount} onChange={(event) => setAppCount(Number(event.target.value))} className="mt-4 w-full accent-[#f8e71c]" /><span className="mt-1 block text-text">{appCount} applications</span></label>
          <Toggle label="Regular gaming" checked={gaming} onChange={setGaming} />
          <Toggle label="Virtual machines" checked={vms} onChange={setVms} />
          <Toggle label="Design or video editing" checked={creative} onChange={setCreative} />
          <label className="text-sm text-muted">Expected future workload<select value={future} onChange={(event) => setFuture(event.target.value)} className="mt-2 w-full rounded-xl border border-white/8 bg-[#0a0a0a] p-3 text-text"><option>Similar</option><option>Moderately heavier</option><option>Significantly heavier</option></select></label>
        </div>
        <button type="button" onClick={() => setShowRecommendation(true)} className="mt-6 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-primary">Generate recommendation</button>
        {showRecommendation ? <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.05] p-5"><p className="font-display text-xl font-semibold">{recommendation.headline}</p><p className="mt-2 text-sm leading-relaxed text-muted">Your {recommendation.reasoning} Your current {ram} GB configuration {recommendation.meetsTarget ? "already meets this general target" : "may become constrained during peak multitasking"}.</p><p className="mt-3 text-xs text-muted">General guidance only. Verify motherboard, processor, module type, speed, capacity, and vendor compatibility before purchasing RAM.</p></div> : null}
      </section>
    </div>
  );
}

function ProcessRow({ process, open, onToggle }: { process: ProcessRecord; open: boolean; onToggle: () => void }) {
  return <div className="border-t border-white/7 first:border-t-0"><button type="button" onClick={onToggle} className="grid w-full gap-2 px-4 py-3 text-left text-sm md:grid-cols-[1.4fr_1fr_.8fr_.7fr_.7fr] md:items-center"><span className="font-medium text-text">{process.name}</span><span className="text-muted">{process.category}</span><span>{process.memoryMb.toLocaleString()} MB <small className="text-muted">({process.percentage}%)</small></span><span><StatusBadge status={process.status} /></span><span className="flex items-center gap-2 text-xs text-muted">{process.recommendation ? "View recommendation" : "No action"}<ChevronDown className={`size-3 transition ${open ? "rotate-180" : ""}`} /></span></button>{open ? <div className="bg-black/20 px-4 py-4 text-sm text-muted"><strong className="text-secondary">Recommendation:</strong> {process.recommendation ?? "This simulated process is within its expected working range. Continue monitoring trends rather than reacting to one sample."}</div> : null}</div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center justify-between rounded-xl border border-white/8 p-3 text-sm text-muted"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-[#f8e71c]" /></label>;
}
