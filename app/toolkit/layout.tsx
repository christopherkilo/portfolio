import type { Metadata } from "next";
import { ToolkitShell } from "@/components/toolkit/ToolkitShell";

export const metadata: Metadata = {
  title: "Kilo Toolkit",
  description:
    "A polished simulated IT diagnostics suite covering system health, memory analysis, and network troubleshooting.",
};

export default function ToolkitLayout({ children }: { children: React.ReactNode }) {
  return <ToolkitShell>{children}</ToolkitShell>;
}
