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
    dangerouslyAllowSVG: true,
    // inline so optimized SVG URLs render in <img>, not as downloads
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
