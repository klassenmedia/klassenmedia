"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { acceptTeamInvite, createSession, destroySession } from "./auth";

/** Optionales Invite-Token aus dem Formular säubern (hex, 32 Zeichen). */
function inviteToken(formData: FormData): string | null {
  const raw = formData.get("invite");
  if (typeof raw !== "string") return null;
  return /^[a-f0-9]{32}$/.test(raw) ? raw : null;
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name: mindestens 2 Zeichen").max(80),
  email: z.string().trim().toLowerCase().email("Bitte eine gültige E-Mail eingeben"),
  password: z.string().min(8, "Passwort: mindestens 8 Zeichen").max(200),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Bitte eine gültige E-Mail eingeben"),
  password: z.string().min(1, "Bitte Passwort eingeben"),
});

export type AuthFormState = { error?: string };

/** Registrierung: Nutzer + eigener Workspace + Startguthaben + Beispieldaten */
export async function register(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Für diese E-Mail existiert bereits ein Konto — bitte einloggen." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      memberships: {
        create: {
          role: "owner",
          workspace: {
            create: {
              name: `${name}s Workspace`,
              plan: "starter",
              creditBalance: 100,
              creditTransactions: {
                create: {
                  type: "plan_grant",
                  amount: 100,
                  description: "Willkommens-Kontingent (Starter)",
                },
              },
            },
          },
        },
      },
    },
  });

  await createSession(user.id);
  const token = inviteToken(formData);
  if (token) await acceptTeamInvite(user.id, token);
  redirect("/app");
}

export async function login(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // bewusst dieselbe Fehlermeldung für "unbekannte E-Mail" und "falsches
  // Passwort" — sonst lassen sich registrierte E-Mails erraten
  const invalid = { error: "E-Mail oder Passwort ist falsch." };
  if (!user) {
    // Timing angleichen: auch ohne Nutzer einen Hash-Vergleich durchführen
    await bcrypt.compare(parsed.data.password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvali");
    return invalid;
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return invalid;

  await createSession(user.id);
  const token = inviteToken(formData);
  if (token) await acceptTeamInvite(user.id, token);
  redirect("/app");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
