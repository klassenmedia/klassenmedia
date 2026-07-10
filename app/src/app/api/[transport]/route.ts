import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashApiToken } from "@/lib/crypto";
import { FORMAT_MAX_MEDIA, mcpCreatePostSchema } from "@/lib/schemas";

// Remote-MCP-Server (Phase 8): Claude bekommt hierüber Werkzeuge, um Kunden
// und Accounts eines Workspace zu sehen und Entwürfe/geplante Beiträge
// anzulegen — authentifiziert über ein API-Token aus "Integrationen" in der
// App (nie über die normale Login-Session). Läuft lokal, ist aber erst von
// außen erreichbar, sobald die App live deployed ist (siehe DEPLOY.md).

interface WorkspaceAuth {
  workspaceId: string;
  workspaceName: string;
  [key: string]: unknown;
}

async function verifyToken(
  _req: Request,
  bearerToken?: string
): Promise<{ token: string; clientId: string; scopes: string[]; extra: WorkspaceAuth } | undefined> {
  if (!bearerToken) return undefined;
  const tokenHash = hashApiToken(bearerToken);
  const token = await db.apiToken.findFirst({
    where: { tokenHash, revokedAt: null },
    include: { workspace: true },
  });
  if (!token) return undefined;

  // Best-effort — nicht blockierend, falls das fehlschlägt
  db.apiToken.update({ where: { id: token.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return {
    token: bearerToken,
    clientId: token.workspaceId,
    scopes: [],
    extra: { workspaceId: token.workspaceId, workspaceName: token.workspace.name },
  };
}

function authOf(extra: { authInfo?: { extra?: Record<string, unknown> } }): WorkspaceAuth {
  const a = extra.authInfo?.extra as WorkspaceAuth | undefined;
  if (!a?.workspaceId) throw new Error("Nicht authentifiziert");
  return a;
}

function text(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

function errorText(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

const baseHandler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_clients",
      {
        title: "Kunden auflisten",
        description:
          "Listet alle Kunden (Mandanten) des Planbar-Workspace mit Namen und Account-/Post-Anzahl.",
        inputSchema: {},
      },
      async (_args, extra) => {
        const { workspaceId } = authOf(extra);
        const clients = await db.client.findMany({
          where: { workspaceId },
          include: { _count: { select: { accounts: true, posts: true } } },
          orderBy: { name: "asc" },
        });
        return text(
          clients.map((c) => ({
            id: c.id,
            name: c.name,
            accounts: c._count.accounts,
            posts: c._count.posts,
          }))
        );
      }
    );

    server.registerTool(
      "list_accounts",
      {
        title: "Accounts auflisten",
        description:
          "Listet verbundene Social-/Website-Accounts, optional gefiltert nach Kunde (clientId aus list_clients).",
        inputSchema: { clientId: z.string().optional() },
      },
      async ({ clientId }, extra) => {
        const { workspaceId } = authOf(extra);
        const accounts = await db.socialAccount.findMany({
          where: { workspaceId, ...(clientId ? { clientId } : {}) },
          orderBy: { connectedAt: "asc" },
        });
        return text(
          accounts.map((a) => ({
            id: a.id,
            platform: a.platform,
            displayName: a.displayName,
            handle: a.handle,
            clientId: a.clientId,
          }))
        );
      }
    );

    server.registerTool(
      "list_upcoming_posts",
      {
        title: "Geplante Beiträge auflisten",
        description:
          "Listet Entwürfe und geplante Beiträge der nächsten Tage — hilfreich, um Doppelungen zu vermeiden, bevor ein neuer Beitrag angelegt wird.",
        inputSchema: { days: z.number().int().min(1).max(90).optional() },
      },
      async ({ days }, extra) => {
        const { workspaceId } = authOf(extra);
        const until = new Date();
        until.setDate(until.getDate() + (days ?? 14));
        const posts = await db.post.findMany({
          where: {
            workspaceId,
            status: { in: ["draft", "scheduled"] },
            scheduledAt: { lte: until },
          },
          include: { accounts: { include: { account: true } } },
          orderBy: { scheduledAt: "asc" },
          take: 50,
        });
        return text(
          posts.map((p) => ({
            id: p.id,
            title: p.title,
            body: p.body,
            format: p.format,
            status: p.status,
            scheduledAt: p.scheduledAt.toISOString(),
            accounts: p.accounts.map((a) => a.account.handle),
          }))
        );
      }
    );

    server.registerTool(
      "create_post",
      {
        title: "Beitrag anlegen",
        description:
          "Legt einen neuen Entwurf oder geplanten Beitrag an. accountIds kommen aus list_accounts " +
          "und müssen zum selben Format passen (z. B. nur WordPress-Accounts für format \"article\").",
        inputSchema: mcpCreatePostSchema.shape,
      },
      async (args, extra) => {
        const { workspaceId } = authOf(extra);
        const parsed = mcpCreatePostSchema.safeParse(args);
        if (!parsed.success) return errorText(parsed.error.issues[0].message);
        const data = parsed.data;

        const owned = await db.socialAccount.count({
          where: { id: { in: data.accountIds }, workspaceId },
        });
        if (owned !== data.accountIds.length) {
          return errorText("Ungültige Account-Auswahl — IDs gehören nicht zu diesem Workspace.");
        }
        if (data.clientId) {
          const client = await db.client.findFirst({ where: { id: data.clientId, workspaceId } });
          if (!client) return errorText("Kunde nicht gefunden.");
        }

        const scheduledAt = new Date(`${data.date}T${data.time}:00`);
        if (isNaN(scheduledAt.getTime())) return errorText("Ungültiges Datum/Uhrzeit.");

        const created = await db.post.create({
          data: {
            workspaceId,
            clientId: data.clientId ?? null,
            title: data.format === "article" ? data.title?.trim() : null,
            body: data.body,
            format: data.format,
            scheduledAt,
            status: data.status,
            accounts: { create: data.accountIds.map((accountId) => ({ accountId })) },
          },
        });

        return text({
          ok: true,
          postId: created.id,
          status: created.status,
          note: `Beitrag angelegt (max. ${FORMAT_MAX_MEDIA[data.format]} Medien für dieses Format — Medien-Upload läuft über die App, nicht über MCP).`,
        });
      }
    );
  },
  {},
  { basePath: "/api", verboseLogs: false }
);

const handler = withMcpAuth(baseHandler, verifyToken, { required: true });

export { handler as GET, handler as POST, handler as DELETE };
