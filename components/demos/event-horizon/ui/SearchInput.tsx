"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/demos/event-horizon/utils";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  onSubmit?: () => void;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Search events, venues, cities…",
  className,
  id = "event-search",
  onSubmit,
}: SearchInputProps) {
  return (
    <form
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      role="search"
    >
      <label htmlFor={id} className="sr-only">
        Search events
      </label>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent/50 focus:ring-2 focus:ring-accent/30"
      />
    </form>
  );
}
