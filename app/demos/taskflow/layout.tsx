import type { Metadata } from "next";
import { DemoShell } from "@/components/demos/DemoShell";
import { AppShell } from "@/components/demos/taskflow/layout/AppShell";
import { TaskflowProviders } from "@/components/demos/taskflow/providers/TaskflowProviders";
import "../demos.css";

export const metadata: Metadata = {
  title: "TaskFlow Demo",
  description:
    "Interactive TaskFlow demo — dashboard, kanban, and productivity workspace.",
  robots: { index: false, follow: false },
};

export default function TaskFlowDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoShell
      projectTitle="TaskFlow"
      caseStudyHref="/projects/taskflow"
      notice="TaskFlow Phase 1 — authenticated Supabase workspace with React Query."
    >
      <div data-demo="taskflow" className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:text-bg"
        >
          Skip to content
        </a>
        <TaskflowProviders>
          <AppShell>{children}</AppShell>
        </TaskflowProviders>
      </div>
    </DemoShell>
  );
}
