import {
  Activity,
  BrainCircuit,
  FileText,
  Gauge,
  LifeBuoy,
  Network,
  Settings,
} from "lucide-react";
import type { ScanStage, ToolkitSettings } from "@/lib/toolkit/types";

export const TOOLKIT_NAV = [
  { href: "/toolkit", label: "Overview", icon: Gauge },
  { href: "/toolkit/system", label: "SystemScope", icon: Activity },
  { href: "/toolkit/memory", label: "MemoryMedic", icon: BrainCircuit },
  { href: "/toolkit/network", label: "NetCheck", icon: Network },
  { href: "/toolkit/troubleshooting", label: "Guided Help", icon: LifeBuoy },
  { href: "/toolkit/reports", label: "Reports", icon: FileText },
  { href: "/toolkit/settings", label: "Settings", icon: Settings },
] as const;

export const SCAN_STAGES: ScanStage[] = [
  { id: "hardware", label: "Detecting system hardware" },
  { id: "cpu", label: "Reviewing CPU load" },
  { id: "memory", label: "Reviewing memory utilization" },
  { id: "storage", label: "Checking storage health" },
  { id: "network", label: "Testing network connectivity" },
  { id: "dns", label: "Reviewing DNS configuration" },
  { id: "recommendations", label: "Generating recommendations" },
];

export const DEFAULT_SETTINGS: ToolkitSettings = {
  refreshSpeed: 2000,
  animations: true,
  density: "comfortable",
  notifications: true,
  theme: "dark",
  autoRefresh: true,
};

export const DEMO_DISCLOSURE =
  "Kilo Toolkit runs in Demo Mode with illustrative diagnostic data. This browser build does not read hardware, processes, adapters, or local-network details from your device.";
