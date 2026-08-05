import { GravityLoader } from "@/components/demos/event-horizon/ui/GravityLoader";

export default function FavoritesLoading() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-6xl items-center justify-center px-4 py-16">
      <GravityLoader label="Gathering saved events…" />
    </div>
  );
}
