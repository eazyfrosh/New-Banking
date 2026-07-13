import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server Actions reject any request whose Origin header doesn't match
      // the Host/x-forwarded-host header, as CSRF protection. Vercel's edge
      // network sits in front of the app as a reverse proxy, so the two can
      // legitimately differ (custom domain, deployment aliasing, etc) —
      // without this, every Server Action POST is aborted with a 500 before
      // it ever reaches our code. VERCEL_URL/VERCEL_PROJECT_PRODUCTION_URL
      // are provided automatically by Vercel and always resolve to this
      // project's own domains for the deployment being built.
      allowedOrigins: [
        "nexus-one-topaz.vercel.app",
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
        process.env.VERCEL_URL,
      ].filter((origin): origin is string => Boolean(origin)),
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
