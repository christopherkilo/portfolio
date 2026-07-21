import type { TroubleshootingNode } from "@/lib/toolkit/types";

export const ISSUE_CATEGORIES = [
  { id: "no-internet", label: "No internet connection" },
  { id: "slow", label: "Slow connection" },
  { id: "wifi", label: "Intermittent Wi-Fi" },
  { id: "one-device", label: "One device cannot connect" },
  { id: "dns", label: "DNS or website-loading issue" },
  { id: "ethernet", label: "Ethernet connection problem" },
] as const;

const result = (
  probableCauses: string[],
  checks: string[],
  escalation: string,
  difficulty: "Easy" | "Moderate" | "Advanced" = "Easy",
): TroubleshootingNode["result"] => ({
  probableCauses,
  checks,
  tools: ["A second connected device", "Known-good cable when applicable", "Router status guide"],
  difficulty,
  safetyNote: "Do not open a power supply or networking device enclosure. Disconnect power before moving cables.",
  escalation,
});

export const TROUBLESHOOTING_TREES: Record<string, TroubleshootingNode[]> = {
  "no-internet": [
    {
      id: "start",
      prompt: "How is this device connected?",
      options: [
        { label: "Wi-Fi", nextId: "others" },
        { label: "Ethernet", nextId: "others" },
      ],
    },
    {
      id: "others",
      prompt: "Can another device reach the internet?",
      options: [
        { label: "Yes", nextId: "device-result" },
        { label: "No", nextId: "network-result" },
      ],
    },
    {
      id: "device-result",
      prompt: "The issue appears isolated to this device.",
      result: result(
        ["Stale DHCP lease", "Disabled adapter", "Incorrect proxy or DNS setting"],
        ["Toggle the adapter", "Renew the connection", "Confirm automatic IP and DNS settings"],
        "Escalate to desktop support if a known-good network still fails.",
      ),
    },
    {
      id: "network-result",
      prompt: "The issue may be upstream of this device.",
      result: result(
        ["Router or modem outage", "ISP service interruption", "Loose uplink cable"],
        ["Check status lights against the manual", "Confirm cables are seated", "Check the ISP status page using cellular data"],
        "Contact the ISP if the service light remains abnormal after a normal restart.",
        "Moderate",
      ),
    },
  ],
  slow: [
    { id: "start", prompt: "Is the slowdown present on multiple devices?", options: [{ label: "Yes", nextId: "result" }, { label: "No", nextId: "result" }] },
    { id: "result", prompt: "Compare local and network-wide causes.", result: result(["Congestion", "Weak wireless signal", "Background downloads"], ["Pause large transfers", "Retest near the router", "Compare Ethernet and Wi-Fi"], "Escalate with test times and wired results if performance remains below the service plan.") },
  ],
  wifi: [
    { id: "start", prompt: "Does moving closer to the access point improve stability?", options: [{ label: "Yes", nextId: "result" }, { label: "No", nextId: "result" }] },
    { id: "result", prompt: "Review signal and interference.", result: result(["Distance or obstruction", "Channel interference", "Driver power saving"], ["Test at two locations", "Restart the adapter", "Check for approved driver updates"], "Escalate for access-point placement or spectrum review.") },
  ],
  "one-device": [
    { id: "start", prompt: "Has this device connected to this network before?", options: [{ label: "Yes", nextId: "result" }, { label: "No", nextId: "result" }] },
    { id: "result", prompt: "Focus on device configuration and credentials.", result: result(["Stored credentials", "Adapter state", "Access-control policy"], ["Forget and rejoin the network", "Verify date and time", "Test a second trusted network"], "Escalate with adapter model and error message.") },
  ],
  dns: [
    { id: "start", prompt: "Can you reach some sites but not others?", options: [{ label: "Yes", nextId: "result" }, { label: "No", nextId: "result" }] },
    { id: "result", prompt: "Separate name resolution from connectivity.", result: result(["Resolver outage", "Cached stale record", "Filtering policy"], ["Try another known site", "Flush the operating-system DNS cache", "Compare an approved alternate resolver"], "Escalate before changing managed DNS policies.") },
  ],
  ethernet: [
    { id: "start", prompt: "Are link lights visible at both ends?", options: [{ label: "Yes", nextId: "result" }, { label: "No", nextId: "result" }] },
    { id: "result", prompt: "Check the physical and adapter layers.", result: result(["Damaged cable", "Disabled port", "Speed negotiation issue"], ["Reseat both ends", "Try a known-good cable", "Confirm the adapter is enabled"], "Escalate for switch-port testing if no link appears.", "Moderate") },
  ],
};
