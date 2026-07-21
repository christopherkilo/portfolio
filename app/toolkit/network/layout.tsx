import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NetCheck · Kilo Toolkit",
  description: "Simulated connection testing, adapter details, DNS comparison, device mapping, and guided network troubleshooting.",
};

export default function NetCheckLayout({ children }: { children: React.ReactNode }) {
  return children;
}
