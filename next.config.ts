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
  images: {
    dangerouslyAllowSVG: true,
    // inline so optimized SVG URLs render in <img>, not as downloads
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
