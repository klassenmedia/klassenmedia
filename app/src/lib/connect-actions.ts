"use server";

// Öffentliche Kunden-Freigabe über den Verbindungslink. Der Einmal-Token in
// der URL ist hier die Berechtigung — es ist bewusst KEIN Login nötig, denn
// der Kunde hat gar kein Konto bei uns. In Phase 2b leitet dieser Schritt in
// den OAuth-Flow der Plattform weiter; lokal wird die Freigabe simuliert.

import { z } from "zod";
import { db } from "./db";

export interface ConnectResult {
  ok: boolean;
  error?: string;
}

export async function acceptInviteByTokenAction(token: unknown): Promise<ConnectResult> {
  const parsed = z.string().min(8).max(64).safeParse(token);
  if (!parsed.success) return { ok: false, error: "Ungültiger Link" };

  const invite = await db.connectionInvite.findUnique({
    where: { token: parsed.data },
  });
  if (!invite || invite.status !== "pending") {
    return { ok: false, error: "Dieser Link ist nicht mehr gültig." };
  }
  if (invite.expiresAt < new Date()) {
    await db.connectionInvite.update({
      where: { id: invite.id },
      data: { status: "expired" },
    });
    return { ok: false, error: "Dieser Link ist abgelaufen — bitte einen neuen anfordern." };
  }

  await db.$transaction([
    db.socialAccount.create({
      data: {
        workspaceId: invite.workspaceId,
        platform: invite.platform,
        displayName: invite.clientName,
        handle: "@" + invite.clientName.toLowerCase().replace(/[^a-zä-ü0-9]+/gi, ""),
      },
    }),
    db.connectionInvite.update({
      where: { id: invite.id },
      data: { status: "accepted", acceptedAt: new Date() },
    }),
  ]);

  return { ok: true };
}
