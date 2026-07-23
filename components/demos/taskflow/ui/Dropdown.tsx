"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/demos/taskflow/utils";

type Option = { value: string; label: string };

export function Dropdown({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-elevated px-3 text-sm text-ink hover:bg-subtle"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-muted">{label}:</span>
        <span>{selected?.label ?? value}</span>
        <ChevronDown className="size-3.5 text-muted" aria-hidden />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 z-40 mt-2 min-w-[10rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-xl"
        >
          {options.map((opt) => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-subtle",
                  opt.value === value ? "text-accent" : "text-ink",
                )}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
