import type { Metadata } from "next";
import { Suspense } from "react";
import { TasksView } from "@/components/demos/taskflow/tasks/TasksView";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksViewPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">Loading…</div>}>
      <TasksView />
    </Suspense>
  );
}
