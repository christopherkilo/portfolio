import { Navbar } from "@/components/demos/novatech/layout/Navbar";
import { Footer } from "@/components/demos/novatech/layout/Footer";
import { MotionProvider } from "@/components/demos/novatech/shared/MotionProvider";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-contrast"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="relative flex-1">
        {children}
      </main>
      <Footer />
    </MotionProvider>
  );
}
