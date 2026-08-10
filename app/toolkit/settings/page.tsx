"use client";

import { useState } from "react";
import { Database, MonitorCog, RotateCcw, Trash2 } from "lucide-react";
import { useToolkit } from "@/components/toolkit/ToolkitContext";
import { DemoModeBadge, ModuleHeader } from "@/components/toolkit/ToolkitUI";
import { DEFAULT_SETTINGS, DEMO_DISCLOSURE } from "@/lib/toolkit/constants";
import { clearReports } from "@/lib/toolkit/report-storage";

const BOOTSTRAP_KEY = "kilo-toolkit-bootstrapped-v1";

export default function SettingsPage() {
  const { settings, updateSettings, refreshAll, refreshDiagnostics, setReports, restoreHealthySystem } =
    useToolkit();
  const [message, setMessage] = useState("");

  async function resetDemo() {
    updateSettings(DEFAULT_SETTINGS);
    window.localStorage.removeItem(BOOTSTRAP_KEY);
    restoreHealthySystem();
    await refreshAll();
    setMessage("Demo data and preferences were reset to the Healthy System profile.");
  }

  function removeReports() {
    if (!window.confirm("Clear every locally saved Kilo Toolkit report?")) return;
    clearReports();
    setReports([]);
    setMessage("Saved reports were cleared.");
  }

  return (
    <div className="space-y-8">
      <ModuleHeader
        eyebrow="Toolkit preferences"
        title="Settings"
        description="Theme, motion, refresh pacing, density, and Demo Mode data controls."
        action={<DemoModeBadge compact />}
      />
      {message ? (
        <div
          role="status"
          className="rounded-xl border border-success/20 bg-success/[0.05] p-3 text-sm text-success"
        >
          {message}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-3xl border border-white/8 bg-surface/90 shadow-[var(--card-shadow)] p-5">
          <div className="flex items-center gap-3">
            <MonitorCog className="size-5 text-secondary" />
            <h2 className="font-display text-xl font-semibold">Experience</h2>
          </div>
          <div className="mt-5 space-y-5">
            <label className="block text-sm text-muted">
              Color theme
              <select
                value={settings.theme}
                onChange={(event) =>
                  updateSettings({ theme: event.target.value as "light" | "dark" })
                }
                className="mt-2 w-full rounded-xl border border-white/8 bg-bg p-3 text-text"
              >
                <option value="dark">Dark mode</option>
                <option value="light">Light mode</option>
              </select>
            </label>
            <label className="block text-sm text-muted">
              Simulation speed
              <select
                value={settings.refreshSpeed}
                onChange={(event) =>
                  updateSettings({
                    refreshSpeed: Number(event.target.value) as 1000 | 2000 | 4000,
                  })
                }
                className="mt-2 w-full rounded-xl border border-white/8 bg-bg p-3 text-text"
              >
                <option value={1000}>Fast · every second</option>
                <option value={2000}>Balanced · every 2 seconds</option>
                <option value={4000}>Quiet · every 4 seconds</option>
              </select>
            </label>
            <label className="block text-sm text-muted">
              Content density
              <select
                value={settings.density}
                onChange={(event) =>
                  updateSettings({
                    density: event.target.value as "comfortable" | "compact",
                  })
                }
                className="mt-2 w-full rounded-xl border border-white/8 bg-bg p-3 text-text"
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
            <Toggle
              label="Auto refresh"
              detail="Gently update live metrics while this tab is visible."
              checked={settings.autoRefresh}
              onChange={(value) => updateSettings({ autoRefresh: value })}
            />
            <Toggle
              label="Toolkit animations"
              detail="System reduced-motion preferences always take priority."
              checked={settings.animations}
              onChange={(value) => updateSettings({ animations: value })}
            />
            <Toggle
              label="Diagnostic notifications"
              detail="Show local advisory notices during this session."
              checked={settings.notifications}
              onChange={(value) => updateSettings({ notifications: value })}
            />
          </div>
        </article>

        <article className="rounded-3xl border border-white/8 bg-surface/90 shadow-[var(--card-shadow)] p-5">
          <div className="flex items-center gap-3">
            <Database className="size-5 text-secondary" />
            <h2 className="font-display text-xl font-semibold">Demo data</h2>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">{DEMO_DISCLOSURE}</p>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => void refreshDiagnostics()}
              className="flex w-full items-center gap-3 rounded-xl border border-white/8 p-3 text-left text-sm text-muted transition hover:bg-surface-elevated/60 hover:text-text"
            >
              <RotateCcw className="size-4" />
              <span>
                <strong className="block text-text">Refresh diagnostics</strong>
                Re-run the short scan and rotate recommendations.
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                restoreHealthySystem();
                setMessage("Restored Healthy System profile.");
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-white/8 p-3 text-left text-sm text-muted transition hover:bg-surface-elevated/60 hover:text-text"
            >
              <RotateCcw className="size-4" />
              <span>
                <strong className="block text-text">Restore Healthy System</strong>
                Return Scenario Mode to the default balanced profile.
              </span>
            </button>
            <button
              type="button"
              onClick={() => void resetDemo()}
              className="flex w-full items-center gap-3 rounded-xl border border-white/8 p-3 text-left text-sm text-muted transition hover:bg-surface-elevated/60 hover:text-text"
            >
              <RotateCcw className="size-4" />
              <span>
                <strong className="block text-text">Reset simulated diagnostics</strong>
                Restore default values, preferences, and first-launch startup.
              </span>
            </button>
            <button
              type="button"
              onClick={removeReports}
              className="flex w-full items-center gap-3 rounded-xl border border-danger/20 p-3 text-left text-sm text-danger/80 transition hover:bg-danger/10"
            >
              <Trash2 className="size-4" />
              <span>
                <strong className="block">Clear saved reports</strong>
                Remove Kilo Toolkit reports from localStorage.
              </span>
            </button>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-dashed border-white/12 bg-surface/60 p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-elevated/70">
            <MonitorCog className="size-5 text-muted" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-semibold">
                Desktop Diagnostic Provider — Future Expansion
              </h2>
              <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-muted">
                Informational
              </span>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted">
              A future Electron edition could replace the mock provider interfaces with explicitly
              installed, permission-aware local providers. No desktop provider is active in this
              portfolio build.
            </p>
            <button
              type="button"
              disabled
              className="mt-4 rounded-xl border border-white/8 px-4 py-2 text-sm text-muted opacity-60"
            >
              Desktop provider unavailable in browser
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Toggle({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-5 rounded-xl border border-white/8 p-3 transition hover:border-primary/25">
      <span className="text-sm text-muted">
        <strong className="block font-medium text-text">{label}</strong>
        {detail}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 shrink-0 accent-primary"
      />
    </label>
  );
}
