import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarView } from "@/components/demos/taskflow/calendar/CalendarView";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarViewPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">Loading…</div>}>
      <CalendarView />
    </Suspense>
  );
}
