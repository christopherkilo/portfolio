import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectsView } from "@/components/demos/taskflow/projects/ProjectsView";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsViewPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">Loading…</div>}>
      <ProjectsView />
    </Suspense>
  );
}
