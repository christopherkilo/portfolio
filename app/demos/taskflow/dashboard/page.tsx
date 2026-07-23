import type { Metadata } from "next";
import { DashboardView } from "@/components/demos/taskflow/dashboard/DashboardView";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardViewPage() {
  return <DashboardView />;
}
