"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BlueprintBackground } from "@/components/shared/BlueprintBackground";
import { ScrollProgress } from "@/components/shared/ScrollProgress";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { CustomCursor } from "@/components/shared/CustomCursor";
import { PageTransition } from "@/components/shared/PageTransition";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <BlueprintBackground />
      <CustomCursor />
      <Navbar onOpenCommand={() => setCommandOpen(true)} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <PageTransition>
        <main id="main" className="relative flex-1">
          {children}
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
