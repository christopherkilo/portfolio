"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  clearAuthIntent,
  firstNameFromDisplayName,
  loadAuthIntent,
} from "@/lib/demos/event-horizon/authIntent";
import { useFavorites } from "@/contexts/demos/event-horizon/FavoritesContext";
import { useToast } from "@/contexts/demos/event-horizon/ToastContext";
import { useAuthModal } from "@/contexts/demos/event-horizon/AuthModalContext";

/**
 * After OAuth redirect, resume the protected action the user started
 * and show a welcome toast once per successful sign-in.
 */
export function AuthResumeListener() {
  const { data: session, status } = useSession();
  const { toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const { closeSignIn } = useAuthModal();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const welcomedRef = useRef(false);
  const resumedRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    closeSignIn();

    if (!welcomedRef.current) {
      welcomedRef.current = true;
      const first = firstNameFromDisplayName(session.user.name);
      toast(
        first ? `Welcome back, ${first}!` : "Signed in successfully.",
      );
    }

    if (resumedRef.current) return;
    resumedRef.current = true;

    const intent = loadAuthIntent();
    clearAuthIntent();
    if (!intent) return;

    const task = window.setTimeout(() => {
      void (async () => {
        if (intent.type === "navigate") {
          if (pathname !== intent.href) router.push(intent.href);
          return;
        }

        if (intent.type === "favorite") {
          const result = await toggleFavorite(intent.eventId);
          if (result === "ok") {
            toast("Saved to favorites");
          }
          if (
            intent.eventSlug &&
            !pathname.includes(`/events/${intent.eventSlug}`)
          ) {
            router.push(`/demos/event-horizon/events/${intent.eventSlug}`);
          }
          return;
        }

        if (intent.type === "reserve") {
          const params = new URLSearchParams({ reserve: "1" });
          if (intent.ticketTypeId) params.set("ticket", intent.ticketTypeId);
          if (intent.quantity) params.set("qty", String(intent.quantity));
          const target = `/demos/event-horizon/events/${intent.eventSlug}?${params.toString()}`;
          if (
            !pathname.includes(`/events/${intent.eventSlug}`) ||
            searchParams.get("reserve") !== "1"
          ) {
            router.push(target);
          }
        }
      })();
    }, 0);

    return () => window.clearTimeout(task);
  }, [
    status,
    session?.user,
    closeSignIn,
    toast,
    toggleFavorite,
    router,
    pathname,
    searchParams,
  ]);

  useEffect(() => {
    if (status === "unauthenticated") {
      welcomedRef.current = false;
      resumedRef.current = false;
    }
  }, [status]);

  return null;
}
