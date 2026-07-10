import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
  {
    icon: "∞",
    title: "Unbegrenzte Accounts & Kunden",
    text: "Verbinde so viele Profile und lege so viele Kunden an, wie du betreust — Instagram, TikTok, LinkedIn, Facebook, YouTube, Pinterest und die Kunden-Website. Nichts davon kostet extra.",
  },
  {
    icon: "🗂",
    title: "Ein Klick, ein Kunde",
    text: "Der Kunden-Umschalter stellt die ganze App auf einen Mandanten um: Planer, Board, Inbox, Accounts und Ads zeigen nur noch diesen Kunden. Kein Durcheinander, kein zweiter Login.",
  },
  {
    icon: "📇",
    title: "CRM eingebaut",
    text: "Stammdaten, Marke & Strategie, Ansprechpartner, To-dos — plus Kontakt-Historie für Telefonate und Meetings und Wiedervorlagen, die dich automatisch erinnern, dranzubleiben.",
  },
  {
    icon: "✅",
    title: "Freigaben ohne E-Mail-Pingpong",
    text: "Kanban-Board von Entwurf bis Veröffentlicht, Freigabe-Links für Kunden ohne eigenes Login, Änderungswünsche mit Kommentar — alles protokolliert.",
  },
  {
    icon: "✨",
    title: "KI zu deinen Konditionen",
    text: "Captions, Content-Ideen, Bilder und Klartext-Learnings aus deinen Zahlen. Mit inkludierten Credits — oder deinem eigenen API-Key ganz ohne Aufschlag.",
  },
  {
    icon: "📰",
    title: "Auch Blog & Website",
    text: "Blogartikel für die Kunden-Website planen und automatisch auf WordPress veröffentlichen — im selben Kalender wie die Social-Beiträge.",
  },
  {
    icon: "📣",
    title: "Beiträge bewerben",
    text: "Gut gelaufene Posts direkt aus dem Tool auf Instagram und Facebook boosten — mit Ziel, Budget, Laufzeit und Kennzahlen auf einen Blick.",
  },
  {
    icon: "🔔",
    title: "Ehrlicher Reel-Modus",
    text: "Trending-Sounds lassen sich über keine API wählen — bei uns kein leeres Versprechen: Planbar erinnert dich zur geplanten Zeit und du postest mit Sound direkt in der App.",
  },
  {
    icon: "🤖",
    title: "Mit Claude verbunden",
    text: "Eigener MCP-Connector: Plane Beiträge direkt aus dem Claude-Chat — „Leg für die Bäckerei drei Posts für nächste Woche an“ — und sie landen fertig im Kalender.",
  },
];

const PLAN_FEATURES = [
  "Unbegrenzte Social Accounts & Kunden",
  "Unbegrenzte Teammitglieder mit Rollen & Freigaben",
  "CRM mit Kontakt-Historie & Wiedervorlage",
  "Kanban-Board, Kalender & Kunden-Freigabelinks",
  "KI-Credits inklusive — eigener API-Key möglich",
  "Blog/WordPress-Kanal & Ads-Modul",
  "Analytics mit Klartext-Learnings",
  "Claude-Anbindung (MCP)",
];

const FAQ = [
  {
    q: "Warum nur ein Tarif?",
    a: "Weil Tarif-Mathematik nervt. Ein Preis, alles drin, keine Limits bei Accounts, Kunden oder Teamgröße. Du sollst nicht rechnen müssen, ob sich ein weiterer Kunde „lohnt“.",
  },
  {
    q: "Wirklich unbegrenzt viele Accounts und Kunden?",
    a: "Ja. Kein zusätzliches Profil und kein zusätzlicher Kunde kostet extra. Planbar ist für Social-Media-Manager:innen gebaut, die 10, 15 oder mehr Kunden mit je mehreren Accounts betreuen.",
  },
  {
    q: "Wie funktioniert die KI-Unterstützung?",
    a: "Du hast zwei Optionen: Entweder du nutzt dein monatliches Credit-Kontingent (und kaufst bei Bedarf Pakete nach), oder du hinterlegst deinen eigenen API-Key von Anthropic oder OpenAI und zahlst die Nutzung direkt beim Anbieter — ganz ohne Aufschlag von uns.",
  },
  {
    q: "Kann ich jederzeit kündigen?",
    a: "Ja, monatlich kündbar, direkt im Kundenportal — ohne Anruf, ohne Frist-Tricks.",
  },
  {
    q: "Welche Plattformen werden unterstützt?",
    a: "Instagram, Facebook, TikTok, LinkedIn, YouTube und Pinterest — plus die eigene Website per WordPress. Weitere folgen laufend.",
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
            <Link href="/login" className="hidden text-sm text-muted transition hover:text-foreground sm:block">
              Einloggen
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition hover:brightness-110"
            >
              Kostenlos starten
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
            Alle Kunden. Alle Kanäle.
            <br />
            <span className="text-accent-fg">Ein Login.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            Planbar ist das Tool für Social-Media-Manager:innen und Agenturen mit vielen Kunden:
            unbegrenzte Accounts, eingebautes CRM, Freigaben ohne E-Mail-Pingpong und
            KI-Unterstützung zu deinen Konditionen — alles in einem Abo.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
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
      <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          Ein Preis. Alles drin. Keine Limits.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted">
          Keine Tarif-Mathematik, kein „ab“, keine Aufpreise pro Account, Kunde oder
          Teammitglied. Ein Abo, das mit dir arbeitet statt gegen dich.
        </p>
        <div className="mx-auto mt-12 max-w-lg">
          <div className="relative flex flex-col rounded-2xl border border-accent bg-surface p-8 shadow-[0_0_40px_color-mix(in_srgb,var(--accent)_15%,transparent)]">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-contrast">
              Der einzige Tarif
            </span>
            <h3 className="text-lg font-semibold">Komplett</h3>
            <p className="mt-1 text-sm text-muted">
              Für Social-Media-Manager:innen, Agenturen und Teams jeder Größe
            </p>
            <div className="mt-5">
              <span className="text-5xl font-semibold">79 €</span>
              <span className="text-muted"> / Monat</span>
            </div>
            <ul className="mt-6 flex flex-col gap-2.5 text-sm">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex gap-2.5 text-muted">
                  <span className="text-success">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-8 rounded-xl bg-accent px-4 py-3 text-center text-sm font-medium text-accent-contrast transition hover:brightness-110"
            >
              14 Tage kostenlos testen
            </Link>
            <p className="mt-3 text-center text-xs text-muted">
              Keine Kreditkarte nötig · monatlich kündbar
            </p>
          </div>
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
            href="/register"
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
            Planbar
          </div>
          <div className="flex gap-6">
            <Link href="/impressum" className="transition hover:text-foreground">Impressum</Link>
            <Link href="/datenschutz" className="transition hover:text-foreground">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
