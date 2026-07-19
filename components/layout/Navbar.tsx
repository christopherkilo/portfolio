"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Command, Menu } from "lucide-react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MobileMenu, useMobileMenu } from "@/components/layout/MobileMenu";

type NavbarProps = {
  onOpenCommand?: () => void;
};

export function Navbar({ onOpenCommand }: NavbarProps) {
  const pathname = usePathname();
  const { open, openMenu, closeMenu } = useMobileMenu();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 h-[var(--nav-height)] border-b transition-colors duration-300",
          scrolled
            ? "border-border bg-bg/80 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-text transition hover:text-white"
          >
            {SITE.name}
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-primary/15 text-white"
                      : "text-muted hover:bg-white/5 hover:text-text",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCommand}
              className="hidden items-center gap-2 rounded-xl border border-border bg-surface/70 px-3 py-2 text-xs text-muted transition hover:border-primary/40 hover:text-text md:inline-flex"
              aria-label="Open command palette"
            >
              <Command className="size-3.5" aria-hidden />
              <span>Search</span>
              <kbd className="rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface/70 text-text md:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={openMenu}
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={open} onClose={closeMenu} />
    </>
  );
}
