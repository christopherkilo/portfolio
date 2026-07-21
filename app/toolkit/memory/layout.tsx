import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MemoryMedic · Kilo Toolkit",
  description: "Simulated memory trends, process analysis, findings, and workload-aware RAM guidance.",
};

export default function MemoryMedicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
