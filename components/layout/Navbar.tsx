"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Command, Menu } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MobileMenu, useMobileMenu } from "@/components/layout/MobileMenu";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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
            ? "border-border bg-[var(--nav-scrolled)] backdrop-blur-2xl"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group font-display text-lg font-semibold tracking-tight text-text transition hover:opacity-90"
            aria-label="Christopher Kilo"
          >
            CHRISTOPHER KILO
            <span className="text-muted transition-colors group-hover:text-primary">
              .
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <NavItem
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  active={active}
                />
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCommand}
              className="group hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-muted backdrop-blur-xl transition hover:border-white/20 hover:text-text md:inline-flex"
              aria-label="Open command palette"
            >
              <Command className="icon-interactive size-3.5" aria-hidden />
              <span>Search</span>
              <kbd className="rounded border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </button>

            <ThemeToggle className="hidden md:inline-flex" />

            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-text backdrop-blur-xl md:hidden"
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

function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  const [origin, setOrigin] = useState<"left" | "right">("left");

  return (
    <Link
      href={href}
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setOrigin(e.clientX < rect.left + rect.width / 2 ? "left" : "right");
      }}
      className={cn(
        "group relative block rounded-lg px-3 py-2 text-sm font-medium transition",
        active ? "text-text" : "text-muted hover:text-text",
      )}
    >
      {label}
      <span
        className={cn(
          "absolute inset-x-3 -bottom-0.5 h-px scale-x-0 bg-primary/90 shadow-[0_0_6px_var(--glow-yellow)] transition-transform duration-300 group-hover:scale-x-100",
          origin === "left" ? "origin-left" : "origin-right",
          active && "scale-x-100",
        )}
        aria-hidden
      />
    </Link>
  );
}
