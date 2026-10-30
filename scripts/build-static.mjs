/**
 * Builds the static version of the console into `out/` (for GitHub Pages or
 * any static host). Works the same on Windows, Linux and macOS.
 *
 *   npm run build:static                          → site served from "/"
 *   BASE_PATH=/idicorp-console npm run build:static → site under /idicorp-console/
 *
 * By default the site runs the built-in demo backend (no server needed, as a
 * static host requires). DEMO_MODE=0 instead calls API_BASE_URL directly from
 * the browser, which only works if the backend allows the site's origin (CORS).
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const apiOrigin = new URL(process.env.API_BASE_URL || "https://ts.idicorp.ir").origin;
const basePath = (process.env.BASE_PATH || "").replace(/\/+$/, "");
const demo = process.env.DEMO_MODE !== "0";

const result = spawnSync(process.execPath, [require.resolve("next/dist/bin/next"), "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    STATIC_EXPORT: "1",
    API_BASE_URL: apiOrigin,
    NEXT_PUBLIC_DIRECT_API_ORIGIN: demo ? "" : apiOrigin,
    NEXT_PUBLIC_DEMO_MODE: demo ? "1" : "0",
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
});
if (result.status !== 0) process.exit(result.status ?? 1);

// GitHub Pages runs Jekyll by default, which hides folders starting with "_"
// such as `_next/`. This empty file turns Jekyll off.
writeFileSync("out/.nojekyll", "");
console.log(
  `\nStatic site ready in out/  (${demo ? "demo backend in the browser" : `API: ${apiOrigin}`}, base path: "${basePath || "/"}")`,
);
