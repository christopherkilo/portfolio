"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { DEFAULT_SETTINGS } from "@/lib/toolkit/constants";
import { toolkitProviders } from "@/lib/toolkit/providers/mock-providers";
import { readReports, writeReports } from "@/lib/toolkit/report-storage";
import type {
  DiagnosticReport,
  MemorySnapshot,
  NetworkSnapshot,
  SystemSnapshot,
  ToolkitSettings,
} from "@/lib/toolkit/types";

const SETTINGS_KEY = "kilo-toolkit-settings-v1";
const settingsSchema = z.object({
  refreshSpeed: z.union([z.literal(1000), z.literal(2000), z.literal(4000)]),
  animations: z.boolean(),
  density: z.enum(["comfortable", "compact"]),
  notifications: z.boolean(),
});

type ToolkitState = {
  system: SystemSnapshot | null;
  memory: MemorySnapshot | null;
  network: NetworkSnapshot | null;
  loading: boolean;
  settings: ToolkitSettings;
  reports: DiagnosticReport[];
  sessionLabel: string;
  updateSettings: (next: Partial<ToolkitSettings>) => void;
  refreshReports: () => void;
  setReports: (reports: DiagnosticReport[]) => void;
  refreshAll: () => Promise<void>;
};

const ToolkitContext = createContext<ToolkitState | null>(null);

export function ToolkitProvider({ children }: { children: React.ReactNode }) {
  const [system, setSystem] = useState<SystemSnapshot | null>(null);
  const [memory, setMemory] = useState<MemorySnapshot | null>(null);
  const [network, setNetwork] = useState<NetworkSnapshot | null>(null);
  const [reports, setReportState] = useState<DiagnosticReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ToolkitSettings>(DEFAULT_SETTINGS);

  async function refreshAll() {
    setLoading(true);
    const [nextSystem, nextMemory, nextNetwork] = await Promise.all([
      toolkitProviders.system.getSnapshot(),
      toolkitProviders.memory.getSnapshot(),
      toolkitProviders.network.getSnapshot(),
    ]);
    setSystem(nextSystem);
    setMemory(nextMemory);
    setNetwork(nextNetwork);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshAll();
      setReportState(readReports());
      try {
        const raw = window.localStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = settingsSchema.safeParse(JSON.parse(raw));
          if (parsed.success) setSettings(parsed.data);
        }
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function updateSettings(next: Partial<ToolkitSettings>) {
    setSettings((current) => {
      const updated = { ...current, ...next };
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function refreshReports() {
    setReportState(readReports());
  }

  function setReports(next: DiagnosticReport[]) {
    writeReports(next);
    setReportState(next);
  }

  const value = useMemo(
    () => ({
      system,
      memory,
      network,
      loading,
      settings,
      reports,
      sessionLabel: loading ? "Collecting simulated data" : "Session KT-DEMO-0721",
      updateSettings,
      refreshReports,
      setReports,
      refreshAll,
    }),
    [system, memory, network, loading, settings, reports],
  );

  return <ToolkitContext.Provider value={value}>{children}</ToolkitContext.Provider>;
}

export function useToolkit() {
  const context = useContext(ToolkitContext);
  if (!context) throw new Error("useToolkit must be used inside ToolkitProvider");
  return context;
}
