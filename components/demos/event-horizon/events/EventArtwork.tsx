"use client";

import Image from "next/image";
import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/demos/event-horizon/utils";
import { getEventCategoryPlaceholder } from "@/lib/demos/event-horizon/categoryPlaceholders";
import {
  getEventArtworkManifest,
  resolveEventArtworkSrc,
} from "@/lib/demos/event-horizon/artworkCache";
import type { ArtworkPromptInput } from "@/lib/demos/event-horizon/artworkPrompt";
import "@/lib/demos/event-horizon/artworkManifest";

type EventArtworkProps = {
  event: ArtworkPromptInput;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Extra class on the img element */
  imageClassName?: string;
};

/**
 * Decorative event cover with premium skeleton → crossfade.
 * Falls back to category placeholder if generated art fails.
 */
export function EventArtwork({
  event,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw",
  priority = false,
  imageClassName,
}: EventArtworkProps) {
  const reduced = useReducedMotion();
  const preferred = resolveEventArtworkSrc(event, getEventArtworkManifest());
  const fallback = getEventCategoryPlaceholder(event.category);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-surface-elevated", className)}>
      <EventArtworkFrame
        key={`${event.slug}:${preferred}`}
        preferred={preferred}
        fallback={fallback}
        sizes={sizes}
        priority={priority}
        imageClassName={imageClassName}
        reduceMotion={Boolean(reduced)}
      />
    </div>
  );
}

function EventArtworkFrame({
  preferred,
  fallback,
  sizes,
  priority,
  imageClassName,
  reduceMotion,
}: {
  preferred: string;
  fallback: string;
  sizes: string;
  priority: boolean;
  imageClassName?: string;
  reduceMotion: boolean;
}) {
  const [src, setSrc] = useState(preferred);
  const [loaded, setLoaded] = useState(false);
  const [failedPreferred, setFailedPreferred] = useState(false);

  function handleError() {
    if (!failedPreferred && src !== fallback) {
      setFailedPreferred(true);
      setSrc(fallback);
      setLoaded(false);
      return;
    }
    setLoaded(true);
  }

  return (
    <>
      <div
        className={cn(
          "absolute inset-0 z-[1] transition-opacity duration-500",
          loaded ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-[#141414] to-black" />
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent",
            !reduceMotion && !loaded && "eh-artwork-shimmer",
          )}
        />
      </div>

      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        aria-hidden
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={cn(
          "object-cover transition-opacity duration-500 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          imageClassName,
        )}
      />
    </>
  );
}
