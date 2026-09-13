"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { Expand } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn, isSvgImageSrc } from "@/lib/utils";
import { CaseStudyLightbox } from "@/components/projects/shared/CaseStudyChrome";

const ACCENT = "#FF8C2B";

export type ApplicationView = {
  id: string;
  src: string;
  alt: string;
  label: string;
  width: number;
  height: number;
};

export type ApplicationTile = {
  id: string;
  name: string;
  application: string;
  inspectLabel: string;
  views: readonly ApplicationView[];
};

export const BRIDGE_APPLICATIONS: readonly ApplicationTile[] = [
  {
    id: "digital-product",
    name: "Digital product",
    application: "Interface system",
    inspectLabel: "View Event Horizon digital product applications",
    views: [
      {
        id: "digital-system",
        src: "/projects/event-horizon-brand/digital-system.webp",
        alt: "Event Horizon mobile home and tablet browse screens sharing void fields, Outfit type, and Horizon orange.",
        label: "System",
        width: 1600,
        height: 801,
      },
      {
        id: "digital-phone",
        src: "/projects/event-horizon-brand/digital-phone.webp",
        alt: "Event Horizon phone interface with a hollow-ring app icon, Tonight label, and Skyline Jazz Sessions card.",
        label: "Mobile",
        width: 760,
        height: 1362,
      },
      {
        id: "digital-tablet",
        src: "/projects/event-horizon-brand/digital-tablet.webp",
        alt: "Event Horizon tablet browse interface with the orange-O wordmark and Night Market and After Dark Design cards.",
        label: "Tablet",
        width: 1600,
        height: 1014,
      },
    ],
  },
  {
    id: "ticketing",
    name: "Ticketing",
    application: "Admission system",
    inspectLabel: "View Event Horizon ticketing system",
    views: [
      {
        id: "ticketing-system",
        src: "/projects/event-horizon-brand/ticketing-system.webp",
        alt: "Event Horizon general admission and VIP tickets for Skyline Jazz Sessions.",
        label: "System",
        width: 1600,
        height: 1187,
      },
      {
        id: "ticket-ga",
        src: "/projects/event-horizon-brand/ticket-ga.svg",
        alt: "Event Horizon general admission ticket for Skyline Jazz Sessions with an orange typographic O.",
        label: "GA",
        width: 800,
        height: 280,
      },
      {
        id: "ticket-vip",
        src: "/projects/event-horizon-brand/ticket-vip.svg",
        alt: "Event Horizon VIP ticket for Skyline Jazz Sessions with a gold status chip.",
        label: "VIP",
        width: 800,
        height: 280,
      },
      {
        id: "wristband-ga",
        src: "/projects/event-horizon-brand/wristband-ga.svg",
        alt: "Event Horizon general admission wristband with a hollow orange ring and plain EVENT HORIZON type.",
        label: "Wristband",
        width: 640,
        height: 72,
      },
    ],
  },
  {
    id: "credentials",
    name: "Credentials",
    application: "Venue access",
    inspectLabel: "View Event Horizon credential system",
    views: [
      {
        id: "credentials-system",
        src: "/projects/event-horizon-brand/credentials-system.webp",
        alt: "Event Horizon staff, VIP, and organizer credentials sharing one badge architecture.",
        label: "System",
        width: 1600,
        height: 869,
      },
      {
        id: "credential-staff",
        src: "/projects/event-horizon-brand/credential-staff.svg",
        alt: "Event Horizon staff credential for Jordan A. with an orange typographic O and Horizon spine.",
        label: "Staff",
        width: 340,
        height: 520,
      },
      {
        id: "credential-vip",
        src: "/projects/event-horizon-brand/credential-vip.svg",
        alt: "Event Horizon VIP credential for Alex R. with an orange typographic O and gold status chip.",
        label: "VIP",
        width: 340,
        height: 520,
      },
      {
        id: "credential-organizer",
        src: "/projects/event-horizon-brand/credential-organizer.svg",
        alt: "Event Horizon organizer credential for Chris K. with an orange typographic O and Ember spine.",
        label: "Organizer",
        width: 340,
        height: 520,
      },
    ],
  },
  {
    id: "compact-identity",
    name: "Compact identity",
    application: "Symbol application",
    inspectLabel: "View Event Horizon compact identity",
    views: [
      {
        id: "app-icon",
        src: "/projects/event-horizon-brand/app-icon.svg",
        alt: "Event Horizon app icon: a hollow orange ring on a void square.",
        label: "App icon",
        width: 1024,
        height: 1024,
      },
    ],
  },
] as const;

export const SYSTEM_APPLICATIONS: readonly ApplicationTile[] = [
  {
    id: "poster",
    name: "Poster",
    application: "Campaign system",
    inspectLabel: "View Event Horizon campaign poster",
    views: [
      {
        id: "poster-skyline",
        src: "/projects/event-horizon-brand/poster-skyline.webp",
        alt: "Skyline Jazz Sessions campaign poster with photography, a horizon line, and the orange-O wordmark.",
        label: "Skyline Jazz",
        width: 1162,
        height: 1600,
      },
    ],
  },
  {
    id: "program",
    name: "Program",
    application: "Editorial",
    inspectLabel: "View Event Horizon event program",
    views: [
      {
        id: "program-cover",
        src: "/projects/event-horizon-brand/program-cover.webp",
        alt: "Skyline Jazz Sessions program cover with a cropped hollow orange ring and plain EVENT HORIZON type.",
        label: "Cover",
        width: 1189,
        height: 1600,
      },
    ],
  },
  {
    id: "system-credentials",
    name: "Credentials",
    application: "Access system",
    inspectLabel: "View Event Horizon access credentials",
    views: [
      {
        id: "credential-vip",
        src: "/projects/event-horizon-brand/credential-vip.svg",
        alt: "Event Horizon VIP credential for Alex R. with an orange typographic O and gold status chip.",
        label: "VIP",
        width: 340,
        height: 520,
      },
      {
        id: "credentials-system",
        src: "/projects/event-horizon-brand/credentials-system.webp",
        alt: "Event Horizon staff, VIP, and organizer credentials sharing one badge architecture.",
        label: "System",
        width: 1600,
        height: 869,
      },
      {
        id: "credential-staff",
        src: "/projects/event-horizon-brand/credential-staff.svg",
        alt: "Event Horizon staff credential for Jordan A. with an orange typographic O and Horizon spine.",
        label: "Staff",
        width: 340,
        height: 520,
      },
      {
        id: "credential-organizer",
        src: "/projects/event-horizon-brand/credential-organizer.svg",
        alt: "Event Horizon organizer credential for Chris K. with an orange typographic O and Ember spine.",
        label: "Organizer",
        width: 340,
        height: 520,
      },
    ],
  },
  {
    id: "system-ticketing",
    name: "Ticketing",
    application: "Admission",
    inspectLabel: "View Event Horizon admission tickets",
    views: [
      {
        id: "ticket-ga",
        src: "/projects/event-horizon-brand/ticket-ga.svg",
        alt: "Event Horizon general admission ticket for Skyline Jazz Sessions with an orange typographic O.",
        label: "GA",
        width: 800,
        height: 280,
      },
      {
        id: "ticketing-system",
        src: "/projects/event-horizon-brand/ticketing-system.webp",
        alt: "Event Horizon general admission and VIP tickets for Skyline Jazz Sessions.",
        label: "System",
        width: 1600,
        height: 1187,
      },
      {
        id: "ticket-vip",
        src: "/projects/event-horizon-brand/ticket-vip.svg",
        alt: "Event Horizon VIP ticket for Skyline Jazz Sessions with a gold status chip.",
        label: "VIP",
        width: 800,
        height: 280,
      },
    ],
  },
  {
    id: "stationery",
    name: "Stationery",
    application: "Partner communication",
    inspectLabel: "View Event Horizon stationery system",
    views: [
      {
        id: "stationery-system",
        src: "/projects/event-horizon-brand/stationery-system.webp",
        alt: "Event Horizon partner letterhead and envelope with the orange-O wordmark on warm white paper.",
        label: "System",
        width: 1600,
        height: 951,
      },
      {
        id: "letterhead",
        src: "/projects/event-horizon-brand/letterhead.svg",
        alt: "Event Horizon partner letterhead with an orange typographic O and a thin horizon rule.",
        label: "Letterhead",
        width: 612,
        height: 792,
      },
      {
        id: "envelope",
        src: "/projects/event-horizon-brand/envelope.svg",
        alt: "Event Horizon envelope with an orange typographic O and The Velvet Room address.",
        label: "Envelope",
        width: 540,
        height: 380,
      },
    ],
  },
  {
    id: "system-digital",
    name: "Digital",
    application: "Product interface",
    inspectLabel: "View Event Horizon product interface",
    views: [
      {
        id: "digital-tablet",
        src: "/projects/event-horizon-brand/digital-tablet.webp",
        alt: "Event Horizon tablet browse interface with the orange-O wordmark and Night Market and After Dark Design cards.",
        label: "Tablet",
        width: 1600,
        height: 1014,
      },
      {
        id: "digital-system",
        src: "/projects/event-horizon-brand/digital-system.webp",
        alt: "Event Horizon mobile home and tablet browse screens sharing void fields, Outfit type, and Horizon orange.",
        label: "System",
        width: 1600,
        height: 801,
      },
      {
        id: "digital-phone",
        src: "/projects/event-horizon-brand/digital-phone.webp",
        alt: "Event Horizon phone interface with a hollow-ring app icon, Tonight label, and Skyline Jazz Sessions card.",
        label: "Mobile",
        width: 760,
        height: 1362,
      },
    ],
  },
] as const;

export const EVENTS_APPLICATIONS: readonly ApplicationTile[] = [
  {
    id: "events-ticketing",
    name: "Ticketing",
    application: "GA + VIP admission system",
    inspectLabel: "View Event Horizon ticketing applications",
    views: [
      {
        id: "ticketing-system",
        src: "/projects/event-horizon-brand/ticketing-system.webp",
        alt: "Event Horizon general admission and VIP tickets for Skyline Jazz Sessions.",
        label: "System",
        width: 1600,
        height: 1187,
      },
      {
        id: "ticket-ga",
        src: "/projects/event-horizon-brand/ticket-ga.svg",
        alt: "Event Horizon general admission ticket for Skyline Jazz Sessions with an orange typographic O.",
        label: "GA",
        width: 800,
        height: 280,
      },
      {
        id: "ticket-vip",
        src: "/projects/event-horizon-brand/ticket-vip.svg",
        alt: "Event Horizon VIP ticket for Skyline Jazz Sessions with a gold status chip.",
        label: "VIP",
        width: 800,
        height: 280,
      },
      {
        id: "ticket-mobile",
        src: "/projects/event-horizon-brand/ticket-mobile.svg",
        alt: "Event Horizon mobile ticket for Skyline Jazz Sessions with an orange typographic O.",
        label: "Mobile",
        width: 360,
        height: 720,
      },
      {
        id: "ticket-sleeve",
        src: "/projects/event-horizon-brand/ticket-sleeve.svg",
        alt: "Event Horizon ticket sleeve with a hollow orange ring above plain EVENT HORIZON type.",
        label: "Sleeve",
        width: 420,
        height: 300,
      },
    ],
  },
  {
    id: "events-credentials",
    name: "Credentials",
    application: "Staff · Artist · Guest",
    inspectLabel: "View Event Horizon credential applications",
    views: [
      {
        id: "credentials-events",
        src: "/projects/event-horizon-brand/credentials-events.webp",
        alt: "Event Horizon staff, artist, and VIP credentials sharing one badge architecture.",
        label: "System",
        width: 1600,
        height: 923,
      },
      {
        id: "credential-staff",
        src: "/projects/event-horizon-brand/credential-staff.svg",
        alt: "Event Horizon staff credential for Jordan A. with an orange typographic O and Horizon spine.",
        label: "Staff",
        width: 340,
        height: 520,
      },
      {
        id: "credential-artist",
        src: "/projects/event-horizon-brand/credential-artist.svg",
        alt: "Event Horizon artist credential for Mira Sol with an orange typographic O and Amber spine.",
        label: "Artist",
        width: 340,
        height: 520,
      },
      {
        id: "credential-vip",
        src: "/projects/event-horizon-brand/credential-vip.svg",
        alt: "Event Horizon VIP credential for Alex R. with an orange typographic O and gold status chip.",
        label: "VIP",
        width: 340,
        height: 520,
      },
      {
        id: "credential-organizer",
        src: "/projects/event-horizon-brand/credential-organizer.svg",
        alt: "Event Horizon organizer credential for Chris K. with an orange typographic O and Ember spine.",
        label: "Organizer",
        width: 340,
        height: 520,
      },
    ],
  },
  {
    id: "events-wayfinding",
    name: "Wayfinding",
    application: "Venue navigation system",
    inspectLabel: "View Event Horizon wayfinding system",
    views: [
      {
        id: "wayfinding-system",
        src: "/projects/event-horizon-brand/wayfinding-system.webp",
        alt: "Event Horizon wayfinding signs for Main stage, VIP entry, and Check in.",
        label: "System",
        width: 1421,
        height: 1600,
      },
      {
        id: "signage-main-stage",
        src: "/projects/event-horizon-brand/signage.svg",
        alt: "Event Horizon main-stage wayfinding sign with orange-O wordmark and directional arrow.",
        label: "Main stage",
        width: 400,
        height: 200,
      },
      {
        id: "signage-vip-entry",
        src: "/projects/event-horizon-brand/signage-vip-entry.svg",
        alt: "Event Horizon VIP entry wayfinding sign with orange-O wordmark, gold status chip, and directional arrow.",
        label: "VIP entry",
        width: 400,
        height: 200,
      },
      {
        id: "signage-check-in",
        src: "/projects/event-horizon-brand/signage-check-in.svg",
        alt: "Event Horizon check-in wayfinding sign with orange-O wordmark and directional arrow.",
        label: "Check in",
        width: 400,
        height: 200,
      },
      {
        id: "signage-event-info",
        src: "/projects/event-horizon-brand/signage-event-info.svg",
        alt: "Event Horizon event info wayfinding sign with orange-O wordmark.",
        label: "Event info",
        width: 400,
        height: 200,
      },
      {
        id: "signage-restrooms",
        src: "/projects/event-horizon-brand/signage-restrooms.svg",
        alt: "Event Horizon restrooms wayfinding sign with orange-O wordmark.",
        label: "Restrooms",
        width: 400,
        height: 200,
      },
      {
        id: "signage-exit",
        src: "/projects/event-horizon-brand/signage-exit.svg",
        alt: "Event Horizon exit wayfinding sign with orange-O wordmark and directional arrow.",
        label: "Exit",
        width: 400,
        height: 200,
      },
    ],
  },
] as const;

type GalleryView = {
  tileIndex: number;
  viewIndex: number;
  tile: ApplicationTile;
  view: ApplicationView;
};

export function EventHorizonApplicationGallery({
  items,
  layout,
}: {
  items: readonly ApplicationTile[];
  layout: "bridge" | "system";
}) {
  const reducedMotion = useReducedMotion();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const views: GalleryView[] = items.flatMap((tile, tileIndex) =>
    tile.views.map((view, viewIndex) => ({ tileIndex, viewIndex, tile, view })),
  );

  const openTile = useCallback(
    (tileIndex: number) => {
      const index = views.findIndex((entry) => entry.tileIndex === tileIndex);
      setLightboxIndex(index < 0 ? 0 : index);
    },
    [views],
  );

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrev = useCallback(() => {
    setLightboxIndex((current) =>
      current == null ? current : (current + views.length - 1) % views.length,
    );
  }, [views.length]);
  const showNext = useCallback(() => {
    setLightboxIndex((current) =>
      current == null ? current : (current + 1) % views.length,
    );
  }, [views.length]);

  const active = lightboxIndex == null ? null : views[lightboxIndex];

  return (
    <>
      <ul
        className={cn(
          "grid list-none",
          layout === "bridge"
            ? "grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
            : "grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {items.map((tile, tileIndex) => {
          const view = tile.views[0];
          return (
            <li key={tile.id} className="min-w-0">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#171717]">
                <button
                  type="button"
                  onClick={() => openTile(tileIndex)}
                  aria-label={tile.inspectLabel}
                  className="flex flex-1 flex-col text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C2B]"
                >
                  <div className="flex h-[200px] items-center justify-center bg-[#0B0B0B] px-4 py-4 sm:h-[220px]">
                    <Image
                      src={view.src}
                      alt=""
                      width={view.width}
                      height={view.height}
                      unoptimized={isSvgImageSrc(view.src)}
                      sizes={
                        layout === "bridge"
                          ? "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                          : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      }
                      className={cn(
                        "h-auto max-h-full w-auto max-w-full object-contain",
                        !reducedMotion &&
                          "transition-transform duration-300 motion-safe:group-hover:scale-[1.02]",
                      )}
                    />
                  </div>
                  <div className="flex items-start justify-between gap-3 px-4 pb-4 pt-3">
                    <div>
                      <h3 className="font-display text-base font-semibold text-[#F4F0EB]">
                        {tile.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-[#C4BBB3]">
                        {tile.application}
                      </p>
                    </div>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-[#8A8178]">
                      <Expand className="size-3" aria-hidden />
                      View
                    </span>
                  </div>
                </button>
              </article>
            </li>
          );
        })}
      </ul>

      <CaseStudyLightbox
        open={active != null}
        title={active ? `${active.tile.name} · ${active.view.label}` : ""}
        onClose={closeLightbox}
        accent={ACCENT}
        wide
        onPrev={showPrev}
        onNext={showNext}
      >
        {active ? (
          <figure>
            <div className="grid place-items-center">
              <Image
                src={active.view.src}
                alt={active.view.alt}
                width={active.view.width}
                height={active.view.height}
                unoptimized={isSvgImageSrc(active.view.src)}
                className="h-auto max-h-[min(78vh,860px)] w-auto max-w-full object-contain"
              />
            </div>
            <figcaption className="mt-3 text-sm text-[#D4CDC6]">
              {active.view.label}
            </figcaption>
          </figure>
        ) : null}
      </CaseStudyLightbox>
    </>
  );
}
