import "server-only";

// Provider-Abstraktion für die echte KI (Phase 4).
//
// Zwei Modi (pro Workspace):
//   • aiMode = "byo"     → der Kunde bringt seine eigenen API-Keys mit
//                          (AES-256-GCM verschlüsselt gespeichert). Wir buchen
//                          KEINE Credits ab — er zahlt direkt beim Anbieter.
//   • aiMode = "credits" → wir rufen mit unseren Plattform-Keys aus der ENV auf
//                          (ANTHROPIC_API_KEY / OPENAI_API_KEY) und rechnen über
//                          Credits ab.
//
// Aufgabenteilung: Text = Anthropic (Claude), Bild = OpenAI (Anthropic bietet
// keine Bildgenerierung). Ist der jeweils nötige Key nicht vorhanden, ist die
// Funktion schlicht nicht "ready" — der Aufruf fällt dann auf einen klar als
// Demo gekennzeichneten Platzhalter zurück, ohne Credits zu verbrauchen.
//
// Sicherheit: Keys werden nur hier (serverseitig) entschlüsselt, nie geloggt,
// nie an den Client zurückgegeben. Provider-Rohfehler werden in freundliche
// Meldungen übersetzt, damit keine internen Details oder Key-Reste durchsickern.

import Anthropic from "@anthropic-ai/sdk";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { decrypt } from "../crypto";
import { PLATFORMS, type Platform } from "../types";

const TEXT_MODEL = "claude-opus-4-8";
const IMAGE_MODEL = "gpt-image-1";

/** Nur die Felder, die die Provider-Auflösung braucht. */
export interface AiWorkspace {
  aiMode: string;
  anthropicKeyEnc: string | null;
  openaiKeyEnc: string | null;
}

/** Für den Nutzer sichtbare Fehlermeldung (keine internen Details). */
export class AiError extends Error {}

function anthropicKey(ws: AiWorkspace): string | null {
  if (ws.aiMode === "byo") {
    return ws.anthropicKeyEnc ? decrypt(ws.anthropicKeyEnc) : null;
  }
  return process.env.ANTHROPIC_API_KEY || null;
}

function openaiKey(ws: AiWorkspace): string | null {
  if (ws.aiMode === "byo") {
    return ws.openaiKeyEnc ? decrypt(ws.openaiKeyEnc) : null;
  }
  return process.env.OPENAI_API_KEY || null;
}

/** Steht echte Text-KI für diesen Workspace bereit? (nur Präsenz prüfen) */
export function textReady(ws: AiWorkspace): boolean {
  if (ws.aiMode === "byo") return Boolean(ws.anthropicKeyEnc);
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Steht echte Bild-KI für diesen Workspace bereit? */
export function imageReady(ws: AiWorkspace): boolean {
  if (ws.aiMode === "byo") return Boolean(ws.openaiKeyEnc);
  return Boolean(process.env.OPENAI_API_KEY);
}

// ── Text (Claude) ─────────────────────────────────────────────────────

function platformHint(platform?: Platform): string {
  if (!platform) return "allgemein für Social Media";
  const label = PLATFORMS[platform]?.label ?? platform;
  const style: Partial<Record<Platform, string>> = {
    instagram: "locker, visuell, mit passenden Emojis und 2–3 Hashtags",
    facebook: "freundlich, etwas ausführlicher, gut für Community",
    tiktok: "jung, knackig, trendbewusst, Hook in der ersten Zeile",
    linkedin: "professionell, Mehrwert-orientiert, sparsame Emojis",
    youtube: "als Videobeschreibung, klarer Nutzen, Call-to-Action",
    x: "sehr kurz und pointiert (unter 280 Zeichen)",
    pinterest: "inspirierend, keyword-reich, Idee im Fokus",
  };
  return `für ${label} (${style[platform] ?? "passender Ton"})`;
}

const CAPTION_SYSTEM =
  "Du bist erfahrene:r Social-Media-Redakteur:in für ein deutschsprachiges " +
  "Unternehmen. Schreibe Captions auf Deutsch: konkret, authentisch, ohne " +
  "Marketing-Floskeln und ohne Klischees. Gib ausschließlich den fertigen " +
  "Text zurück — keine Einleitung, keine Anführungszeichen, keine Erklärung.";

function textFrom(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

function toAiError(e: unknown): AiError {
  // Provider-Statuscodes in freundliche Meldungen übersetzen — nie den
  // Rohfehler (kann Key-Reste/Header enthalten) nach außen geben.
  const status =
    e && typeof e === "object" && "status" in e
      ? Number((e as { status: unknown }).status)
      : undefined;
  if (status === 401 || status === 403) {
    return new AiError("API-Key ungültig oder ohne Berechtigung. Bitte im KI-Studio prüfen.");
  }
  if (status === 429) {
    return new AiError("Zu viele Anfragen / Kontingent beim Anbieter erschöpft. Später erneut versuchen.");
  }
  if (status === 400) {
    return new AiError("Anfrage vom Anbieter abgelehnt. Bitte Eingabe anpassen.");
  }
  return new AiError("KI-Dienst gerade nicht erreichbar. Bitte später erneut versuchen.");
}

/** Eine fertige Caption zu einem Thema erzeugen. Wirft AiError bei Problemen. */
export async function generateCaption(
  ws: AiWorkspace,
  opts: { topic: string; platform?: Platform }
): Promise<string> {
  const key = anthropicKey(ws);
  if (!key) throw new AiError("Kein Anthropic-API-Key hinterlegt.");
  const client = new Anthropic({ apiKey: key });

  const prompt =
    `Schreibe eine Caption ${platformHint(opts.platform)}.\n\n` +
    `Thema / Stichworte: ${opts.topic}\n\n` +
    `Länge: 1 bis 4 Sätze. Nur der Text.`;

  try {
    const msg = await client.messages.create({
      model: TEXT_MODEL,
      max_tokens: 500,
      system: CAPTION_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    const text = textFrom(msg);
    if (!text) throw new AiError("Leere Antwort vom KI-Dienst.");
    return text;
  } catch (e) {
    if (e instanceof AiError) throw e;
    throw toAiError(e);
  }
}

/** Mehrere Content-Ideen (Captions) zu einem Thema erzeugen. */
export async function generateIdeas(
  ws: AiWorkspace,
  opts: { topic: string; count?: number; platform?: Platform }
): Promise<string[]> {
  const key = anthropicKey(ws);
  if (!key) throw new AiError("Kein Anthropic-API-Key hinterlegt.");
  const client = new Anthropic({ apiKey: key });
  const count = Math.min(Math.max(opts.count ?? 5, 1), 10);

  const prompt =
    `Entwickle ${count} unterschiedliche Post-Ideen ${platformHint(opts.platform)}.\n\n` +
    `Thema / Kontext: ${opts.topic}\n\n` +
    `Gib genau ${count} Ideen aus, je eine pro Zeile, ohne Nummerierung, ` +
    `ohne Aufzählungszeichen. Jede Zeile ist eine fertige, kurze Caption.`;

  try {
    const msg = await client.messages.create({
      model: TEXT_MODEL,
      max_tokens: 1200,
      system: CAPTION_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    const ideas = textFrom(msg)
      .split("\n")
      .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
      .filter(Boolean)
      .slice(0, count);
    if (ideas.length === 0) throw new AiError("Leere Antwort vom KI-Dienst.");
    return ideas;
  } catch (e) {
    if (e instanceof AiError) throw e;
    throw toAiError(e);
  }
}

const LEARNINGS_SYSTEM =
  "Du bist erfahrene:r Social-Media-Analyst:in für ein deutschsprachiges " +
  "Unternehmen. Du bekommst eine Kennzahlen-Zusammenfassung und leitest " +
  "daraus knappe, konkrete Erkenntnisse ab — kein Marketing-Sprech, keine " +
  "Wiederholung der reinen Zahlen, sondern was daraus für die nächsten " +
  "Beiträge folgt (z. B. welcher Content-Typ, welche Uhrzeit, welcher Kanal). " +
  "Gib 3 bis 5 kurze Sätze zurück, je einer pro Zeile, ohne Nummerierung, " +
  "ohne Aufzählungszeichen, ohne Einleitung.";

/** Klartext-Erkenntnisse aus einer Analytics-Zusammenfassung ableiten. */
export async function generateLearnings(ws: AiWorkspace, summary: string): Promise<string[]> {
  const key = anthropicKey(ws);
  if (!key) throw new AiError("Kein Anthropic-API-Key hinterlegt.");
  const client = new Anthropic({ apiKey: key });

  try {
    const msg = await client.messages.create({
      model: TEXT_MODEL,
      max_tokens: 600,
      system: LEARNINGS_SYSTEM,
      messages: [{ role: "user", content: summary }],
    });
    const learnings = textFrom(msg)
      .split("\n")
      .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 5);
    if (learnings.length === 0) throw new AiError("Leere Antwort vom KI-Dienst.");
    return learnings;
  } catch (e) {
    if (e instanceof AiError) throw e;
    throw toAiError(e);
  }
}

// ── Bild (OpenAI) ─────────────────────────────────────────────────────

interface OpenAiImageResponse {
  data?: { b64_json?: string }[];
  error?: { message?: string };
}

/**
 * Erzeugt ein Bild über OpenAI, speichert es lokal in public/uploads und gibt
 * die öffentliche URL zurück. Wirft AiError bei Problemen.
 */
export async function generateImageFile(
  ws: AiWorkspace,
  prompt: string
): Promise<{ url: string; bytes: number }> {
  const key = openaiKey(ws);
  if (!key) throw new AiError("Kein OpenAI-API-Key hinterlegt.");

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt,
        n: 1,
        size: "1024x1024",
      }),
    });
  } catch {
    throw new AiError("Bild-Dienst gerade nicht erreichbar. Bitte später erneut versuchen.");
  }

  if (!res.ok) {
    throw toAiError({ status: res.status });
  }

  const json = (await res.json().catch(() => null)) as OpenAiImageResponse | null;
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new AiError("Der Bild-Dienst hat kein Bild geliefert.");

  const buffer = Buffer.from(b64, "base64");
  const name = `${randomBytes(12).toString("hex")}.png`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);

  return { url: `/uploads/${name}`, bytes: buffer.byteLength };
}
