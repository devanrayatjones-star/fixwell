import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page reads live data (bookings, availability), so we use the
  // simpler "always fresh" model rather than Cache Components.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: {
      // Insurance documents and photos are uploaded through forms. Files are
      // capped at 4 MB (Vercel rejects request bodies over 4.5 MB), and photos
      // are shrunk in the browser before upload.
      bodySizeLimit: "4.5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
