import type { Metadata } from "next";
import { CalendarView } from "@/components/demos/taskflow/calendar/CalendarView";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarViewPage() {
  return <CalendarView />;
}
