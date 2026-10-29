/**
 * Entry point: a Next.js custom server.
 *
 * Next.js serves pages and the `/api/*` proxy. The only reason for a custom
 * server is that the backend's WebSockets must be bridged on the same origin
 * (route handlers cannot upgrade connections, and the echo socket needs an
 * Authorization header browsers cannot send). Everything else is plain Next.js.
 *
 *   npm run dev    → development with hot reload
 *   npm start      → production (run `npm run build` first)
 */
import { createServer } from "node:http";
import nextEnv from "@next/env"; // CommonJS package: use the default import.
import next from "next";
import { readSettings } from "./src/lib/config/settings";
import { createWebSocketBridge } from "./src/lib/gateway/websocketBridge";

const dev = !process.argv.includes("--production");
// Loads .env / .env.local exactly like `next dev` / `next start` would.
nextEnv.loadEnvConfig(process.cwd(), dev);

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOST || "0.0.0.0";
const settings = readSettings(); // Fails fast on invalid configuration.

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();
const bridge = createWebSocketBridge(settings);
const upgradeNext = app.getUpgradeHandler(); // Hot-reload socket in development.

const server = createServer((req, res) => void handle(req, res));
server.on("upgrade", (req, socket, head) => {
  if (!bridge.handleUpgrade(req, socket, head)) void upgradeNext(req, socket, head);
});
server.on("error", (error: NodeJS.ErrnoException) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Port ${port} is already in use. Stop the other process or set PORT in .env.`
      : `Server could not start: ${error.message}`,
  );
  process.exit(1);
});
server.listen(port, hostname, () => {
  console.log(`IDICorp console (${dev ? "development" : "production"})`);
  console.log(`  → http://localhost:${port}   backend: ${settings.httpTarget}`);
});

const shutdown = () => {
  bridge.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
