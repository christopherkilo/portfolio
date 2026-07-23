import type { Metadata } from "next";
import { SettingsView } from "@/components/demos/taskflow/settings/SettingsView";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsViewPage() {
  return <SettingsView />;
}
