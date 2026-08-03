"use client";

import { TaskflowRealtimeBridge } from "@/components/demos/taskflow/providers/TaskflowRealtimeBridge";
import { TaskflowQueryProvider } from "@/lib/demos/taskflow/query/client";

export function TaskflowProviders({ children }: { children: React.ReactNode }) {
  return (
    <TaskflowQueryProvider>
      <TaskflowRealtimeBridge />
      {children}
    </TaskflowQueryProvider>
  );
}
