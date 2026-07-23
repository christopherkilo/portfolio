import type { Metadata } from "next";
import { TeamView } from "@/components/demos/taskflow/team/TeamView";

export const metadata: Metadata = { title: "Team" };

export default function TeamViewPage() {
  return <TeamView />;
}
