"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, inputCls } from "@/components/ui";

const CREDIT_PACKAGES = [
  { credits: 500, price: 9, id: "S" },
  { credits: 2000, price: 29, id: "M", popular: true },
  { credits: 10000, price: 119, id: "L" },
];

interface GeneratedImage {
  id: number;
  prompt: string;
  hue: number;
}

export default function AiPage() {
  const { aiMode, setAiMode, credits, creditLog, buyCredits, spendCredits } = useStore();
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [imgPrompt, setImgPrompt] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [imgHint, setImgHint] = useState<string | null>(null);

  function generateImage() {
    if (!imgPrompt.trim()) return;
    if (aiMode === "credits") {
      const ok = spendCredits(6, "Bild generiert (1024×1024)");
      if (!ok) {
        setImgHint("Nicht genug Credits — bitte Paket kaufen oder auf eigenen API-Key umstellen.");
        return;
      }
      setImgHint("6 Credits verbraucht (Demo-Platzhalter statt echtem Bild)");
    } else {
      setImgHint("Über deinen eigenen API-Key generiert (Demo-Platzhalter) · keine Credits verbraucht");
    }
    setImages((prev) => [
      {
        id: prev.length + 1,
        prompt: imgPrompt.trim(),
        hue: (prev.length * 67 + imgPrompt.length * 31) % 360,
      },
      ...prev,
    ]);
    setImgPrompt("");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">KI-Studio</h1>
        <p className="mt-1 text-sm text-muted">
          Texte, Ideen und Bilder generieren — mit Credits von uns oder deinem eigenen API-Key.
        </p>
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
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">
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
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">
                Aktiv
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">
            Du zahlst die KI-Nutzung direkt beim Anbieter (Anthropic, OpenAI, …) —
            bei uns fallen dafür keine Credits an. Volle Kostenkontrolle.
          </p>
          <div className="mt-4 text-sm font-medium text-success">
            {keySaved ? "✓ Key hinterlegt" : "Noch kein Key hinterlegt"}
          </div>
        </button>
      </div>

      {/* BYO-Keys */}
      {aiMode === "byo" && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <h3 className="font-semibold">API-Keys</h3>
          <p className="mt-1 text-sm text-muted">
            Keys werden verschlüsselt gespeichert (AES-256) und nie im Klartext angezeigt.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Anthropic API-Key</label>
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-…"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">OpenAI API-Key</label>
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
              onClick={() => setKeySaved(true)}
              disabled={!anthropicKey.trim() && !openaiKey.trim()}
            >
              Keys speichern
            </Button>
            {keySaved && <span className="text-sm text-success">Gespeichert (Demo)</span>}
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
                  <span className="absolute -top-2.5 left-4 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-white">
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
                  onClick={() =>
                    buyCredits(pkg.credits, `Credit-Paket ${pkg.id} gekauft`)
                  }
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

      {/* Bild-Generierung */}
      <div className="mt-10 rounded-2xl border border-line bg-surface p-6">
        <h3 className="font-semibold">🎨 Bild generieren</h3>
        <p className="mt-1 text-sm text-muted">
          Beschreibe das gewünschte Bild — es landet danach in deiner Medienbibliothek.
        </p>
        <div className="mt-4 flex gap-3">
          <input
            value={imgPrompt}
            onChange={(e) => setImgPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateImage()}
            placeholder='z. B. "Modernes Büro mit Pflanzen, warmes Licht, minimalistisch"'
            className={inputCls}
          />
          <Button onClick={generateImage} disabled={!imgPrompt.trim()} className="shrink-0">
            Generieren {aiMode === "credits" ? "(6 Credits)" : ""}
          </Button>
        </div>
        {imgHint && <p className="mt-2 text-xs text-muted">{imgHint}</p>}
        {images.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="overflow-hidden rounded-xl border border-line">
                <div
                  className="aspect-square"
                  style={{
                    background: `linear-gradient(135deg, hsl(${img.hue} 60% 45%), hsl(${(img.hue + 60) % 360} 60% 30%))`,
                  }}
                />
                <div className="truncate bg-surface-2 px-2.5 py-1.5 text-[11px] text-muted" title={img.prompt}>
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
