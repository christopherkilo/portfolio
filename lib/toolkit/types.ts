export type HealthStatus = "healthy" | "attention" | "critical";
export type Severity = "info" | "warning" | "critical";

export type MetricPoint = {
  time: string;
  value: number;
};

export type Finding = {
  id: string;
  title: string;
  severity: Severity;
  explanation: string;
  causes: string[];
  nextStep: string;
};

export type Recommendation = {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  module: "system" | "memory" | "network";
};

export type HardwareComponent = {
  id: string;
  label: string;
  value: string;
  detail?: string;
};

export type StorageDrive = {
  id: string;
  mount: string;
  model: string;
  capacityGb: number;
  usedGb: number;
  fileSystem: string;
  type: "NVMe SSD" | "SATA SSD" | "HDD";
  status: HealthStatus;
  health: number;
};

export type SystemSnapshot = {
  deviceName: string;
  operatingSystem: string;
  architecture: string;
  uptime: string;
  manufacturer: string;
  model: string;
  health: number;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    gpu: number;
    network: number;
  };
  hardware: HardwareComponent[];
  drives: StorageDrive[];
  findings: Finding[];
};

export type ProcessRecord = {
  id: string;
  name: string;
  category: "Browser" | "Development" | "Communication" | "System" | "Utility";
  memoryMb: number;
  percentage: number;
  status: HealthStatus;
  recommendation?: string;
};

export type MemorySnapshot = {
  installedGb: number;
  inUseGb: number;
  availableGb: number;
  cachedGb: number;
  committedGb: number;
  compressedMb: number;
  usagePercent: number;
  health: HealthStatus;
  timeline: Record<"5m" | "30m" | "1h", MetricPoint[]>;
  processes: ProcessRecord[];
  findings: Finding[];
};

export type NetworkAdapter = {
  id: string;
  name: string;
  type: "Ethernet" | "Wi-Fi" | "Virtual";
  status: "Connected" | "Disconnected" | "Standby";
  linkSpeed: string;
  mac: string;
  ipv4: string;
  dhcp: boolean;
  dns: string;
};

export type NetworkDevice = {
  id: string;
  name: string;
  type: "router" | "desktop" | "laptop" | "phone" | "printer" | "tv" | "storage";
  status: "online" | "idle";
};

export type DnsResult = {
  provider: string;
  responseMs: number;
  reliability: number;
  description: string;
  bestFor: string;
};

export type NetworkSnapshot = {
  connected: boolean;
  connectionType: "Ethernet" | "Wi-Fi";
  ipv4: string;
  gateway: string;
  dnsProvider: string;
  publicIp: string;
  link: string;
  profile: string;
  quality: {
    download: number;
    upload: number;
    latency: number;
    jitter: number;
    packetLoss: number;
    score: number;
  };
  adapters: NetworkAdapter[];
  devices: NetworkDevice[];
  dnsResults: DnsResult[];
  findings: Finding[];
};

export type DiagnosticReport = {
  id: string;
  name: string;
  createdAt: string;
  overallStatus: HealthStatus;
  systemFindings: Finding[];
  memoryFindings: Finding[];
  networkFindings: Finding[];
  recommendations: Recommendation[];
  demoMode: true;
};

export type ScanStage = {
  id: string;
  label: string;
};

export type TroubleshootingResult = {
  probableCauses: string[];
  checks: string[];
  tools: string[];
  difficulty: "Easy" | "Moderate" | "Advanced";
  safetyNote?: string;
  escalation: string;
};

export type TroubleshootingNode = {
  id: string;
  prompt: string;
  options?: { label: string; nextId: string }[];
  result?: TroubleshootingResult;
};

export type ToolkitSettings = {
  refreshSpeed: 1000 | 2000 | 4000;
  animations: boolean;
  density: "comfortable" | "compact";
  notifications: boolean;
  theme: "light" | "dark";
};

