"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, Heart, LogOut, Ticket, UserRound } from "lucide-react";
import {
  firstNameFromDisplayName,
  providerLabel,
} from "@/lib/demos/event-horizon/authIntent";
import { cn } from "@/lib/demos/event-horizon/utils";
import { useToast } from "@/contexts/demos/event-horizon/ToastContext";

export function ProfileMenu({ className }: { className?: string }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const user = session?.user;
  const name = user?.name?.trim() || "Account";
  const email = user?.email ?? "";
  const provider = user?.provider ?? null;
  const image = user?.image;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className="inline-flex max-w-[14rem] items-center gap-2 rounded-xl border border-border bg-surface/70 py-1.5 pl-1.5 pr-2.5 text-left transition hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="relative size-8 overflow-hidden rounded-lg bg-surface-elevated">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="32px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="flex size-full items-center justify-center text-muted">
              <UserRound className="size-4" aria-hidden />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">
            {firstNameFromDisplayName(name) || name}
          </span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted transition", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 z-[70] mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        >
          <div className="border-b border-border p-4">
            <div className="flex items-start gap-3">
              <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-surface-elevated">
                {image ? (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-muted">
                    <UserRound className="size-5" aria-hidden />
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-semibold text-ink">
                  {name}
                </p>
                {email ? (
                  <p className="mt-0.5 truncate text-xs text-muted">{email}</p>
                ) : null}
                <span className="mt-2 inline-flex rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                  {providerLabel(provider)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-2">
            <Link
              href="/demos/event-horizon/tickets"
              role="menuitem"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => setOpen(false)}
            >
              <Ticket className="size-4 text-accent" aria-hidden />
              My Tickets
            </Link>
            <Link
              href="/demos/event-horizon/favorites"
              role="menuitem"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => setOpen(false)}
            >
              <Heart className="size-4 text-warm" aria-hidden />
              Favorites
            </Link>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => {
                setOpen(false);
                toast("Signed out successfully.");
                void signOut({ callbackUrl: "/demos/event-horizon" });
              }}
            >
              <LogOut className="size-4 text-muted" aria-hidden />
              Sign Out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
