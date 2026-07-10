import Link from "next/link";

// Impressum nach § 5 DDG (früher TMG). Die [Platzhalter] muss Andreas mit den
// echten Firmen-/Kontaktdaten füllen, bevor das Tool öffentlich geht.
export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-muted transition hover:text-foreground">
        ← Zurück
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Impressum</h1>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed">
        <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-warning">
          Entwurf — bitte vor dem Live-Gang die [Platzhalter] mit deinen echten
          Angaben füllen.
        </p>

        <section>
          <h2 className="font-semibold">Angaben gemäß § 5 DDG</h2>
          <p className="mt-2 text-muted">
            [Vor- und Nachname / Firmenname]
            <br />
            [Straße und Hausnummer]
            <br />
            [PLZ und Ort]
            <br />
            [Land]
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Vertreten durch</h2>
          <p className="mt-2 text-muted">[Name der vertretungsberechtigten Person]</p>
        </section>

        <section>
          <h2 className="font-semibold">Kontakt</h2>
          <p className="mt-2 text-muted">
            E-Mail: [deine@e-mail.de]
            <br />
            Telefon: [+49 …]
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Umsatzsteuer-ID</h2>
          <p className="mt-2 text-muted">
            Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: [DE… — falls vorhanden]
          </p>
        </section>

        <section>
          <h2 className="font-semibold">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p className="mt-2 text-muted">
            [Name]
            <br />
            [Anschrift wie oben]
          </p>
        </section>
      </div>
    </div>
  );
}
