import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
  {
    icon: "∞",
    title: "Unbegrenzte Accounts",
    text: "Verbinde so viele Profile, wie du willst — Instagram, TikTok, LinkedIn, Facebook, YouTube, X und Pinterest. Kein Tarif limitiert deine Accounts.",
  },
  {
    icon: "📅",
    title: "Planen ohne Horizont",
    text: "Plane Wochen, Monate oder ein ganzes Jahr im Voraus. Serien, Kampagnen und wiederkehrende Slots inklusive.",
  },
  {
    icon: "✨",
    title: "KI, wie du sie willst",
    text: "Captions, Content-Ideen und Bilder per KI. Nutze dein Credit-Kontingent — oder binde deinen eigenen API-Key ein und zahle nur, was du beim Anbieter verbrauchst.",
  },
  {
    icon: "🗂",
    title: "Workspaces für Agenturen",
    text: "Ein Workspace pro Kunde, sauber getrennt. Teammitglieder, Rollen und Freigaben — gemacht für Agentur-Workflows.",
  },
  {
    icon: "🖼",
    title: "Bilder direkt generieren",
    text: "Kein Stock-Foto-Frust: Beschreibe dein Wunschbild und plane es direkt in den Post ein.",
  },
  {
    icon: "🔔",
    title: "Zuverlässiges Publishing",
    text: "Automatische Veröffentlichung mit Wiederholversuchen und Benachrichtigung, falls eine Plattform zickt.",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "19 €",
    tagline: "Für Solo-Creator und Einzelunternehmen",
    features: [
      "Unbegrenzte Social Accounts",
      "1 Workspace · 1 Nutzer",
      "100 KI-Credits / Monat",
      "Eigener API-Key möglich",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "49 €",
    tagline: "Für Teams und wachsende Marken",
    features: [
      "Unbegrenzte Social Accounts",
      "3 Workspaces · 5 Teammitglieder",
      "500 KI-Credits / Monat",
      "Freigabe-Workflow & Kampagnen",
    ],
    highlight: true,
  },
  {
    name: "Agency",
    price: "129 €",
    tagline: "Für Agenturen mit vielen Kunden",
    features: [
      "Unbegrenzte Social Accounts",
      "Unbegrenzte Workspaces & Team",
      "2.000 KI-Credits / Monat",
      "White-Label & Kunden-Freigaben",
    ],
    highlight: false,
  },
];

const FAQ = [
  {
    q: "Wirklich unbegrenzt viele Accounts?",
    a: "Ja. Bei uns kostet kein zusätzliches Profil extra — in keinem Tarif. Wir differenzieren über Workspaces, Teamgrößen und KI-Kontingente, nicht über deine Reichweite.",
  },
  {
    q: "Wie funktioniert die KI-Unterstützung?",
    a: "Du hast zwei Optionen: Entweder du nutzt dein monatliches Credit-Kontingent (und kaufst bei Bedarf Pakete nach), oder du hinterlegst deinen eigenen API-Key von Anthropic oder OpenAI und zahlst die Nutzung direkt beim Anbieter — ganz ohne Aufschlag von uns.",
  },
  {
    q: "Kann ich jederzeit kündigen?",
    a: "Ja, monatlich kündbar, direkt im Kundenportal. Bei jährlicher Zahlung schenken wir dir 2 Monate.",
  },
  {
    q: "Welche Plattformen werden unterstützt?",
    a: "Instagram, Facebook, TikTok, LinkedIn, YouTube, X (Twitter) und Pinterest — weitere folgen laufend.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-contrast">
              P
            </span>
            <span className="text-lg font-semibold tracking-tight">Planbar</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#features" className="transition hover:text-foreground">Funktionen</a>
            <a href="#pricing" className="transition hover:text-foreground">Preise</a>
            <a href="#faq" className="transition hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/app"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition hover:brightness-110"
            >
              Demo öffnen
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 400px at 50% -10%, color-mix(in srgb, var(--accent) 25%, transparent), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-24 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Früher Zugang — 14 Tage kostenlos testen
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Social Media planen.
            <br />
            <span className="text-accent-fg">Ohne Account-Limits.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            Planbar ist das Planungstool für alle, die mehr als drei Profile betreuen:
            unbegrenzte Accounts, Planung so weit im Voraus, wie du willst, und
            KI-Unterstützung zu deinen Konditionen.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/app"
              className="rounded-xl bg-accent px-6 py-3 font-medium text-accent-contrast transition hover:brightness-110"
            >
              Kostenlos testen
            </Link>
            <a
              href="#pricing"
              className="rounded-xl border border-line px-6 py-3 font-medium text-foreground transition hover:bg-surface"
            >
              Preise ansehen
            </a>
          </div>
          <p className="mt-4 text-xs text-muted">Keine Kreditkarte nötig · monatlich kündbar</p>
        </div>

        {/* Mini-Kalender-Mock */}
        <div className="relative mx-auto mb-24 max-w-4xl px-6">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-3 text-sm">
              <span className="font-semibold">August 2026</span>
              <span className="text-muted">Monatsansicht</span>
            </div>
            <div className="grid grid-cols-7 gap-px bg-line p-px">
              {Array.from({ length: 21 }, (_, i) => (
                <div key={i} className="min-h-20 bg-surface p-1.5">
                  <div className="px-1 text-[10px] text-muted">{i + 3}</div>
                  {[4, 7, 9, 12, 15, 18].includes(i + 3) && (
                    <div
                      className="mt-1 truncate rounded-md px-1.5 py-1 text-[9px]"
                      style={{
                        background: ["#e1306c22", "#0a66c222", "#0891b222"][i % 3],
                      }}
                    >
                      <span
                        className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: ["#e1306c", "#0a66c2", "#0891b2"][i % 3] }}
                      />
                      {["Reel: Behind the Scenes", "Recruiting-Post", "Trend-Video"][i % 3]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          Alles, was du zum Planen brauchst
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted">
          Gebaut für Creator, Unternehmen und Agenturen, die viele Kanäle gleichzeitig bespielen.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-surface p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-lg">
                {f.icon}
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          Faire Preise, keine Account-Mathematik
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted">
          Jeder Tarif enthält unbegrenzte Social Accounts. Jährlich zahlen = 2 Monate geschenkt.
        </p>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {PRICING.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border bg-surface p-7 ${
                p.highlight
                  ? "border-accent shadow-[0_0_40px_color-mix(in_srgb,var(--accent)_15%,transparent)]"
                  : "border-line"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-contrast">
                  Am beliebtesten
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted">{p.tagline}</p>
              <div className="mt-5">
                <span className="text-4xl font-semibold">{p.price}</span>
                <span className="text-muted"> / Monat</span>
              </div>
              <ul className="mt-6 flex flex-col gap-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-muted">
                    <span className="text-success">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/app"
                className={`mt-8 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition ${
                  p.highlight
                    ? "bg-accent text-accent-contrast hover:brightness-110"
                    : "border border-line hover:bg-surface-2"
                }`}
              >
                14 Tage kostenlos testen
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto w-full max-w-3xl px-6 py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight">Häufige Fragen</h2>
        <div className="mt-10 flex flex-col gap-4">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-line bg-surface p-5 open:border-accent/40"
            >
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                <span className="mr-2 inline-block text-accent-fg transition group-open:rotate-90">›</span>
                {item.q}
              </summary>
              <p className="mt-3 pl-5 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-4xl px-6 pb-24">
        <div
          className="rounded-3xl border border-accent/30 p-10 text-center"
          style={{
            background:
              "radial-gradient(400px 200px at 50% 0%, color-mix(in srgb, var(--accent) 20%, var(--surface)), var(--surface))",
          }}
        >
          <h2 className="text-3xl font-semibold tracking-tight">
            Bereit, deinen Content-Plan zu füllen?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Starte kostenlos und verbinde in 5 Minuten deine ersten Accounts.
          </p>
          <Link
            href="/app"
            className="mt-7 inline-block rounded-xl bg-accent px-8 py-3 font-medium text-accent-contrast transition hover:brightness-110"
          >
            Jetzt kostenlos testen
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-contrast">
              P
            </span>
            Planbar · Prototyp
          </div>
          <div className="flex gap-6">
            <span className="cursor-pointer transition hover:text-foreground">Impressum</span>
            <span className="cursor-pointer transition hover:text-foreground">Datenschutz</span>
            <span className="cursor-pointer transition hover:text-foreground">AGB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
