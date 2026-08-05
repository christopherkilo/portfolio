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
  description?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Search events, venues, cities…",
  className,
  id = "event-search",
  onSubmit,
  description = "Results update as you type. Filters stay in the page URL.",
}: SearchInputProps) {
  const descriptionId = `${id}-description`;

  return (
    <form
      className={cn("eh-search-bloom relative", className)}
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
        className="eh-search-icon pointer-events-none absolute left-4 top-1/2 z-[1] size-4 -translate-y-1/2 text-muted transition-colors duration-300"
        aria-hidden
      />
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-describedby={descriptionId}
        autoComplete="off"
        className="h-12 w-full rounded-2xl border border-border bg-surface/95 pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus-visible:border-accent/50"
      />
      <p id={descriptionId} className="sr-only">
        {description}
      </p>
    </form>
  );
}
