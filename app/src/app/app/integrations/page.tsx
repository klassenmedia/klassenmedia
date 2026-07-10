import { headers } from "next/headers";
import { IntegrationsClient } from "./integrations-client";

// Server-Component: der MCP-Endpunkt wird aus dem echten Host der Anfrage
// gebildet (nicht per window.location im Client) — funktioniert dadurch
// sowohl lokal als auch hinter einem Reverse Proxy nach dem Deploy korrekt.
export default async function IntegrationsPage() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;
  return <IntegrationsClient mcpUrl={`${origin}/api/mcp`} isLocal={host.includes("localhost")} />;
}
