"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { Expand } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CaseStudyLightbox } from "@/components/projects/shared/CaseStudyChrome";

const ACCENT = "#FF8C2B";

type MerchView = {
  id: string;
  src: string;
  alt: string;
  label: string;
  width: number;
  height: number;
};

type MerchProduct = {
  id: string;
  name: string;
  application: string;
  inspectLabel: string;
  views: readonly MerchView[];
};

export const MERCH_PRODUCTS: readonly MerchProduct[] = [
  {
    id: "shirt",
    name: "T-Shirt",
    application: "Front + back application",
    inspectLabel: "View Event Horizon T-shirt mockups",
    views: [
      {
        id: "shirt-front",
        src: "/projects/event-horizon-brand/shirt-front.webp",
        alt: "Black Event Horizon T-shirt front with a small EVENT HORIZON wordmark and orange typographic O on the chest.",
        label: "Front",
        width: 1200,
        height: 1440,
      },
      {
        id: "shirt-back",
        src: "/projects/event-horizon-brand/shirt-back.webp",
        alt: "Black Event Horizon T-shirt back with a cropped orange horizon arc and the line Where nights out gather gravity.",
        label: "Back",
        width: 1200,
        height: 1440,
      },
    ],
  },
  {
    id: "hoodie",
    name: "Hoodie",
    application: "Front + back application",
    inspectLabel: "View Event Horizon hoodie mockups",
    views: [
      {
        id: "hoodie-front",
        src: "/projects/event-horizon-brand/hoodie-front.webp",
        alt: "Black Event Horizon hoodie front with a small EVENT HORIZON wordmark and orange typographic O on the chest.",
        label: "Front",
        width: 1200,
        height: 1440,
      },
      {
        id: "hoodie-back",
        src: "/projects/event-horizon-brand/hoodie-back.webp",
        alt: "Black Event Horizon hoodie with an oversized orange horizon arc printed across the back and the product tagline.",
        label: "Back",
        width: 1200,
        height: 1440,
      },
    ],
  },
  {
    id: "staff",
    name: "Staff shirt",
    application: "Crew application",
    inspectLabel: "View Event Horizon staff shirt mockups",
    views: [
      {
        id: "staff-front",
        src: "/projects/event-horizon-brand/staff-front.webp",
        alt: "Black Event Horizon staff shirt front with a small EVENT HORIZON wordmark and orange typographic O on the chest.",
        label: "Front",
        width: 1200,
        height: 1440,
      },
      {
        id: "staff-back",
        src: "/projects/event-horizon-brand/staff-back.webp",
        alt: "Black Event Horizon staff shirt back with large STAFF type and EVENT CREW in orange.",
        label: "Back",
        width: 1100,
        height: 1320,
      },
    ],
  },
  {
    id: "notebook",
    name: "Notebook",
    application: "Deboss + foil",
    inspectLabel: "View Event Horizon notebook mockups",
    views: [
      {
        id: "notebook-hero",
        src: "/projects/event-horizon-brand/notebook.webp",
        alt: "Black Event Horizon notebook with a hollow orange ring above the EVENT HORIZON wordmark.",
        label: "Hero",
        width: 1024,
        height: 1024,
      },
      {
        id: "notebook-detail",
        src: "/projects/event-horizon-brand/notebook-detail.webp",
        alt: "Close-up of Event Horizon notebook foil: a hollow orange ring above a plain EVENT HORIZON wordmark.",
        label: "Detail",
        width: 1800,
        height: 1200,
      },
    ],
  },
  {
    id: "tote",
    name: "Tote",
    application: "Tagline application",
    inspectLabel: "View Event Horizon tote mockup",
    views: [
      {
        id: "tote",
        src: "/projects/event-horizon-brand/tote.webp",
        alt: "Dark Event Horizon tote with a thin horizon rule, the line Where nights out gather gravity, and a small wordmark at the lower right.",
        label: "Front",
        width: 1024,
        height: 1024,
      },
    ],
  },
  {
    id: "tumbler",
    name: "Tumbler",
    application: "Printed drinkware",
    inspectLabel: "View Event Horizon tumbler mockup",
    views: [
      {
        id: "tumbler",
        src: "/projects/event-horizon-brand/tumbler.webp",
        alt: "Matte black Event Horizon bottle with a hollow orange ring above the EVENT HORIZON wordmark and a thin orange horizon line.",
        label: "Front",
        width: 1024,
        height: 1024,
      },
    ],
  },
  {
    id: "event-cup",
    name: "Event cup",
    application: "Venue drinkware",
    inspectLabel: "View Event Horizon event cup mockup",
    views: [
      {
        id: "event-cup",
        src: "/projects/event-horizon-brand/event-cup.webp",
        alt: "Black Event Horizon event cup with a small EVENT HORIZON wordmark and orange typographic O.",
        label: "Front",
        width: 1200,
        height: 1440,
      },
    ],
  },
  {
    id: "stickers",
    name: "Stickers",
    application: "Sticker system",
    inspectLabel: "View Event Horizon sticker mockups",
    views: [
      {
        id: "stickers",
        src: "/projects/event-horizon-brand/stickers.webp",
        alt: "Event Horizon sticker set with a hollow ring, wordmark, tagline, and horizon-line marks.",
        label: "Set",
        width: 1400,
        height: 933,
      },
    ],
  },
] as const;

type GalleryView = {
  productIndex: number;
  viewIndex: number;
  product: MerchProduct;
  view: MerchView;
};

const GALLERY_VIEWS: GalleryView[] = MERCH_PRODUCTS.flatMap((product, productIndex) =>
  product.views.map((view, viewIndex) => ({
    productIndex,
    viewIndex,
    product,
    view,
  })),
);

export function EventHorizonMerchGallery() {
  const reducedMotion = useReducedMotion();
  const [selectedByProduct, setSelectedByProduct] = useState<Record<string, number>>(
    {},
  );
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const views = GALLERY_VIEWS;

  const selectedView = (product: MerchProduct) =>
    product.views[selectedByProduct[product.id] ?? 0] ?? product.views[0];

  const openProduct = useCallback(
    (productIndex: number) => {
      const product = MERCH_PRODUCTS[productIndex];
      const viewIndex = selectedByProduct[product.id] ?? 0;
      const index = views.findIndex(
        (entry) =>
          entry.productIndex === productIndex && entry.viewIndex === viewIndex,
      );
      setLightboxIndex(index < 0 ? 0 : index);
    },
    [selectedByProduct, views],
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
      <ul className="grid list-none grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MERCH_PRODUCTS.map((product, productIndex) => {
          const view = selectedView(product);
          const multi = product.views.length > 1;
          return (
            <li key={product.id} className="min-w-0">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#171717]">
                <button
                  type="button"
                  onClick={() => openProduct(productIndex)}
                  aria-label={product.inspectLabel}
                  className="flex flex-1 flex-col text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C2B]"
                >
                  <div className="flex min-h-[280px] items-center justify-center bg-[#0B0B0B] px-5 py-6 sm:min-h-[320px]">
                    <Image
                      src={view.src}
                      alt=""
                      width={view.width}
                      height={view.height}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className={cn(
                        "h-auto max-h-[340px] w-auto max-w-full object-contain",
                        !reducedMotion &&
                          "transition-transform duration-300 motion-safe:group-hover:scale-[1.02]",
                      )}
                    />
                  </div>
                  <div className="flex items-start justify-between gap-3 px-5 pb-5 pt-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-[#F4F0EB]">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-[#C4BBB3]">
                        {product.application}
                      </p>
                    </div>
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-[#8A8178]">
                      <Expand className="size-3.5" aria-hidden />
                      View
                    </span>
                  </div>
                </button>
                {multi ? (
                  <div
                    className="flex flex-wrap gap-2 border-t border-white/8 px-5 py-3"
                    role="group"
                    aria-label={`${product.name} views`}
                  >
                    {product.views.map((entry, viewIndex) => {
                      const pressed =
                        (selectedByProduct[product.id] ?? 0) === viewIndex;
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          aria-pressed={pressed}
                          onClick={() =>
                            setSelectedByProduct((current) => ({
                              ...current,
                              [product.id]: viewIndex,
                            }))
                          }
                          className={cn(
                            "min-h-9 rounded-full border px-3 text-xs tracking-[0.04em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C2B]",
                            pressed
                              ? "border-[#FF8C2B] bg-[#FF8C2B]/10 text-[#F4F0EB]"
                              : "border-white/15 text-[#C4BBB3] hover:border-white/30 hover:text-[#F4F0EB]",
                          )}
                        >
                          {entry.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>

      <CaseStudyLightbox
        open={active != null}
        title={active ? `${active.product.name} · ${active.view.label}` : ""}
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
