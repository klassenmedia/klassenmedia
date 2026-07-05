"use server";

import { redirect } from "next/navigation";
import { acceptTeamInvite, getSessionUser } from "@/lib/auth";

/** Einladung annehmen — eingeloggt beitreten, sonst zum Login mit Token. */
export async function acceptInviteAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  if (!/^[a-f0-9]{32}$/.test(token)) redirect("/login");

  const user = await getSessionUser();
  if (!user) redirect(`/login?invite=${token}`);

  await acceptTeamInvite(user.id, token);
  redirect("/app");
}
