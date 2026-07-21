import type {
  MemoryDataProvider,
  MemorySnapshot,
  MetricPoint,
  NetworkDataProvider,
  NetworkSnapshot,
  SystemDataProvider,
  SystemSnapshot,
} from "@/lib/toolkit/types";

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

function drift(value: number, min: number, max: number, amount: number) {
  const direction = Math.random() - 0.46;
  return Math.round(Math.min(max, Math.max(min, value + direction * amount)) * 10) / 10;
}

function timeline(points: number, baseline: number, spread: number): MetricPoint[] {
  let value = baseline;
  return Array.from({ length: points }, (_, index) => {
    value = drift(value, baseline - spread, baseline + spread, spread * 0.35);
    return { time: String(index + 1), value };
  });
}

const systemSnapshot: SystemSnapshot = {
  deviceName: "KILO-WORKSTATION",
  operatingSystem: "Windows 11 Pro 24H2",
  architecture: "64-bit (x64)",
  uptime: "6 days, 14 hours",
  manufacturer: "ASUS",
  model: "Custom Professional Workstation",
  health: 88,
  metrics: { cpu: 32, memory: 68, disk: 14, gpu: 21, network: 8.4 },
  hardware: [
    { id: "cpu", label: "Processor", value: "AMD Ryzen 7 7700X", detail: "8 physical cores · 16 logical processors" },
    { id: "board", label: "Motherboard", value: "ASUS TUF B650-PLUS", detail: "BIOS 2413 · UEFI" },
    { id: "ram", label: "Installed RAM", value: "32 GB DDR5-6000", detail: "2 × 16 GB · Dual channel" },
    { id: "gpu", label: "Graphics adapter", value: "NVIDIA GeForce RTX 4070", detail: "12 GB GDDR6X" },
    { id: "storage", label: "Primary storage", value: "Samsung 990 PRO 2 TB", detail: "NVMe PCIe 4.0" },
    { id: "network", label: "Network adapters", value: "2 active / 1 virtual", detail: "2.5 GbE · Wi-Fi 6E" },
  ],
  drives: [
    { id: "c", mount: "C:", model: "Samsung 990 PRO", capacityGb: 2000, usedGb: 1456, fileSystem: "NTFS", type: "NVMe SSD", status: "attention", health: 96 },
    { id: "d", mount: "D:", model: "Crucial MX500", capacityGb: 1000, usedGb: 412, fileSystem: "NTFS", type: "SATA SSD", status: "healthy", health: 91 },
  ],
  findings: [
    {
      id: "storage-space",
      title: "Primary drive free space is narrowing",
      severity: "warning",
      explanation: "The system drive is above 70% utilization. Updates and temporary files need working space.",
      causes: ["Large development caches", "Downloaded media", "Old update files"],
      nextStep: "Review large files and clear safe temporary data before utilization reaches 85%.",
    },
    {
      id: "uptime",
      title: "System uptime is extended",
      severity: "info",
      explanation: "A periodic restart can complete pending updates and clear stale driver state.",
      causes: ["Sleep used instead of restart", "Long-running development sessions"],
      nextStep: "Save active work and schedule a normal restart.",
    },
    {
      id: "storage-health",
      title: "Storage health indicators are stable",
      severity: "info",
      explanation: "Both simulated drives report healthy wear and error indicators.",
      causes: [],
      nextStep: "Continue routine backups and monitor changes over time.",
    },
  ],
};

const memorySnapshot: MemorySnapshot = {
  installedGb: 32,
  inUseGb: 21.8,
  availableGb: 10.2,
  cachedGb: 6.4,
  committedGb: 24.7,
  compressedMb: 684,
  usagePercent: 68,
  health: "attention",
  timeline: {
    "5m": timeline(20, 67, 7),
    "30m": timeline(30, 63, 12),
    "1h": timeline(40, 59, 16),
  },
  processes: [
    { id: "browser", name: "Browser", category: "Browser", memoryMb: 6450, percentage: 19.7, status: "attention", recommendation: "Review inactive tabs and memory-heavy extensions." },
    { id: "editor", name: "Code editor", category: "Development", memoryMb: 3120, percentage: 9.5, status: "healthy" },
    { id: "chat", name: "Communication app", category: "Communication", memoryMb: 1280, percentage: 3.9, status: "healthy" },
    { id: "launcher", name: "Game launcher", category: "Utility", memoryMb: 890, percentage: 2.7, status: "attention", recommendation: "Disable startup launch if it is not needed each session." },
    { id: "explorer", name: "File explorer", category: "System", memoryMb: 410, percentage: 1.3, status: "healthy" },
    { id: "security", name: "Security service", category: "System", memoryMb: 360, percentage: 1.1, status: "healthy" },
    { id: "updater", name: "Background updater", category: "Utility", memoryMb: 220, percentage: 0.7, status: "healthy" },
  ],
  findings: [
    {
      id: "browser-memory",
      title: "Browser tab usage is elevated",
      severity: "warning",
      explanation: "The browser is currently the largest memory consumer and can increase paging during heavier workloads.",
      causes: ["Many active tabs", "Media-heavy pages", "Extensions"],
      nextStep: "Close inactive tabs and review the browser task manager before upgrading hardware.",
    },
    {
      id: "capacity",
      title: "Current capacity suits professional workloads",
      severity: "info",
      explanation: "32 GB provides reasonable headroom for development and daily multitasking.",
      causes: [],
      nextStep: "Consider 64 GB only if virtual machines or large creative workloads become routine.",
    },
  ],
};

const networkSnapshot: NetworkSnapshot = {
  connected: true,
  connectionType: "Ethernet",
  ipv4: "192.0.2.42",
  gateway: "192.0.2.1",
  dnsProvider: "Cloudflare (simulated)",
  publicIp: "203.0.113.xxx",
  link: "2.5 Gbps full duplex",
  profile: "Private",
  quality: { download: 486, upload: 38, latency: 18, jitter: 3.2, packetLoss: 0.1, score: 94 },
  adapters: [
    { id: "ethernet", name: "Realtek 2.5GbE", type: "Ethernet", status: "Connected", linkSpeed: "2.5 Gbps", mac: "02:00:00:XX:XX:01", ipv4: "192.0.2.42", dhcp: true, dns: "1.1.1.1 / 1.0.0.1" },
    { id: "wifi", name: "Intel Wi-Fi 6E AX210", type: "Wi-Fi", status: "Standby", linkSpeed: "1.2 Gbps", mac: "02:00:00:XX:XX:02", ipv4: "Not assigned", dhcp: true, dns: "Automatic" },
    { id: "virtual", name: "Hyper-V Virtual Ethernet", type: "Virtual", status: "Connected", linkSpeed: "10 Gbps", mac: "02:00:00:XX:XX:03", ipv4: "198.51.100.1", dhcp: false, dns: "Host managed" },
  ],
  devices: [
    { id: "router", name: "Router", type: "router", status: "online" },
    { id: "desktop", name: "Workstation", type: "desktop", status: "online" },
    { id: "laptop", name: "Laptop", type: "laptop", status: "online" },
    { id: "phone", name: "Mobile", type: "phone", status: "online" },
    { id: "printer", name: "Printer", type: "printer", status: "idle" },
    { id: "tv", name: "Smart TV", type: "tv", status: "idle" },
    { id: "nas", name: "Network storage", type: "storage", status: "online" },
  ],
  dnsResults: [
    { provider: "ISP DNS", responseMs: 31, reliability: 98.8, description: "Simple automatic configuration from the ISP.", bestFor: "Convenience and local ISP services" },
    { provider: "Cloudflare", responseMs: 17, reliability: 99.9, description: "Fast resolver with a privacy-oriented public policy.", bestFor: "Low latency and privacy-conscious users" },
    { provider: "Google Public DNS", responseMs: 20, reliability: 99.9, description: "Mature global resolver with broad reach.", bestFor: "Consistent global availability" },
    { provider: "Quad9", responseMs: 24, reliability: 99.7, description: "Security-focused resolver that blocks known malicious domains.", bestFor: "Threat-blocking assistance" },
  ],
  findings: [
    {
      id: "connection-stable",
      title: "Connection quality is stable",
      severity: "info",
      explanation: "Latency, jitter, and packet stability are appropriate for calls, streaming, and development.",
      causes: [],
      nextStep: "Retest at different times if an intermittent problem is being investigated.",
    },
  ],
};

export class MockSystemDataProvider implements SystemDataProvider {
  async getSnapshot() {
    await wait();
    return structuredClone(systemSnapshot);
  }

  async getLiveMetrics(previous = systemSnapshot.metrics) {
    await wait(35);
    return {
      cpu: drift(previous.cpu, 12, 82, 14),
      memory: drift(previous.memory, 55, 78, 3),
      disk: drift(previous.disk, 2, 58, 16),
      gpu: drift(previous.gpu, 8, 65, 11),
      network: drift(previous.network, 1, 45, 10),
    };
  }
}

export class MockMemoryDataProvider implements MemoryDataProvider {
  async getSnapshot() {
    await wait();
    return structuredClone(memorySnapshot);
  }
}

export class MockNetworkDataProvider implements NetworkDataProvider {
  async getSnapshot() {
    await wait();
    return structuredClone(networkSnapshot);
  }

  async runConnectionTest() {
    await wait(400);
    return {
      download: drift(486, 420, 540, 30),
      upload: drift(38, 32, 44, 4),
      latency: drift(18, 12, 28, 4),
      jitter: drift(3.2, 1.2, 6, 1.3),
      packetLoss: drift(0.1, 0, 0.8, 0.2),
      score: Math.round(drift(94, 86, 98, 3)),
    };
  }
}

export const toolkitProviders: {
  system: SystemDataProvider;
  memory: MemoryDataProvider;
  network: NetworkDataProvider;
} = {
  system: new MockSystemDataProvider(),
  memory: new MockMemoryDataProvider(),
  network: new MockNetworkDataProvider(),
};
