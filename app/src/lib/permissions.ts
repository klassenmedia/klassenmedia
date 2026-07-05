// Rollen & Berechtigungen — bewusst OHNE "server-only", damit die UI dieselbe
// Wahrheit nutzen kann (Buttons ausblenden). Die eigentliche Sicherheit liegt
// aber IMMER in den Server Actions: jede Mutation prüft can(role, cap) erneut
// serverseitig — die UI-Prüfung ist nur Komfort, kein Schutz.

export type Role = "owner" | "admin" | "editor" | "viewer";

export type Capability =
  | "content" // Posts/Medien anlegen, bearbeiten, löschen; Inbox beantworten
  | "approve" // Freigeben / Änderungen erbeten / Kunden-Freigabelinks
  | "accounts" // Social Accounts & Verbindungslinks verwalten
  | "ai_settings" // KI-Modus & BYO-Keys ändern
  | "billing" // Tarif wechseln, Credits kaufen, Zahlungsportal
  | "team"; // Mitglieder einladen, Rollen ändern, entfernen

const MATRIX: Record<Capability, Role[]> = {
  content: ["owner", "admin", "editor"],
  approve: ["owner", "admin"],
  accounts: ["owner", "admin"],
  ai_settings: ["owner", "admin"],
  billing: ["owner"],
  team: ["owner", "admin"],
};

export function can(role: Role, cap: Capability): boolean {
  return MATRIX[cap].includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Inhaber:in",
  admin: "Admin",
  editor: "Redakteur:in",
  viewer: "Betrachter:in",
};

export const ROLE_HINTS: Record<Role, string> = {
  owner: "Voller Zugriff inkl. Abrechnung und Team.",
  admin: "Alles außer Abrechnung: Inhalte, Freigaben, Accounts, KI, Team.",
  editor: "Inhalte planen & Inbox beantworten, reicht Beiträge zur Freigabe ein.",
  viewer: "Nur Ansicht — kann nichts ändern.",
};

/** Rollen, die beim Einladen/Ändern vergeben werden dürfen (owner bleibt fix). */
export const ASSIGNABLE_ROLES: Role[] = ["admin", "editor", "viewer"];

export const ROLE_RANK: Record<Role, number> = {
  owner: 3,
  admin: 2,
  editor: 1,
  viewer: 0,
};
