"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useToolkit } from "@/components/toolkit/ToolkitContext";
import {
  CapacityBar,
  ChartPanel,
  FindingCard,
  LoadingPanel,
  MetricCard,
  ModuleHeader,
  ModuleStatusBadge,
  StatusBadge,
} from "@/components/toolkit/ToolkitUI";
import type { MetricPoint, SystemSnapshot } from "@/lib/toolkit/types";

const history = (value: number): MetricPoint[] =>
  Array.from({ length: 16 }, (_, index) => ({
    time: String(index + 1),
    value: Math.max(0, value - 4 + Math.sin(index / 2.2) * 3.5),
  }));

type SeriesMap = Record<keyof SystemSnapshot["metrics"], MetricPoint[]>;

export default function SystemScopePage() {
  const { system, liveMetrics, healthScore, loading, settings, activeProfileId } = useToolkit();
  const [paused, setPaused] = useState(false);

  const baseSeries = useMemo<SeriesMap | null>(
    () =>
      system
        ? {
            cpu: history(system.metrics.cpu),
            memory: history(system.metrics.memory),
            disk: history(system.metrics.disk),
            gpu: history(system.metrics.gpu),
            network: history(system.metrics.network),
          }
        : null,
    // Reset chart seed when profile or underlying snapshot changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeProfileId intentionally forces rebuild
    [activeProfileId, system],
  );

  const [series, setSeries] = useState<SeriesMap | null>(null);
  const [seriesProfile, setSeriesProfile] = useState(activeProfileId);

  // Reset chart history when the simulation profile changes (React-recommended render-time adjustment).
  if (seriesProfile !== activeProfileId) {
    setSeriesProfile(activeProfileId);
    setSeries(baseSeries);
  }

  const chartSeries = series ?? baseSeries;
  const metrics = liveMetrics ?? system?.metrics ?? null;

  useEffect(() => {
    if (!liveMetrics || paused) return;
    const frame = window.requestAnimationFrame(() => {
      setSeries((current) => {
        const source = current ?? baseSeries;
        if (!source) return current;
        return Object.fromEntries(
          (Object.keys(liveMetrics) as (keyof typeof liveMetrics)[]).map((key) => [
            key,
            [...source[key].slice(-19), { time: String(Date.now()), value: liveMetrics[key] }],
          ]),
        ) as SeriesMap;
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [liveMetrics, paused, baseSeries]);

  if (loading || !system || !metrics || !chartSeries) {
    return <LoadingPanel label="Loading SystemScope…" />;
  }

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Hardware & performance"
        title="SystemScope"
        description="Hardware inventory with live performance trends, storage capacity, and practical findings."
        action={
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-muted transition hover:border-white/20 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            {paused ? "Resume" : "Pause"} chart updates
          </button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Device" value={system.deviceName} detail={`${system.manufacturer} · ${system.model}`} />
        <MetricCard
          label="Operating system"
          value="Windows 11 Pro"
          detail={`${system.architecture} · ${system.uptime} uptime`}
        />
        <MetricCard
          label="Overall health"
          numericValue={healthScore}
          suffix=" / 100"
          detail="Profile-driven health"
        />
        <article className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">Provider status</p>
          <div className="mt-3 flex items-center gap-2">
            <ModuleStatusBadge score={healthScore} />
            <RotateCcw className="size-4 text-muted" />
          </div>
          <p className="mt-2 text-xs text-muted">MockSystemDataProvider</p>
        </article>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Hardware inventory</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {system.hardware.map((item) => (
            <details
              key={item.id}
              className="group rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/14"
            >
              <summary className="cursor-pointer list-none">
                <p className="text-xs uppercase tracking-wider text-muted">{item.label}</p>
                <p className="mt-2 font-medium text-text">{item.value}</p>
              </summary>
              <p className="mt-3 border-t border-white/7 pt-3 text-sm text-muted">{item.detail}</p>
            </details>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Live performance</h2>
          <span className="inline-flex items-center gap-2 text-xs text-muted">
            <span className={`size-1.5 rounded-full ${paused ? "bg-amber-300" : "bg-emerald-400"}`} />
            {paused
              ? "Charts paused"
              : settings.autoRefresh
                ? `Refreshing every ${settings.refreshSpeed / 1000}s`
                : "Auto refresh off"}
          </span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <ChartPanel
            title={`CPU · ${metrics.cpu}%`}
            data={chartSeries.cpu}
            summary={`CPU usage is ${metrics.cpu} percent.`}
            animate={settings.animations}
          />
          <ChartPanel
            title={`Memory · ${metrics.memory}%`}
            data={chartSeries.memory}
            summary={`Memory usage is ${metrics.memory} percent.`}
            animate={settings.animations}
          />
          <ChartPanel
            title={`Disk · ${metrics.disk}%`}
            data={chartSeries.disk}
            summary={`Disk activity is ${metrics.disk} percent.`}
            animate={settings.animations}
          />
          <ChartPanel
            title={`GPU · ${metrics.gpu}%`}
            data={chartSeries.gpu}
            summary={`GPU usage is ${metrics.gpu} percent.`}
            animate={settings.animations}
          />
          <ChartPanel
            title={`Network · ${metrics.network} Mbps`}
            data={chartSeries.network}
            unit=""
            summary={`Network throughput is ${metrics.network} megabits per second.`}
            animate={settings.animations}
          />
        </div>
      </section>

      <section id="storage" className="scroll-mt-[var(--scroll-mt)]">
        <h2 className="mb-4 font-display text-xl font-semibold">Storage</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {system.drives.map((drive) => {
            const usedPercent = Math.round((drive.usedGb / drive.capacityGb) * 100);
            const freeGb = drive.capacityGb - drive.usedGb;
            const reservedGb = Math.round(drive.capacityGb * 0.03);
            return (
              <article
                key={drive.id}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition hover:border-white/14"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-lg font-semibold">
                      {drive.mount} · {drive.model}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {drive.type} · {drive.fileSystem}
                    </p>
                  </div>
                  <StatusBadge status={drive.status} />
                </div>
                <div className="mt-5">
                  <CapacityBar
                    usedPercent={usedPercent}
                    usedLabel={`${drive.usedGb} GB`}
                    freeLabel={`${freeGb} GB`}
                    reservedLabel={`~${reservedGb} GB`}
                  />
                </div>
                <div className="mt-3 flex justify-between text-xs text-muted">
                  <span>
                    {drive.usedGb} GB used of {drive.capacityGb} GB
                  </span>
                  <span>{drive.health}% estimated health</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
        <div>
          <h2 className="mb-4 font-display text-xl font-semibold">Health findings</h2>
          <div className="space-y-3">
            {system.findings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        </div>
        <aside className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <h2 className="font-display text-xl font-semibold">Recommended actions</h2>
          <ol className="mt-4 space-y-4 text-sm text-muted">
            <li className="flex gap-3">
              <span className="font-mono text-primary">01</span>
              Recover at least 15% free space on the system drive.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-primary">02</span>
              Schedule a normal restart after saving active work.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-primary">03</span>
              Maintain tested backups and monitor drive-health trends.
            </li>
          </ol>
        </aside>
      </section>
    </div>
  );
}
