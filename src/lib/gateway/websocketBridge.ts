/**
 * Same-origin WebSocket bridge used by the custom Next.js server.
 *
 * Next.js route handlers cannot accept WebSocket upgrades, so the custom
 * server hands `/ws/calculator` and `/ws/echo` upgrades to this module, which
 * pipes them to the real backend. Frames are never interpreted or generated
 * here: results always come from the backend.
 */
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import httpProxy from "http-proxy";
import type { ServerSettings } from "../../types";
import { applyEchoAuth, EchoAuthError } from "./echoAuth";
import { isSameOrigin } from "./proxyHeaders";

const reject = (socket: Duplex, status: string) =>
  socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`);

export function createWebSocketBridge(settings: ServerSettings) {
  const proxy = httpProxy.createProxyServer({ changeOrigin: true, ws: true });
  const routes = new Map(Object.values(settings.sockets).map((s) => [s.path, s.upstream]));
  /** Subprotocol to select back to the browser, per in-flight request. */
  const selected = new WeakMap<IncomingMessage, string>();

  // Remove the credential envelope from the upstream handshake and set Bearer.
  proxy.on("proxyReqWs", (upstreamRequest, req) => {
    const protocol = selected.get(req);
    if (!protocol) return;
    upstreamRequest.setHeader("Authorization", String(req.headers.authorization));
    upstreamRequest.removeHeader("Sec-WebSocket-Protocol");
    // http-proxy copies the upstream 101 headers to the browser afterwards;
    // the browser requires the selected protocol to be one it offered.
    upstreamRequest.prependOnceListener("upgrade", (response) => {
      response.headers["sec-websocket-protocol"] = protocol;
    });
    upstreamRequest.once("response", (response) =>
      console.warn(`WebSocket upstream rejected ${req.url}: HTTP ${response.statusCode}`),
    );
  });
  proxy.on("error", (_error, _req, target) => {
    if (target && "destroy" in target) (target as Duplex).destroy();
  });

  /** Returns true when the upgrade belonged to the bridge. */
  function handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): boolean {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    const upstream = routes.get(path);
    if (!upstream) return false;
    if (!isSameOrigin(req.headers.origin, req.headers.host)) {
      reject(socket, "403 Forbidden");
      return true;
    }
    if (path === settings.sockets.echo.path) {
      try {
        const protocol = applyEchoAuth(req);
        if (protocol) selected.set(req, protocol);
      } catch (error) {
        if (error instanceof EchoAuthError) {
          reject(socket, "400 Bad Request");
          return true;
        }
        throw error;
      }
    }
    proxy.ws(req, socket, head, { target: upstream, ignorePath: true });
    return true;
  }

  return { handleUpgrade, close: () => proxy.close() };
}
