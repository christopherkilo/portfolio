"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/demos/novatech/constants";
import { cn } from "@/lib/demos/novatech/utils";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type AccordionProps = {
  items?: readonly FaqItem[];
};

export function Accordion({ items = FAQ_ITEMS }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const reducedMotion = useReducedMotion();

  return (
    <div className="space-y-3" role="list">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div
            key={item.id}
            role="listitem"
            className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
          >
            <h3>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-ink transition hover:bg-bg"
                aria-expanded={open}
                aria-controls={`faq-panel-${item.id}`}
                id={`faq-button-${item.id}`}
                onClick={() => setOpenId(open ? null : item.id)}
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-accent transition-transform duration-200",
                    open && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  id={`faq-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-button-${item.id}`}
                  initial={
                    reducedMotion ? false : { height: 0, opacity: 0 }
                  }
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted md:text-base">
                    {item.answer}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
