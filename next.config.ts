import type { NextConfig } from "next";
import { HERO_VERSION } from "./src/lib/hero-version";

const nextConfig: NextConfig = {
  images: {
    // Sign-in hero assets are referenced with a cache-busting ?v= query (see src/lib/hero-version.ts).
    localPatterns: [
      { pathname: "/login-hero.jpg", search: `?v=${HERO_VERSION}` },
      { pathname: "/logo.png", search: `?v=${HERO_VERSION}` },
    ],
  },
  // Keep the PDF renderer out of the server bundle; it is loaded from node_modules at runtime.
  serverExternalPackages: ["@react-pdf/renderer"],
  // Ensure bundled fonts are shipped with the serverless function on Vercel.
  outputFileTracingIncludes: {
    "/api/receipts/[token]/pdf": ["./src/lib/pdf/fonts/**/*"],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
