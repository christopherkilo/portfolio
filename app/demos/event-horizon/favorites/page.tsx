import type { Metadata } from "next";
import { FavoritesClient } from "@/components/demos/event-horizon/events/FavoritesClient";

export const metadata: Metadata = {
  title: "Favorites",
  description: "Your saved events on Event Horizon.",
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return <FavoritesClient />;
}
