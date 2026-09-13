import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Parent Desktop/package-lock.json otherwise becomes the Turbopack root and
  // breaks module resolution (e.g. lucide-react MODULE_NOT_FOUND on project pages).
  turbopack: {
    root: projectRoot,
  },
  // Dev-only: Chrome opened at 127.0.0.1 while `next dev` advertises localhost.
  // Without this, Next blocks /_next assets and Framer-hidden homepage content never appears.
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      {
        source: "/lab",
        destination: "/projects",
        permanent: true,
      },
      {
        source: "/lab/:path*",
        destination: "/projects",
        permanent: true,
      },
      {
        source: "/resume.pdf",
        destination: "/Christopher_Kilo_Resume.pdf",
        permanent: true,
      },
    ];
  },
  images: {
    qualities: [75, 90],
    dangerouslyAllowSVG: true,
    // inline so optimized SVG URLs render in <img>, not as downloads
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "s1.ticketm.net" },
      { protocol: "https", hostname: "*.ticketm.net" },
      { protocol: "https", hostname: "i.ticketweb.com" },
    ],
  },
};

export default nextConfig;
