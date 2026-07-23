"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sidebar } from "@/components/demos/taskflow/layout/Sidebar";
import { TopNav } from "@/components/demos/taskflow/layout/TopNav";
import { CommandPalette } from "@/components/demos/taskflow/shared/CommandPalette";
import { pageVariants } from "@/lib/demos/taskflow/animation";
import { NAV_ITEMS } from "@/lib/demos/taskflow/data";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  const title =
    NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label ??
    "TaskFlow";

  useEffect(() => {
    try {
      const settings = JSON.parse(
        localStorage.getItem("taskflow-settings") ?? "{}",
      );
      document.documentElement.dataset.density =
        settings.density ?? "comfortable";
    } catch {
      document.documentElement.dataset.density = "comfortable";
    }
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
      }
      if (event.key === "Tab" && mobilePanelRef.current) {
        const links = Array.from(
          mobilePanelRef.current.querySelectorAll<HTMLElement>("a, button"),
        );
        if (!links.length) return;
        const first = links[0];
        const last = links[links.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() =>
      mobilePanelRef.current?.querySelector<HTMLElement>("a")?.focus(),
    );
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-overlay-soft"
              aria-label="Close sidebar"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              ref={mobilePanelRef}
              className="absolute inset-y-0 left-0"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              exit={{ x: -20 }}
            >
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav
          title={title}
          onOpenCommand={() => setCommandOpen(true)}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        {reducedMotion ? (
          <main id="main" className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        ) : (
          <AnimatePresence mode="wait">
            <motion.main
              id="main"
              key={pathname}
              className="flex-1 p-4 sm:p-6"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
