"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Cable,
  CheckCircle2,
  CircleDot,
  Laptop,
  Network,
  Play,
  Printer,
  Router,
  Smartphone,
  Tv,
  Wifi,
} from "lucide-react";
import { useToolkit } from "@/components/toolkit/ToolkitContext";
import { LoadingPanel, MetricCard, ModuleHeader, ModuleStatusBadge, Sparkline } from "@/components/toolkit/ToolkitUI";
import { networkHistorySeed, toolkitProviders } from "@/lib/toolkit/providers/mock-providers";
import { ISSUE_CATEGORIES, TROUBLESHOOTING_TREES } from "@/lib/toolkit/troubleshooting-trees";
import type { NetworkSnapshot, TroubleshootingNode } from "@/lib/toolkit/types";

const testStages = [
  "Locating test endpoint",
  "Testing latency",
  "Measuring download",
  "Measuring upload",
  "Checking packet stability",
];
const deviceIcons = {
  router: Router,
  desktop: Network,
  laptop: Laptop,
  phone: Smartphone,
  printer: Printer,
  tv: Tv,
  storage: CircleDot,
};

export default function NetCheckPage() {
  const { network, loading } = useToolkit();
  const [testedQuality, setTestedQuality] = useState<NetworkSnapshot["quality"] | null>(null);
  const [testing, setTesting] = useState(false);
  const [testStage, setTestStage] = useState(0);
  const [issue, setIssue] = useState<string | null>(null);
  const [nodeId, setNodeId] = useState("start");

  const quality = testedQuality ?? network?.quality;
  const history = useMemo(
    () => (quality ? networkHistorySeed(quality.latency) : null),
    // Re-seed when latency changes after a connection test
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quality?.latency],
  );

  useEffect(() => {
    if (!testing) return;
    if (testStage >= testStages.length) {
      void toolkitProviders.network.runConnectionTest().then((result) => {
        setTestedQuality(result);
        setTesting(false);
      });
      return;
    }
    const timer = window.setTimeout(() => setTestStage((value) => value + 1), 420);
    return () => window.clearTimeout(timer);
  }, [testing, testStage]);

  if (loading || !network || !quality || !history) return <LoadingPanel label="Loading NetCheck…" />;

  const tree = issue ? TROUBLESHOOTING_TREES[issue] : null;
  const node = tree?.find((item) => item.id === nodeId);

  function runTest() {
    setTestStage(0);
    setTesting(true);
  }

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Connectivity & troubleshooting"
        title="NetCheck"
        description="Connection health, latency trends, DNS comparison, adapters, and guided troubleshooting."
      />

      <section className="rounded-3xl border border-white/8 bg-surface/90 shadow-[var(--card-shadow)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-display text-xl font-semibold">
              <span className="size-2 rounded-full bg-success" />
              Connected via {network.connectionType}
            </p>
            <p className="mt-2 text-sm text-muted">Demo Mode network profile for this session.</p>
          </div>
          <div className="flex items-center gap-2">
            <ModuleStatusBadge score={quality.score} />
            <span className="rounded-full border border-white/8 px-3 py-1.5 font-mono text-xs text-muted">
              {network.link}
            </span>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Local IPv4", network.ipv4],
              ["Gateway", network.gateway],
              ["DNS provider", network.dnsProvider],
              ["Public IP", network.publicIp],
              ["Network profile", network.profile],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-xl bg-black/20 p-3">
              <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
              <dd className="mt-1 font-mono text-sm text-text">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="connection-test" className="scroll-mt-[var(--scroll-mt)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">Quality metrics</h2>
            <p className="mt-1 text-sm text-muted">Live trends with a short staged connection test.</p>
          </div>
          <button
            type="button"
            disabled={testing}
            onClick={runTest}
            className="inline-flex items-center gap-2 tk-btn-primary px-4 py-2 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Play className="size-4" />
            {testing ? "Testing…" : "Run Connection Test"}
          </button>
        </div>
        {testing ? (
          <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
            <div className="flex items-center gap-3">
              <span className="size-4 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
              <p className="text-sm">{testStages[Math.min(testStage, testStages.length - 1)]}</p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${Math.round((testStage / testStages.length) * 100)}%` }}
              />
            </div>
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Download" numericValue={quality.download} suffix=" Mbps" />
          <MetricCard label="Upload" numericValue={quality.upload} suffix=" Mbps" />
          <MetricCard
            label="Latency"
            numericValue={quality.latency}
            suffix=" ms"
            sparkline={history.latency}
          />
          <MetricCard label="Jitter" numericValue={quality.jitter} decimals={1} suffix=" ms" />
          <MetricCard
            label="Packet loss"
            numericValue={quality.packetLoss}
            decimals={1}
            suffix="%"
            sparkline={history.packetLoss}
          />
          <MetricCard
            label="Quality score"
            numericValue={quality.score}
            suffix=" / 100"
            sparkline={history.quality}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/8 bg-surface/90 shadow-[var(--card-shadow)] p-4">
            <p className="text-xs uppercase tracking-wider text-muted">Connection quality trend</p>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{quality.score}</p>
            <div className="mt-3">
              <Sparkline values={history.quality} />
            </div>
          </article>
          <article className="rounded-2xl border border-white/8 bg-surface/90 shadow-[var(--card-shadow)] p-4">
            <p className="text-xs uppercase tracking-wider text-muted">DNS response trend</p>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
              {network.dnsResults[1]?.responseMs ?? 17} ms
            </p>
            <div className="mt-3">
              <Sparkline values={history.dns} />
            </div>
          </article>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Adapter information</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {network.adapters.map((adapter) => (
            <article
              key={adapter.id}
              className="rounded-2xl border border-white/8 bg-surface/90 shadow-[var(--card-shadow)] p-5 transition hover:border-primary/25"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {adapter.type === "Wi-Fi" ? (
                    <Wifi className="size-4 text-secondary" />
                  ) : (
                    <Cable className="size-4 text-secondary" />
                  )}
                  <h3 className="font-medium">{adapter.name}</h3>
                </div>
                <span className="text-xs text-muted">{adapter.status}</span>
              </div>
              <dl className="mt-5 space-y-2 text-sm">
                {(
                  [
                    ["Type", adapter.type],
                    ["Link speed", adapter.linkSpeed],
                    ["MAC address", adapter.mac],
                    ["IPv4", adapter.ipv4],
                    ["DHCP", adapter.dhcp ? "Enabled" : "Disabled"],
                    ["DNS", adapter.dns],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-t border-white/6 pt-2">
                    <dt className="text-muted">{label}</dt>
                    <dd className="text-right font-mono text-xs text-secondary">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Device map</h2>
        <p className="mt-1 text-sm text-muted">Visualization of a typical private network profile.</p>
        <div className="relative mt-4 overflow-hidden rounded-3xl border border-white/8 bg-surface/80 p-6">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="relative grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-7">
            {network.devices.map((device) => {
              const Icon = deviceIcons[device.type];
              return (
                <div key={device.id} className="relative flex flex-col items-center text-center">
                  <span className="absolute left-1/2 top-6 hidden h-px w-full bg-white/10 lg:block" />
                  <span className="relative z-10 grid size-12 place-items-center rounded-2xl border border-white/10 bg-surface transition hover:border-primary/30">
                    <Icon
                      className={`size-5 ${device.type === "router" ? "text-primary" : "text-secondary"}`}
                    />
                  </span>
                  <p className="mt-2 text-xs font-medium">{device.name}</p>
                  <p className="text-[10px] text-muted">{device.status}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">DNS comparison</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {network.dnsResults.map((dns) => (
            <article
              key={dns.provider}
              className="rounded-2xl border border-white/8 bg-surface/90 shadow-[var(--card-shadow)] p-4 transition hover:border-primary/25"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-medium">{dns.provider}</h3>
                <span className="font-mono text-xs text-secondary">{dns.responseMs} ms</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{dns.description}</p>
              <p className="mt-4 border-t border-white/7 pt-3 text-xs text-muted">
                <strong className="text-secondary">Useful for:</strong> {dns.bestFor}
              </p>
              <p className="mt-2 text-xs text-muted">{dns.reliability}% reliability</p>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          No resolver is universally best. Policy, privacy, security filtering, reliability, and location
          all affect the right choice.
        </p>
      </section>

      <section
        id="troubleshooting"
        className="scroll-mt-[var(--scroll-mt)] rounded-3xl border border-white/8 bg-surface/90 shadow-[var(--card-shadow)] p-5 sm:p-6"
      >
        <h2 className="font-display text-2xl font-semibold">Troubleshooting wizard</h2>
        <p className="mt-2 text-sm text-muted">
          A reusable TypeScript decision tree guides the checks instead of hardcoded screens.
        </p>
        {!issue ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ISSUE_CATEGORIES.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  setIssue(item.id);
                  setNodeId("start");
                }}
                className="rounded-xl border border-white/8 p-4 text-left text-sm text-muted transition hover:border-primary/30 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : node ? (
          <WizardNode
            node={node}
            onNext={setNodeId}
            onReset={() => {
              setIssue(null);
              setNodeId("start");
            }}
          />
        ) : null}
      </section>
    </div>
  );
}

function WizardNode({
  node,
  onNext,
  onReset,
}: {
  node: TroubleshootingNode;
  onNext: (id: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-6 rounded-2xl bg-black/25 p-5">
      <p className="font-display text-lg font-semibold">{node.prompt}</p>
      {node.options ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {node.options.map((option) => (
            <button
              type="button"
              key={option.label}
              onClick={() => onNext(option.nextId)}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-muted transition hover:border-primary/30 hover:text-text"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
      {node.result ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ResultList title="Probable causes" items={node.result.probableCauses} />
          <ResultList title="Recommended checks" items={node.result.checks} />
          <ResultList title="Tools" items={node.result.tools} />
          <div className="rounded-xl border border-white/7 p-4 text-sm text-muted">
            <p>
              <strong className="text-secondary">Difficulty:</strong> {node.result.difficulty}
            </p>
            <p className="mt-2">
              <strong className="text-secondary">Escalation:</strong> {node.result.escalation}
            </p>
            {node.result.safetyNote ? (
              <p className="mt-2 text-warning/80">
                <strong>Safety:</strong> {node.result.safetyNote}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={onReset}
        className="mt-5 text-sm text-muted underline underline-offset-4 hover:text-text"
      >
        Choose another issue
      </button>
    </div>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/7 p-4">
      <h3 className="text-sm font-medium text-secondary">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
