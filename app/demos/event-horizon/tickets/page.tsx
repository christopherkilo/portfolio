import type { Metadata } from "next";
import { TicketsClient } from "@/components/demos/event-horizon/events/TicketsClient";

export const metadata: Metadata = {
  title: "My Tickets",
  description: "View and manage your Event Horizon demo reservations.",
};

export default function TicketsPage() {
  return <TicketsClient />;
}
