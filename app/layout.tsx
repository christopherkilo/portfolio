import type { Metadata } from "next";
import { Outfit, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import { SITE } from "@/lib/constants";
import "./globals.css";

const themeInitializer = `
  (function () {
    try {
      var stored = localStorage.getItem("portfolio-theme");
      var theme = stored === "light" || stored === "dark"
        ? stored
        : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (_) {
      var fallback = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.dataset.theme = fallback;
      document.documentElement.style.colorScheme = fallback;
    }
  })();
`;

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://christopherkilo.dev"),
  title: {
    default: `${SITE.name} — ${SITE.title}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
