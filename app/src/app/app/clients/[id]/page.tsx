import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/auth";
import { getClientDetail } from "@/lib/crm-data";
import { can } from "@/lib/permissions";
import { ClientDetailView } from "./client-detail";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { workspace, role } = await requireWorkspace();
  const detail = await getClientDetail(workspace.id, id);
  if (!detail) notFound();
  return <ClientDetailView initial={detail} canEdit={can(role, "accounts")} />;
}
