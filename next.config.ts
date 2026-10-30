import type { NextConfig } from "next";

/**
 * Two build modes share this file:
 *
 * - Server mode (default, `npm run build` + `npm start`): full app with the
 *   `/api` proxy and the WebSocket bridge in server.ts.
 * - Static export (`npm run build:static`): plain HTML/JS/CSS in `out/` for
 *   static hosts such as GitHub Pages. Route handlers are named
 *   `route.server.ts`, so they are only picked up in server mode.
 */
const isStatic = process.env.STATIC_EXPORT === "1";

/** Security headers for server mode (static hosts set their own headers). */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isStatic
    ? {
        output: "export",
        // GitHub Pages serves a project site under /<repository>/.
        basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
        trailingSlash: true,
        pageExtensions: ["tsx", "ts"],
        images: { unoptimized: true },
      }
    : {
        pageExtensions: ["server.ts", "tsx", "ts"],
        async headers() {
          return [{ source: "/:path*", headers: securityHeaders }];
        },
      }),
};

export default nextConfig;
