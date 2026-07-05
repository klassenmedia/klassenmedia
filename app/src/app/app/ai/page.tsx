"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, inputCls } from "@/components/ui";
import { mediaBackground } from "@/lib/types";

const CREDIT_PACKAGES = [
  { credits: 500, price: 9, id: "S" },
  { credits: 2000, price: 29, id: "M", popular: true },
  { credits: 10000, price: 119, id: "L" },
];

interface GeneratedImage {
  id: number;
  prompt: string;
  url: string;
  demo: boolean;
}

export default function AiPage() {
  const {
    aiMode,
    setAiMode,
    ai,
    credits,
    creditLog,
    buyCredits,
    saveByoKeys,
    hasByoKeys,
    generateImage,
    generateIdeas,
  } = useStore();
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [keySaving, setKeySaving] = useState(false);

  const [imgPrompt, setImgPrompt] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [imgHint, setImgHint] = useState<string | null>(null);
  const [imgBusy, setImgBusy] = useState(false);

  const [ideaTopic, setIdeaTopic] = useState("");
  const [ideas, setIdeas] = useState<string[]>([]);
  const [ideaHint, setIdeaHint] = useState<string | null>(null);
  const [ideaBusy, setIdeaBusy] = useState(false);
  const [copiedIdea, setCopiedIdea] = useState<number | null>(null);

  async function runImage() {
    const prompt = imgPrompt.trim();
    if (!prompt) return;
    setImgBusy(true);
    setImgHint(null);
    const res = await generateImage(prompt);
    setImgBusy(false);
    if (!res) return; // Fehlermeldung im globalen Toast
    setImages((prev) => [
      { id: prev.length + 1, prompt, url: res.url, demo: res.source === "demo" },
      ...prev,
    ]);
    setImgHint(
      res.source === "demo"
        ? "Demo-Platzhalter · echte Bild-KI aktiv, sobald ein OpenAI-Key hinterlegt ist (keine Credits verbraucht)."
        : aiMode === "byo"
          ? "Mit deinem eigenen OpenAI-Key erzeugt · keine Credits verbraucht."
          : "6 Credits verbraucht · Bild in der Medienbibliothek gespeichert."
    );
    setImgPrompt("");
  }

  async function runIdeas() {
    const topic = ideaTopic.trim();
    if (!topic) return;
    setIdeaBusy(true);
    setIdeaHint(null);
    const res = await generateIdeas(topic);
    setIdeaBusy(false);
    if (!res) return;
    setIdeas(res.ideas);
    setIdeaHint(
      res.source === "demo"
        ? "Demo-Ideen · echte KI aktiv, sobald ein Anthropic-Key hinterlegt ist."
        : aiMode === "byo"
          ? "Mit deinem eigenen API-Key erzeugt · keine Credits verbraucht."
          : "1 Credit verbraucht · mit Claude erzeugt."
    );
  }

  function copyIdea(i: number, text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedIdea(i);
    setTimeout(() => setCopiedIdea(null), 2000);
  }

  async function submitKeys() {
    setKeySaving(true);
    const ok = await saveByoKeys({
      anthropicKey: anthropicKey.trim() || undefined,
      openaiKey: openaiKey.trim() || undefined,
    });
    setKeySaving(false);
    if (ok) {
      setAnthropicKey("");
      setOpenaiKey("");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">KI-Studio</h1>
        <p className="mt-1 text-sm text-muted">
          Texte, Ideen und Bilder generieren — mit Credits von uns oder deinem eigenen API-Key.
        </p>
      </div>

      {/* Bereitschafts-Hinweis */}
      <div
        className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
          ai.textReady || ai.imageReady
            ? "border-success/40 bg-success/10"
            : "border-line bg-surface-2"
        }`}
      >
        {ai.textReady || ai.imageReady ? (
          <span>
            <span className="font-medium text-success">Echte KI aktiv.</span>{" "}
            Text {ai.textReady ? "✓ Claude" : "– kein Schlüssel"} · Bild{" "}
            {ai.imageReady ? "✓ OpenAI" : "– kein Schlüssel"}
            {aiMode === "byo" ? " (dein Key)" : " (Plattform-Kontingent)"}.
          </span>
        ) : (
          <span>
            <span className="font-medium">Demo-Modus.</span> Noch kein API-Key aktiv — Vorschläge
            sind Platzhalter und kosten keine Credits. Hinterlege einen eigenen Key (BYO) oder
            im Betrieb setzen wir die Plattform-Keys serverseitig.
          </span>
        )}
      </div>

      {/* Modus-Wahl */}
      <div className="grid gap-4 md:grid-cols-2">
        <button
          onClick={() => setAiMode("credits")}
          className={`rounded-2xl border p-6 text-left transition ${
            aiMode === "credits"
              ? "border-accent bg-accent-soft"
              : "border-line bg-surface hover:border-accent/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Credits von Planbar</h3>
            {aiMode === "credits" && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-contrast">
                Aktiv
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">
            Kein eigener API-Key nötig. Dein Tarif enthält ein monatliches Kontingent,
            zusätzliche Pakete kannst du jederzeit dazukaufen.
          </p>
          <div className="mt-4 text-2xl font-semibold">
            {credits.toLocaleString("de-DE")}{" "}
            <span className="text-sm font-normal text-muted">Credits übrig</span>
          </div>
        </button>

        <button
          onClick={() => setAiMode("byo")}
          className={`rounded-2xl border p-6 text-left transition ${
            aiMode === "byo"
              ? "border-accent bg-accent-soft"
              : "border-line bg-surface hover:border-accent/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Eigener API-Key (BYO)</h3>
            {aiMode === "byo" && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-contrast">
                Aktiv
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">
            Du zahlst die KI-Nutzung direkt beim Anbieter (Anthropic, OpenAI, …) —
            bei uns fallen dafür keine Credits an. Volle Kostenkontrolle.
          </p>
          <div className={`mt-4 text-sm font-medium ${hasByoKeys ? "text-success" : "text-muted"}`}>
            {hasByoKeys ? "✓ Key hinterlegt" : "Noch kein Key hinterlegt"}
          </div>
        </button>
      </div>

      {/* BYO-Keys */}
      {aiMode === "byo" && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <h3 className="font-semibold">API-Keys</h3>
          <p className="mt-1 text-sm text-muted">
            Keys werden verschlüsselt gespeichert (AES-256) und nie im Klartext angezeigt.
            Text läuft über Anthropic (Claude), Bilder über OpenAI.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Anthropic API-Key <span className="text-muted">· für Texte</span>
              </label>
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-…"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                OpenAI API-Key <span className="text-muted">· für Bilder</span>
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-…"
                className={inputCls}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={submitKeys}
              disabled={keySaving || (!anthropicKey.trim() && !openaiKey.trim())}
            >
              {keySaving ? "Speichert …" : "Keys speichern"}
            </Button>
            {hasByoKeys && (
              <span className="text-sm text-success">✓ Verschlüsselt gespeichert (AES-256)</span>
            )}
          </div>
        </div>
      )}

      {/* Credit-Pakete */}
      {aiMode === "credits" && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
            Credit-Pakete
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-2xl border bg-surface p-5 ${
                  pkg.popular ? "border-accent" : "border-line"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-accent-contrast">
                    Beliebt
                  </span>
                )}
                <div className="text-2xl font-semibold">
                  {pkg.credits.toLocaleString("de-DE")}
                  <span className="ml-1 text-sm font-normal text-muted">Credits</span>
                </div>
                <div className="mt-1 text-sm text-muted">
                  {pkg.price} € · {((pkg.price / pkg.credits) * 100).toFixed(1).replace(".", ",")} ct/Credit
                </div>
                <Button
                  className="mt-4 w-full"
                  variant={pkg.popular ? "primary" : "ghost"}
                  onClick={() => buyCredits(pkg.id as "S" | "M" | "L")}
                >
                  Kaufen (Demo)
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Im fertigen Produkt läuft der Kauf über Stripe Checkout. Richtwerte: 1 Credit ≈ 1
            Textaktion, Bild ≈ 6 Credits.
          </p>
        </div>
      )}

      {/* Content-Ideen */}
      <div className="mt-10 rounded-2xl border border-line bg-surface p-6">
        <h3 className="font-semibold">💡 Content-Ideen</h3>
        <p className="mt-1 text-sm text-muted">
          Gib ein Thema ein — die KI liefert fünf fertige Caption-Ideen zum Übernehmen.
        </p>
        <div className="mt-4 flex gap-3">
          <input
            value={ideaTopic}
            onChange={(e) => setIdeaTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !ideaBusy && runIdeas()}
            placeholder='z. B. "Vorteile von Content-Planung für kleine Betriebe"'
            className={inputCls}
          />
          <Button onClick={runIdeas} disabled={!ideaTopic.trim() || ideaBusy} className="shrink-0">
            {ideaBusy ? "Denkt …" : `Ideen ${aiMode === "credits" ? "(1 Credit)" : ""}`}
          </Button>
        </div>
        {ideaHint && <p className="mt-2 text-xs text-muted">{ideaHint}</p>}
        {ideas.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {ideas.map((idea, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm"
              >
                <span className="flex-1 leading-relaxed">{idea}</span>
                <button
                  onClick={() => copyIdea(i, idea)}
                  className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-accent-fg transition hover:bg-accent-soft"
                >
                  {copiedIdea === i ? "✓ Kopiert" : "Kopieren"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bild-Generierung */}
      <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <h3 className="font-semibold">🎨 Bild generieren</h3>
        <p className="mt-1 text-sm text-muted">
          Beschreibe das gewünschte Bild — es landet danach in deiner Medienbibliothek.
        </p>
        <div className="mt-4 flex gap-3">
          <input
            value={imgPrompt}
            onChange={(e) => setImgPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !imgBusy && runImage()}
            placeholder='z. B. "Modernes Büro mit Pflanzen, warmes Licht, minimalistisch"'
            className={inputCls}
          />
          <Button onClick={runImage} disabled={!imgPrompt.trim() || imgBusy} className="shrink-0">
            {imgBusy ? "Malt …" : `Generieren ${aiMode === "credits" ? "(6 Credits)" : ""}`}
          </Button>
        </div>
        {imgHint && <p className="mt-2 text-xs text-muted">{imgHint}</p>}
        {images.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="overflow-hidden rounded-xl border border-line">
                <div className="aspect-square" style={{ background: mediaBackground(img.url) }} />
                <div
                  className="truncate bg-surface-2 px-2.5 py-1.5 text-[11px] text-muted"
                  title={img.prompt}
                >
                  {img.demo ? "Demo · " : ""}
                  {img.prompt}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verbrauchsprotokoll */}
      <div className="mt-10">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Credit-Verlauf
        </h3>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {creditLog.map((entry, i) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <span>{entry.label}</span>
              <span className="flex items-center gap-4">
                <span className="text-xs text-muted">{entry.when}</span>
                <span
                  className={`w-16 text-right font-mono font-medium ${
                    entry.amount > 0 ? "text-success" : "text-muted"
                  }`}
                >
                  {entry.amount > 0 ? "+" : ""}
                  {entry.amount}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
