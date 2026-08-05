"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import { DEFAULT_SETTINGS } from "@/lib/toolkit/constants";
import { toolkitProviders } from "@/lib/toolkit/providers/mock-providers";
import {
  DIAGNOSTIC_SCAN_STAGES,
  STARTUP_STAGES,
  hashSeed,
  smoothDrift,
} from "@/lib/toolkit/simulation";
import {
  DEFAULT_CUSTOM_CONTROLS,
  applyScenarioToMemory,
  applyScenarioToNetwork,
  applyScenarioToSystem,
  driftWithinProfile,
  getProfile,
  profileHealth,
  profileMetrics,
  profileSummary,
  recommendationsForProfile,
  type CustomScenarioControls,
  type SimulationProfileId,
} from "@/lib/toolkit/scenarios";
import { applyRemediation, type RemediationResult } from "@/lib/toolkit/guided/actions";
import type { RemediationKind } from "@/lib/toolkit/guided/types";
import { readReportsResult, writeReports, type ReportReadResult } from "@/lib/toolkit/report-storage";
import type {
  DiagnosticReport,
  MemorySnapshot,
  NetworkSnapshot,
  Recommendation,
  SystemSnapshot,
  ToolkitSettings,
} from "@/lib/toolkit/types";

const SETTINGS_KEY = "kilo-toolkit-settings-v1";
const SESSION_KEY = "kilo-toolkit-session-v1";
const BOOTSTRAP_KEY = "kilo-toolkit-bootstrapped-v1";
const SCENARIO_SESSION_KEY = "kilo-toolkit-scenario-v1";

const settingsSchema = z.object({
  refreshSpeed: z.union([z.literal(1000), z.literal(2000), z.literal(4000)]),
  animations: z.boolean(),
  density: z.enum(["comfortable", "compact"]),
  notifications: z.boolean(),
  theme: z.enum(["light", "dark"]).default("dark"),
  autoRefresh: z.boolean().default(true),
});

const scenarioIdSchema = z.enum([
  "healthy",
  "heavy-memory",
  "network-instability",
  "low-disk",
  "developer",
  "aging",
  "custom",
]);

type ToolkitState = {
  system: SystemSnapshot | null;
  memory: MemorySnapshot | null;
  network: NetworkSnapshot | null;
  liveMetrics: SystemSnapshot["metrics"] | null;
  healthScore: number;
  recommendations: Recommendation[];
  lastRefreshedAt: string | null;
  loading: boolean;
  providerError: string | null;
  reportStorageStatus: ReportReadResult["status"];
  settings: ToolkitSettings;
  reports: DiagnosticReport[];
  sessionLabel: string;
  scanning: boolean;
  scanStageLabel: string;
  scanProgress: number;
  startupOpen: boolean;
  startupLabel: string;
  activeProfileId: SimulationProfileId;
  customControls: CustomScenarioControls;
  profileLabel: string;
  updateSettings: (next: Partial<ToolkitSettings>) => void;
  refreshReports: () => void;
  setReports: (reports: DiagnosticReport[]) => void;
  refreshAll: () => Promise<void>;
  refreshDiagnostics: () => Promise<void>;
  setLiveMetrics: (metrics: SystemSnapshot["metrics"]) => void;
  setActiveProfile: (id: SimulationProfileId) => void;
  updateCustomControls: (next: Partial<CustomScenarioControls>) => void;
  restoreHealthySystem: () => void;
  applyGuideRemediation: (kind: RemediationKind) => RemediationResult | null;
};

const ToolkitContext = createContext<ToolkitState | null>(null);

export function ToolkitProvider({ children }: { children: React.ReactNode }) {
  const [baseSystem, setBaseSystem] = useState<SystemSnapshot | null>(null);
  const [baseMemory, setBaseMemory] = useState<MemorySnapshot | null>(null);
  const [baseNetwork, setBaseNetwork] = useState<NetworkSnapshot | null>(null);
  const [system, setSystem] = useState<SystemSnapshot | null>(null);
  const [memory, setMemory] = useState<MemorySnapshot | null>(null);
  const [network, setNetwork] = useState<NetworkSnapshot | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<SystemSnapshot["metrics"] | null>(null);
  const [healthScore, setHealthScore] = useState(92);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [reports, setReportState] = useState<DiagnosticReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [reportStorageStatus, setReportStorageStatus] =
    useState<ReportReadResult["status"]>("empty");
  const [settings, setSettings] = useState<ToolkitSettings>(DEFAULT_SETTINGS);
  const [sessionLabel, setSessionLabel] = useState("Session initializing");
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState(0);
  const [startupOpen, setStartupOpen] = useState(false);
  const [startupStage, setStartupStage] = useState(0);
  const [activeProfileId, setActiveProfileId] = useState<SimulationProfileId>("healthy");
  const [customControls, setCustomControls] =
    useState<CustomScenarioControls>(DEFAULT_CUSTOM_CONTROLS);
  const documentVisible = useRef(true);
  const refreshSeed = useRef(1);
  const liveMetricsRef = useRef<SystemSnapshot["metrics"] | null>(null);
  const profileIdRef = useRef<SimulationProfileId>("healthy");
  const customRef = useRef(customControls);

  useEffect(() => {
    liveMetricsRef.current = liveMetrics;
  }, [liveMetrics]);

  useEffect(() => {
    profileIdRef.current = activeProfileId;
  }, [activeProfileId]);

  useEffect(() => {
    customRef.current = customControls;
  }, [customControls]);

  const applyProfile = useCallback(
    (
      nextSystem: SystemSnapshot,
      nextMemory: MemorySnapshot,
      nextNetwork: NetworkSnapshot,
      profileId: SimulationProfileId,
      custom: CustomScenarioControls,
      seed: number,
    ) => {
      const profile = getProfile(profileId, custom);
      const metrics = profileMetrics(profile, seed);
      const health = profileHealth(profile, seed + 17);
      const adaptedSystem = applyScenarioToSystem(nextSystem, profile, metrics, health);
      const adaptedMemory = applyScenarioToMemory(nextMemory, profile, metrics.memory);
      const adaptedNetwork = applyScenarioToNetwork(nextNetwork, profile, seed + 31);
      setSystem(adaptedSystem);
      setMemory(adaptedMemory);
      setNetwork(adaptedNetwork);
      setLiveMetrics(metrics);
      setHealthScore(health);
      setRecommendations(recommendationsForProfile(profile));
      setLastRefreshedAt(new Date().toISOString());
    },
    [],
  );

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setProviderError(null);
    try {
      const [nextSystem, nextMemory, nextNetwork] = await Promise.all([
        toolkitProviders.system.getSnapshot(),
        toolkitProviders.memory.getSnapshot(),
        toolkitProviders.network.getSnapshot(),
      ]);
      setBaseSystem(nextSystem);
      setBaseMemory(nextMemory);
      setBaseNetwork(nextNetwork);
      applyProfile(
        nextSystem,
        nextMemory,
        nextNetwork,
        profileIdRef.current,
        customRef.current,
        hashSeed(`boot-${Date.now()}`),
      );
    } catch {
      setProviderError(
        "Diagnostic providers are temporarily unavailable. Retry to restore Demo Mode data.",
      );
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  const refreshDiagnostics = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setScanStage(0);
    refreshSeed.current += 1;

    const stageDelay = settings.animations ? 380 : 120;
    for (let index = 0; index < DIAGNOSTIC_SCAN_STAGES.length; index += 1) {
      setScanStage(index);
      await new Promise((resolve) => setTimeout(resolve, stageDelay));
    }

    try {
      const [nextSystem, nextMemory, nextNetwork] = await Promise.all([
        toolkitProviders.system.getSnapshot(),
        toolkitProviders.memory.getSnapshot(),
        toolkitProviders.network.getSnapshot(),
      ]);
      setBaseSystem(nextSystem);
      setBaseMemory(nextMemory);
      setBaseNetwork(nextNetwork);
      applyProfile(
        nextSystem,
        nextMemory,
        nextNetwork,
        profileIdRef.current,
        customRef.current,
        hashSeed(`scan-${refreshSeed.current}`),
      );
      setProviderError(null);
    } catch {
      setProviderError("Diagnostic refresh failed. Retry from the overview or settings.");
    } finally {
      setScanning(false);
      setScanStage(DIAGNOSTIC_SCAN_STAGES.length - 1);
    }
  }, [scanning, settings.animations, applyProfile]);

  const setActiveProfile = useCallback(
    (id: SimulationProfileId) => {
      setActiveProfileId(id);
      window.sessionStorage.setItem(SCENARIO_SESSION_KEY, id);
      if (!baseSystem || !baseMemory || !baseNetwork) return;
      applyProfile(
        baseSystem,
        baseMemory,
        baseNetwork,
        id,
        customRef.current,
        hashSeed(`scenario-${id}-${Date.now()}`),
      );
    },
    [applyProfile, baseSystem, baseMemory, baseNetwork],
  );

  const updateCustomControls = useCallback(
    (next: Partial<CustomScenarioControls>) => {
      setCustomControls((current) => {
        const updated = { ...current, ...next };
        customRef.current = updated;
        if (profileIdRef.current === "custom" && baseSystem && baseMemory && baseNetwork) {
          applyProfile(
            baseSystem,
            baseMemory,
            baseNetwork,
            "custom",
            updated,
            hashSeed(`custom-${updated.cpu}-${updated.memory}-${updated.disk}`),
          );
        }
        return updated;
      });
    },
    [applyProfile, baseSystem, baseMemory, baseNetwork],
  );

  const restoreHealthySystem = useCallback(() => {
    setCustomControls(DEFAULT_CUSTOM_CONTROLS);
    customRef.current = DEFAULT_CUSTOM_CONTROLS;
    setActiveProfile("healthy");
  }, [setActiveProfile]);

  const applyGuideRemediation = useCallback((kind: RemediationKind): RemediationResult | null => {
    if (!system || !memory || !network || !liveMetricsRef.current) return null;
    const result = applyRemediation({
      kind,
      system,
      memory,
      network,
      liveMetrics: liveMetricsRef.current,
      healthScore,
    });
    if (result.patch.liveMetrics) setLiveMetrics(result.patch.liveMetrics);
    if (result.patch.system) setSystem(result.patch.system);
    if (result.patch.memory) setMemory(result.patch.memory);
    if (result.patch.network) setNetwork(result.patch.network);
    if (typeof result.patch.healthScore === "number") setHealthScore(result.patch.healthScore);
    return result;
  }, [system, memory, network, healthScore]);

  useEffect(() => {
    function onVisibility() {
      documentVisible.current = document.visibilityState === "visible";
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const bootstrapped = window.localStorage.getItem(BOOTSTRAP_KEY);
      if (!bootstrapped) {
        setStartupOpen(true);
        setStartupStage(0);
      }
      const storedScenario = window.sessionStorage.getItem(SCENARIO_SESSION_KEY);
      const parsedScenario = scenarioIdSchema.safeParse(storedScenario);
      if (parsedScenario.success) {
        setActiveProfileId(parsedScenario.data);
        profileIdRef.current = parsedScenario.data;
      }
      void refreshAll();
      const storedReports = readReportsResult();
      setReportState(storedReports.reports);
      setReportStorageStatus(storedReports.status);
      const existingSession = window.localStorage.getItem(SESSION_KEY);
      const session =
        existingSession ?? `KT-DEMO-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      window.localStorage.setItem(SESSION_KEY, session);
      setSessionLabel(`Session ${session}`);
      try {
        const raw = window.localStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = settingsSchema.safeParse(JSON.parse(raw));
          if (parsed.success) {
            setSettings({ ...DEFAULT_SETTINGS, ...parsed.data });
            document.documentElement.dataset.toolkitTheme = parsed.data.theme;
          }
        } else {
          const systemTheme: ToolkitSettings["theme"] = window.matchMedia(
            "(prefers-color-scheme: light)",
          ).matches
            ? "light"
            : "dark";
          const initialSettings = { ...DEFAULT_SETTINGS, theme: systemTheme };
          setSettings(initialSettings);
          document.documentElement.dataset.toolkitTheme = systemTheme;
          window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(initialSettings));
        }
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshAll]);

  useEffect(() => {
    if (!startupOpen) return;
    if (startupStage >= STARTUP_STAGES.length - 1) {
      const done = window.setTimeout(() => {
        window.localStorage.setItem(BOOTSTRAP_KEY, "1");
        setStartupOpen(false);
      }, 220);
      return () => window.clearTimeout(done);
    }
    const timer = window.setTimeout(
      () => setStartupStage((value) => value + 1),
      settings.animations ? 260 : 80,
    );
    return () => window.clearTimeout(timer);
  }, [startupOpen, startupStage, settings.animations]);

  useEffect(() => {
    if (!settings.autoRefresh || loading || scanning || !system) return;
    const timer = window.setInterval(() => {
      if (!documentVisible.current || !liveMetricsRef.current) return;
      const profile = getProfile(profileIdRef.current, customRef.current);
      const next = driftWithinProfile(
        liveMetricsRef.current,
        profile,
        hashSeed(`live-${Date.now()}`),
      );
      setLiveMetrics(next);
      setSystem((current) => (current ? { ...current, metrics: next } : current));
      setMemory((current) =>
        current
          ? {
              ...current,
              usagePercent: Math.round(next.memory),
              inUseGb: Math.round(((current.installedGb * next.memory) / 100) * 10) / 10,
              availableGb:
                Math.round((current.installedGb - (current.installedGb * next.memory) / 100) * 10) /
                10,
            }
          : current,
      );
      setNetwork((current) => {
        if (!current) return current;
        const latency = smoothDrift(
          current.quality.latency,
          profile.latency.min,
          profile.latency.max,
          profile.id === "network-instability" ? 8 : 1.5,
          () => (hashSeed(`lat-${Date.now()}`) % 1000) / 1000,
        );
        const packetLoss = smoothDrift(
          current.quality.packetLoss,
          profile.packetLoss.min,
          profile.packetLoss.max,
          profile.id === "network-instability" ? 0.4 : 0.05,
          () => (hashSeed(`loss-${Date.now()}`) % 1000) / 1000,
        );
        return {
          ...current,
          quality: {
            ...current.quality,
            latency: Math.round(latency),
            packetLoss: Math.round(packetLoss * 10) / 10,
          },
        };
      });
      setHealthScore((current) =>
        Math.round(
          smoothDrift(
            current,
            profile.health.min,
            profile.health.max,
            0.9,
            () => (hashSeed(`score-${Date.now()}`) % 1000) / 1000,
          ),
        ),
      );
    }, settings.refreshSpeed);
    return () => window.clearInterval(timer);
  }, [settings.autoRefresh, settings.refreshSpeed, loading, scanning, system, activeProfileId]);

  const updateSettings = useCallback((next: Partial<ToolkitSettings>) => {
    setSettings((current) => {
      const updated = { ...current, ...next };
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      if (next.theme) document.documentElement.dataset.toolkitTheme = next.theme;
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

  const profile = getProfile(activeProfileId, customControls);

  const value = useMemo(
    () => ({
      system,
      memory,
      network,
      liveMetrics,
      healthScore,
      recommendations,
      lastRefreshedAt,
      loading,
      providerError,
      reportStorageStatus,
      settings,
      reports,
      sessionLabel: loading ? "Preparing session…" : sessionLabel,
      scanning,
      scanStageLabel: DIAGNOSTIC_SCAN_STAGES[Math.min(scanStage, DIAGNOSTIC_SCAN_STAGES.length - 1)],
      scanProgress: Math.round(
        ((scanStage + (scanning ? 0 : 1)) / DIAGNOSTIC_SCAN_STAGES.length) * 100,
      ),
      startupOpen,
      startupLabel: STARTUP_STAGES[Math.min(startupStage, STARTUP_STAGES.length - 1)],
      activeProfileId,
      customControls,
      profileLabel: profile.label,
      updateSettings,
      refreshReports,
      setReports,
      refreshAll,
      refreshDiagnostics,
      setLiveMetrics,
      setActiveProfile,
      updateCustomControls,
      restoreHealthySystem,
      applyGuideRemediation,
    }),
    [
      system,
      memory,
      network,
      liveMetrics,
      healthScore,
      recommendations,
      lastRefreshedAt,
      loading,
      providerError,
      reportStorageStatus,
      settings,
      reports,
      sessionLabel,
      scanning,
      scanStage,
      startupOpen,
      startupStage,
      activeProfileId,
      customControls,
      profile.label,
      updateSettings,
      refreshReports,
      setReports,
      refreshAll,
      refreshDiagnostics,
      setActiveProfile,
      updateCustomControls,
      restoreHealthySystem,
      applyGuideRemediation,
    ],
  );

  return <ToolkitContext.Provider value={value}>{children}</ToolkitContext.Provider>;
}

export function useToolkit() {
  const context = useContext(ToolkitContext);
  if (!context) throw new Error("useToolkit must be used inside ToolkitProvider");
  return context;
}

export function useToolkitProfileSummary() {
  const { activeProfileId, customControls, healthScore } = useToolkit();
  const profile = getProfile(activeProfileId, customControls);
  return profileSummary(profile, healthScore);
}
