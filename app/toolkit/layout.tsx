import type { Metadata } from "next";
import { ToolkitShell } from "@/components/toolkit/ToolkitShell";

export const metadata: Metadata = {
  title: "Kilo Toolkit",
  description:
    "A polished simulated IT diagnostics suite covering system health, memory analysis, and network troubleshooting.",
};

const themeBootScript = `
try {
  const raw = localStorage.getItem("kilo-toolkit-settings-v1");
  const saved = raw ? JSON.parse(raw).theme : null;
  document.documentElement.dataset.toolkitTheme =
    saved === "light" || saved === "dark"
      ? saved
      : (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
} catch {
  document.documentElement.dataset.toolkitTheme = "dark";
}
`;

export default function ToolkitLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      <ToolkitShell>{children}</ToolkitShell>
    </>
  );
}
