import { redirect } from "next/navigation";
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

  const { workspace } = await requireWorkspace();
  const bundle = await getWorkspaceBundle(workspace.id, {
    name: user.name,
    email: user.email,
  });

  return <AppShell initial={bundle}>{children}</AppShell>;
}
