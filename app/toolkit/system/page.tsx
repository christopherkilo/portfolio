"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useToolkit } from "@/components/toolkit/ToolkitContext";
import { ChartPanel, FindingCard, LoadingPanel, MetricCard, ModuleHeader, StatusBadge } from "@/components/toolkit/ToolkitUI";
import { toolkitProviders } from "@/lib/toolkit/providers/mock-providers";
import type { MetricPoint, SystemSnapshot } from "@/lib/toolkit/types";

const history = (value: number): MetricPoint[] =>
  Array.from({ length: 16 }, (_, index) => ({ time: String(index + 1), value: Math.max(0, value - 5 + Math.sin(index / 2) * 5) }));

export default function SystemScopePage() {
  const { system, loading, settings } = useToolkit();
  const [liveMetrics, setLiveMetrics] = useState<SystemSnapshot["metrics"] | null>(null);
  const [paused, setPaused] = useState(false);
  const [series, setSeries] = useState<Record<keyof SystemSnapshot["metrics"], MetricPoint[]> | null>(null);
  const metrics = liveMetrics ?? system?.metrics ?? null;
  const baseSeries = useMemo(() => system ? {
    cpu: history(system.metrics.cpu),
    memory: history(system.metrics.memory),
    disk: history(system.metrics.disk),
    gpu: history(system.metrics.gpu),
    network: history(system.metrics.network),
  } : null, [system]);
  const chartSeries = series ?? baseSeries;

  useEffect(() => {
    if (paused || !metrics) return;
    const timer = window.setInterval(async () => {
      const next = await toolkitProviders.system.getLiveMetrics(metrics);
      setLiveMetrics(next);
      setSeries((current) => {
        const source = current ?? chartSeries;
        if (!source) return current;
        return Object.fromEntries(
          (Object.keys(next) as (keyof typeof next)[]).map((key) => [
            key,
            [...source[key].slice(-19), { time: String(Date.now()), value: next[key] }],
          ]),
        ) as Record<keyof SystemSnapshot["metrics"], MetricPoint[]>;
      });
    }, settings.refreshSpeed);
    return () => window.clearInterval(timer);
  }, [paused, metrics, settings.refreshSpeed, chartSeries]);

  if (loading || !system || !metrics || !chartSeries) return <LoadingPanel label="Loading SystemScope…" />;

  return (
    <div className="space-y-8">
      <ModuleHeader eyebrow="Hardware & performance" title="SystemScope" description="A clear simulated hardware inventory with live performance trends, storage health, and practical diagnostic findings." action={<button type="button" onClick={() => setPaused((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-muted hover:text-text">{paused ? <Play className="size-4" /> : <Pause className="size-4" />}{paused ? "Resume" : "Pause"} simulation</button>} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Device" value={system.deviceName} detail={`${system.manufacturer} · ${system.model}`} />
        <MetricCard label="Operating system" value="Windows 11 Pro" detail={`${system.architecture} · ${system.uptime} uptime`} />
        <MetricCard label="Overall health" value={`${system.health} / 100`} detail="Stable with two advisories" />
        <MetricCard label="Provider status" value="Available" detail="MockSystemDataProvider" icon={<RotateCcw className="size-4" />} />
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Hardware inventory</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {system.hardware.map((item) => <details key={item.id} className="group rounded-2xl border border-white/8 bg-white/[0.03] p-4"><summary className="cursor-pointer list-none"><p className="text-xs uppercase tracking-wider text-muted">{item.label}</p><p className="mt-2 font-medium text-text">{item.value}</p></summary><p className="mt-3 border-t border-white/7 pt-3 text-sm text-muted">{item.detail}</p></details>)}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Live performance</h2><span className="inline-flex items-center gap-2 text-xs text-muted"><span className={`size-1.5 rounded-full ${paused ? "bg-amber-300" : "bg-emerald-400"}`} />{paused ? "Paused" : `Refreshing every ${settings.refreshSpeed / 1000}s`}</span></div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <ChartPanel title={`CPU · ${metrics.cpu}%`} data={chartSeries.cpu} summary={`CPU usage is ${metrics.cpu} percent.`} />
          <ChartPanel title={`Memory · ${metrics.memory}%`} data={chartSeries.memory} summary={`Memory usage is ${metrics.memory} percent.`} />
          <ChartPanel title={`Disk · ${metrics.disk}%`} data={chartSeries.disk} summary={`Disk activity is ${metrics.disk} percent.`} />
          <ChartPanel title={`GPU · ${metrics.gpu}%`} data={chartSeries.gpu} summary={`GPU usage is ${metrics.gpu} percent.`} />
          <ChartPanel title={`Network · ${metrics.network} Mbps`} data={chartSeries.network} unit="" summary={`Network throughput is ${metrics.network} megabits per second.`} />
        </div>
      </section>

      <section id="storage" className="scroll-mt-24">
        <h2 className="mb-4 font-display text-xl font-semibold">Storage</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {system.drives.map((drive) => {
            const used = Math.round((drive.usedGb / drive.capacityGb) * 100);
            return <article key={drive.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"><div className="flex items-start justify-between"><div><p className="font-display text-lg font-semibold">{drive.mount} · {drive.model}</p><p className="mt-1 text-sm text-muted">{drive.type} · {drive.fileSystem}</p></div><StatusBadge status={drive.status} /></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full bg-secondary" style={{ width: `${used}%` }} /></div><div className="mt-3 flex justify-between text-xs text-muted"><span>{drive.usedGb} GB used of {drive.capacityGb} GB</span><span>{drive.health}% estimated health</span></div></article>;
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
        <div><h2 className="mb-4 font-display text-xl font-semibold">Health findings</h2><div className="space-y-3">{system.findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)}</div></div>
        <aside className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"><h2 className="font-display text-xl font-semibold">Recommended actions</h2><ol className="mt-4 space-y-4 text-sm text-muted"><li className="flex gap-3"><span className="font-mono text-primary">01</span>Recover at least 15% free space on the system drive.</li><li className="flex gap-3"><span className="font-mono text-primary">02</span>Schedule a normal restart after saving active work.</li><li className="flex gap-3"><span className="font-mono text-primary">03</span>Maintain tested backups and monitor drive-health trends.</li></ol></aside>
      </section>
    </div>
  );
}
