import Link from "next/link";

// Datenschutzerklärung — auf die tatsächliche Datenverarbeitung der App
// zugeschnitten. Kein Ersatz für eine anwaltliche Prüfung: Firmenangaben
// ([Platzhalter]) ergänzen und vor dem Live-Gang prüfen lassen.
export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-muted transition hover:text-foreground">
        ← Zurück
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Datenschutzerklärung</h1>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-muted">
        <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-warning">
          Entwurf — inhaltlich auf das Tool zugeschnitten, aber bitte die
          [Platzhalter] füllen und vor dem Live-Gang rechtlich prüfen lassen.
        </p>

        <section>
          <h2 className="font-semibold text-foreground">1. Verantwortlicher</h2>
          <p className="mt-2">
            [Name / Firma], [Anschrift], [E-Mail]. Bei Fragen zum Datenschutz wende
            dich an [datenschutz@…].
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-foreground">2. Welche Daten wir verarbeiten</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>
              <strong className="text-foreground">Kontodaten:</strong> Name, E-Mail-Adresse
              und Passwort. Das Passwort wird ausschließlich als bcrypt-Hash gespeichert —
              niemals im Klartext.
            </li>
            <li>
              <strong className="text-foreground">Sitzungen:</strong> Zur Anmeldung setzen
              wir ein technisch notwendiges, httpOnly-Cookie. In der Datenbank liegt nur ein
              SHA-256-Hash des Sitzungstokens (Laufzeit 30 Tage).
            </li>
            <li>
              <strong className="text-foreground">Inhalte:</strong> Von dir erstellte
              Beiträge, geplante Termine, hochgeladene Bilder sowie Kundendaten deines
              Workspaces (Kundennamen, Ansprechpartner, Notizen).
            </li>
            <li>
              <strong className="text-foreground">Verbundene Social-Media-Konten:</strong>{" "}
              Zugriffstokens der von dir verbundenen Plattformen werden verschlüsselt
              (AES-256-GCM) gespeichert.
            </li>
            <li>
              <strong className="text-foreground">Eigene API-Schlüssel:</strong> Hinterlegst
              du eigene KI-Schlüssel (Anthropic/OpenAI), werden diese verschlüsselt
              (AES-256-GCM) gespeichert und nur für deine Anfragen verwendet.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-foreground">3. Zwecke und Rechtsgrundlagen</h2>
          <p className="mt-2">
            Wir verarbeiten die Daten, um dir das Tool bereitzustellen
            (Vertragserfüllung, Art. 6 Abs. 1 lit. b DSGVO) sowie zur Sicherheit und
            Verbesserung des Dienstes (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-foreground">4. Auftragsverarbeiter &amp; Weitergabe</h2>
          <p className="mt-2">
            Zur Erbringung des Dienstes setzen wir sorgfältig ausgewählte Dienstleister ein
            (Auftragsverarbeitung nach Art. 28 DSGVO):
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li><strong className="text-foreground">Hosting:</strong> [Hosting-Anbieter], Serverstandort [Region].</li>
            <li><strong className="text-foreground">Zahlungen:</strong> Stripe — nur bei kostenpflichtiger Nutzung; Zahlungsdaten verarbeiten wir nicht selbst.</li>
            <li><strong className="text-foreground">KI:</strong> Anthropic und/oder OpenAI — nur die von dir für eine KI-Funktion übermittelten Inhalte (Text/Prompt), nur wenn du die KI aktiv nutzt.</li>
            <li><strong className="text-foreground">Social-Media-Plattformen:</strong> Meta, TikTok, LinkedIn, Google/YouTube, Pinterest, X — sofern du Konten verbindest und Beiträge veröffentlichst; dann werden die jeweiligen Inhalte an die Plattform übermittelt.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-foreground">5. Cookies</h2>
          <p className="mt-2">
            Wir verwenden ausschließlich ein technisch notwendiges Sitzungs-Cookie für die
            Anmeldung. Kein Tracking, keine Werbe- oder Analyse-Cookies.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-foreground">6. Speicherdauer</h2>
          <p className="mt-2">
            Wir speichern deine Daten, solange dein Konto besteht. Nach Löschung des Kontos
            werden die zugehörigen Daten gelöscht, soweit keine gesetzlichen
            Aufbewahrungspflichten (z. B. Rechnungen) entgegenstehen.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-foreground">7. Deine Rechte</h2>
          <p className="mt-2">
            Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
            Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das
            Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde. Wende dich dafür an
            [datenschutz@…].
          </p>
        </section>

        <p className="text-xs">Stand: [Monat Jahr]</p>
      </div>
    </div>
  );
}
