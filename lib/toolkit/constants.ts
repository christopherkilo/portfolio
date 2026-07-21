import {
  Activity,
  BrainCircuit,
  FileText,
  Gauge,
  Network,
  Settings,
} from "lucide-react";
import type { ScanStage, ToolkitSettings } from "@/lib/toolkit/types";

export const TOOLKIT_NAV = [
  { href: "/toolkit", label: "Overview", icon: Gauge },
  { href: "/toolkit/system", label: "SystemScope", icon: Activity },
  { href: "/toolkit/memory", label: "MemoryMedic", icon: BrainCircuit },
  { href: "/toolkit/network", label: "NetCheck", icon: Network },
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
};

export const DEMO_DISCLOSURE =
  "Kilo Toolkit is running in Demo Mode with realistic simulated system data. No unrestricted hardware, process, adapter, or local-network information is read from this device.";
