import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SystemScope · Kilo Toolkit",
  description: "Simulated hardware inventory, live performance, storage health, and practical system findings.",
};

export default function SystemScopeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
