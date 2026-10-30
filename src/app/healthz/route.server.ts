/** Liveness endpoint: confirms which release and backend this console uses. */
import { readSettings } from "@/lib/config/settings";

export const dynamic = "force-dynamic";

export function GET() {
  const { client } = readSettings();
  return Response.json(
    { status: "ok", release: client.release, api_origin: client.httpOrigin },
    { headers: { "Cache-Control": "no-store" } },
  );
}
