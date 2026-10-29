# IDICorp Service Console — v2.0.0 (Next.js + Tailwind CSS)

Internal console for the IDICorp service: sign in with the backend CAPTCHA, manage
session-scoped tasks, and use the calculator, text-echo and streaming-echo tools.

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **Tests:** Vitest unit tests only (no e2e / integration tests)
- **Backend:** `https://ts.idicorp.ir` by default (configurable)

A full write-up of what was wrong with the previous version and how this
version fixes it is in [`docs/REFACTOR-REPORT.fa.md`](docs/REFACTOR-REPORT.fa.md) (Persian).

---

## Requirements

| Tool    | Version                                 |
| ------- | --------------------------------------- |
| Node.js | **20.9 or newer** (22 or 24 LTS recommended) |
| npm     | comes with Node.js                      |

Works the same on **Windows, Linux and macOS**. Internet access is needed for
`npm ci` and for reaching the backend.

## Run it

Open a terminal **inside the project folder** (where `package.json` is):

```bash
npm ci            # 1. install exact dependency versions (first time only)
npm run build     # 2. production build
npm start         # 3. start the console
```

Then open **http://localhost:3000**.

> **Windows PowerShell:** if you see "running scripts is disabled on this system",
> use `npm.cmd` instead of `npm` (for example `npm.cmd ci`), or use Command Prompt.

Development mode with hot reload (no build step needed):

```bash
npm run dev
```

Other commands:

| Command          | What it does                       |
| ---------------- | ---------------------------------- |
| `npm test`       | run all unit tests once            |
| `npm run test:watch` | unit tests in watch mode       |
| `npm run lint`   | TypeScript type check              |

Health check: http://localhost:3000/healthz → `{"status":"ok","release":"2.0.0","api_origin":"https://ts.idicorp.ir"}`

## Configuration (optional)

Nothing is required for the default backend. To change settings, copy
`.env.example` to `.env` and edit it:

```dotenv
API_BASE_URL=https://ts.idicorp.ir   # backend origin, no path/query
PORT=3000                            # console port
HOST=0.0.0.0                         # 0.0.0.0 = reachable from other devices
# CALCULATOR_WS_URL=wss://ts.idicorp.ir/ws/calculator
# ECHO_WS_URL=wss://ts.idicorp.ir/ws/echo
```

Settings are read when the server starts, so restart after editing `.env`.
No token or secret belongs in configuration.

### Opening it from another device (phone, other PC)

The server listens on all interfaces by default. Find this computer's LAN IP
(`ipconfig` on Windows, `ip addr` on Linux, `ipconfig getifaddr en0` on macOS) and
open `http://<that-ip>:3000` on the other device. Allow the port through the
firewall if needed. The session cookies are automatically adapted for plain HTTP,
so sign-in works without HTTPS on a LAN. For any public deployment, put the app
behind HTTPS.

## Signing in

Credentials are supplied by the environment (`admin` / `admin` in the verified
environment). Type the CAPTCHA shown in the image: it comes from the backend and
is never computed or pre-filled by the console. The token is kept in memory only,
so **reloading the page requires signing in again**, which by the backend contract
also starts a new, empty task collection. After sign-in you return to the page you
originally opened.

## Architecture

```
server.ts                  Next.js custom server: pages + WebSocket bridge
src/
  app/                     App Router (routes, layouts, route handlers)
    (workspace)/           signed-in screens + auth guard layout
    api/[...path]/route.ts same-origin HTTP proxy to the backend
    healthz/route.ts       health endpoint
    login/                 sign-in route
  components/ui|layout/    reusable presentational components
  features/<feature>/      screen components (tasks, calculator, echo, stream, auth)
  hooks/                   stateful logic (useTasks, useSocket, useCalculator, …)
  services/                one module per backend area (auth, tasks, stream)
  lib/                     pure logic: validation, HTTP client, config, gateway helpers
  providers/               React context (config, session)
  types/index.ts           ALL interfaces, types and classes of the app
tests/                     Vitest unit tests
```

Why there is a `server.ts`: Next.js route handlers cannot accept WebSocket
upgrades, and the backend's echo socket requires an `Authorization` header in the
handshake, which browsers cannot send. `server.ts` runs Next.js normally and
forwards only `/ws/calculator` and `/ws/echo` to the backend. All HTTP traffic,
pages and configuration are handled by Next.js itself.

## Troubleshooting

- `Port 3000 is already in use` → stop the other process (Ctrl+C) or set `PORT` in `.env`.
- `DeprecationWarning: util._extend` on start is harmless; it comes from the `http-proxy` library.
- `http://localhost:3000/healthz` should return `"status":"ok"`.

## Assumptions about the service

- Echo WebSocket authenticates with `Authorization: Bearer` in the handshake; the
  calculator authenticates with a first `{"token": …}` frame.
- Tasks expire one hour after their last update; displayed expiry is an estimate.
- There is no logout or refresh endpoint; "Sign out" forgets the token locally.
- Mutations are never retried automatically, because a timed-out write may still
  have been applied by the server.
