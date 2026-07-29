import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
const useProxy = process.env.NEXT_PUBLIC_USE_PROXY === "true";
/** Rewrites are unsupported with `output: "export"` — enable export only for production builds. */
const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  ...(isDev ? {} : { output: "export" as const }),
  images: { unoptimized: true },
  trailingSlash: true,
  // Keep export folder layout with trailing slash, but do not redirect
  // `/api/dealer/...` → `/api/dealer/.../` (breaks Node paths + proxy).
  skipTrailingSlashRedirect: true,
  // Works in `next dev` (export off). Production static uses Nginx `/api/`.
  async rewrites() {
    if (!useProxy || !apiUrl) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
