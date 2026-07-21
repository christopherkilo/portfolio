"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { DEFAULT_SETTINGS } from "@/lib/toolkit/constants";
import { toolkitProviders } from "@/lib/toolkit/providers/mock-providers";
import { readReportsResult, writeReports, type ReportReadResult } from "@/lib/toolkit/report-storage";
import type {
  DiagnosticReport,
  MemorySnapshot,
  NetworkSnapshot,
  SystemSnapshot,
  ToolkitSettings,
} from "@/lib/toolkit/types";

const SETTINGS_KEY = "kilo-toolkit-settings-v1";
const SESSION_KEY = "kilo-toolkit-session-v1";
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
  providerError: string | null;
  reportStorageStatus: ReportReadResult["status"];
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
  const [providerError, setProviderError] = useState<string | null>(null);
  const [reportStorageStatus, setReportStorageStatus] = useState<ReportReadResult["status"]>("empty");
  const [settings, setSettings] = useState<ToolkitSettings>(DEFAULT_SETTINGS);
  const [sessionLabel, setSessionLabel] = useState("Session initializing");

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setProviderError(null);
    try {
      const [nextSystem, nextMemory, nextNetwork] = await Promise.all([
        toolkitProviders.system.getSnapshot(),
        toolkitProviders.memory.getSnapshot(),
        toolkitProviders.network.getSnapshot(),
      ]);
      setSystem(nextSystem);
      setMemory(nextMemory);
      setNetwork(nextNetwork);
    } catch {
      setProviderError("The simulated diagnostic provider is unavailable. Retry the session to restore Demo Mode data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshAll();
      const storedReports = readReportsResult();
      setReportState(storedReports.reports);
      setReportStorageStatus(storedReports.status);
      const existingSession = window.localStorage.getItem(SESSION_KEY);
      const session = existingSession ?? `KT-DEMO-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      window.localStorage.setItem(SESSION_KEY, session);
      setSessionLabel(`Session ${session}`);
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
  }, [refreshAll]);

  const updateSettings = useCallback((next: Partial<ToolkitSettings>) => {
    setSettings((current) => {
      const updated = { ...current, ...next };
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshReports = useCallback(() => {
    const result = readReportsResult();
    setReportState(result.reports);
    setReportStorageStatus(result.status);
  }, []);

  const setReports = useCallback((next: DiagnosticReport[]) => {
    writeReports(next);
    setReportState(next);
    setReportStorageStatus(next.length ? "ready" : "empty");
  }, []);

  const value = useMemo(
    () => ({
      system,
      memory,
      network,
      loading,
      providerError,
      reportStorageStatus,
      settings,
      reports,
      sessionLabel: loading ? "Collecting simulated data" : sessionLabel,
      updateSettings,
      refreshReports,
      setReports,
      refreshAll,
    }),
    [system, memory, network, loading, providerError, reportStorageStatus, settings, reports, sessionLabel, updateSettings, refreshReports, setReports, refreshAll],
  );

  return <ToolkitContext.Provider value={value}>{children}</ToolkitContext.Provider>;
}

export function useToolkit() {
  const context = useContext(ToolkitContext);
  if (!context) throw new Error("useToolkit must be used inside ToolkitProvider");
  return context;
}
