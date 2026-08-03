"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { apiGet, apiSend, type PublicEvent } from "@/lib/demos/event-horizon/apiClient";

type FavoritesContextValue = {
  favorites: string[];
  favoriteEvents: PublicEvent[];
  ready: boolean;
  loading: boolean;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<"ok" | "auth" | "error">;
  refresh: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<PublicEvent[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setFavorites([]);
      setFavoriteEvents([]);
      setReady(true);
      return;
    }
    setLoading(true);
    const result = await apiGet<
      Array<{ eventId: string; event: PublicEvent }>
    >("/api/favorites");
    if (result.ok) {
      setFavorites(result.data.map((row) => row.eventId));
      setFavoriteEvents(result.data.map((row) => row.event));
    } else if (result.status === 401) {
      setFavorites([]);
      setFavoriteEvents([]);
    }
    setLoading(false);
    setReady(true);
  }, [status]);

  useEffect(() => {
    if (status === "loading") return;
    const task = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(task);
  }, [status, refresh]);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (id: string): Promise<"ok" | "auth" | "error"> => {
      if (status !== "authenticated") return "auth";
      if (pending.has(id)) return "ok";

      setPending((prev) => new Set(prev).add(id));
      const liked = favorites.includes(id);

      // Optimistic update
      setFavorites((prev) =>
        liked ? prev.filter((item) => item !== id) : [...prev, id],
      );

      const result = liked
        ? await apiSend<{ eventId: string }>(
            `/api/favorites/${encodeURIComponent(id)}`,
            "DELETE",
          )
        : await apiSend<{ eventId: string }>("/api/favorites", "POST", {
            eventId: id,
          });

      setPending((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      if (!result.ok) {
        // Rollback
        setFavorites((prev) =>
          liked
            ? prev.includes(id)
              ? prev
              : [...prev, id]
            : prev.filter((item) => item !== id),
        );
        if (result.status === 401) return "auth";
        return "error";
      }

      await refresh();
      return "ok";
    },
    [status, pending, favorites, refresh],
  );

  const value = useMemo(
    () => ({
      favorites,
      favoriteEvents,
      ready,
      loading,
      isFavorite,
      toggleFavorite,
      refresh,
    }),
    [
      favorites,
      favoriteEvents,
      ready,
      loading,
      isFavorite,
      toggleFavorite,
      refresh,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
