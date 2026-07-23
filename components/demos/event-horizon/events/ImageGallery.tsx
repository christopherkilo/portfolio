"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/demos/event-horizon/utils";

type ImageGalleryProps = {
  images: string[];
  alt: string;
};

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-surface-elevated">
        <motion.div
          key={active}
          initial={{ opacity: 0.4, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0"
        >
          <Image
            src={images[active] ?? images[0]}
            alt={`${alt} photo ${active + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover"
            priority
          />
        </motion.div>
      </div>
      <ul className="mt-3 flex gap-3 overflow-x-auto pb-1" aria-label="Gallery thumbnails">
        {images.map((src, i) => (
          <li key={`${src}-${i}`}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={active === i}
              className={cn(
                "relative size-20 overflow-hidden rounded-xl border transition",
                active === i
                  ? "border-accent ring-2 ring-accent/30"
                  : "border-border opacity-80 hover:opacity-100",
              )}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
