import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionUser, requireWorkspace } from "@/lib/auth";
import { getWorkspaceBundle } from "@/lib/data";
import { AppShell } from "@/components/app-shell";

// Server-Layout: schützt alle /app-Routen und lädt das Workspace-Bundle
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { workspace, role } = await requireWorkspace();
  const bundle = await getWorkspaceBundle(
    workspace.id,
    { id: user.id, name: user.name, email: user.email },
    role
  );

  // Aktiver Kunden-Kontext aus dem Cookie — nur gültig, wenn er zum Workspace gehört
  const cookieClient = (await cookies()).get("planbar_client")?.value || null;
  const initialClientId = bundle.clients.some((c) => c.id === cookieClient)
    ? cookieClient
    : null;

  return (
    <AppShell initial={bundle} initialClientId={initialClientId}>
      {children}
    </AppShell>
  );
}
