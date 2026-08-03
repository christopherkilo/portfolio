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
import {
  apiGet,
  apiSend,
  type PublicReservation,
  type ReservationsListResponse,
} from "@/lib/demos/event-horizon/apiClient";

type CreateInput = {
  event: { id: string };
  ticketTypeId: string;
  quantity: number;
  idempotencyKey: string;
};

type ReservationsContextValue = {
  reservations: PublicReservation[];
  ready: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  addTicketReservation: (
    input: CreateInput,
  ) => Promise<
    | { ok: true; reservation: PublicReservation; replayed: boolean }
    | { ok: false; status: number; message: string; code: string }
  >;
  cancelTicketReservation: (
    reservationId: string,
  ) => Promise<"ok" | "auth" | "error">;
};

const ReservationsContext = createContext<ReservationsContextValue | null>(
  null,
);

export function ReservationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const [reservations, setReservations] = useState<PublicReservation[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setReservations([]);
      setReady(true);
      return;
    }
    setLoading(true);
    const result = await apiGet<ReservationsListResponse>(
      "/api/reservations?page=1&pageSize=48",
    );
    if (result.ok) {
      setReservations(result.data.items);
    } else if (result.status === 401) {
      setReservations([]);
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

  const addTicketReservation = useCallback(
    async (input: CreateInput) => {
      if (status !== "authenticated") {
        return {
          ok: false as const,
          status: 401,
          message: "Please sign in to reserve tickets.",
          code: "UNAUTHORIZED",
        };
      }

      const result = await apiSend<{
        reservation: PublicReservation;
        replayed: boolean;
      }>("/api/reservations", "POST", {
        eventId: input.event.id,
        ticketTypeId: input.ticketTypeId,
        quantity: input.quantity,
        idempotencyKey: input.idempotencyKey,
      });

      if (!result.ok) {
        return {
          ok: false as const,
          status: result.status,
          message: result.error.message,
          code: result.error.code,
        };
      }

      await refresh();
      return {
        ok: true as const,
        reservation: result.data.reservation,
        replayed: result.data.replayed,
      };
    },
    [status, refresh],
  );

  const cancelTicketReservation = useCallback(
    async (reservationId: string) => {
      if (status !== "authenticated") return "auth";
      const result = await apiSend<{ reservation: PublicReservation }>(
        `/api/reservations/${encodeURIComponent(reservationId)}/cancel`,
        "PATCH",
      );
      if (!result.ok) {
        if (result.status === 401) return "auth";
        return "error";
      }
      await refresh();
      return "ok";
    },
    [status, refresh],
  );

  const value = useMemo(
    () => ({
      reservations,
      ready,
      loading,
      refresh,
      addTicketReservation,
      cancelTicketReservation,
    }),
    [
      reservations,
      ready,
      loading,
      refresh,
      addTicketReservation,
      cancelTicketReservation,
    ],
  );

  return (
    <ReservationsContext.Provider value={value}>
      {children}
    </ReservationsContext.Provider>
  );
}

export function useReservations() {
  const ctx = useContext(ReservationsContext);
  if (!ctx) {
    throw new Error("useReservations must be used within ReservationsProvider");
  }
  return ctx;
}
