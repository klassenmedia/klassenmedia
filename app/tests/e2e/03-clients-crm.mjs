import { assert, registerFreshUser } from "./helpers.mjs";

export default async function run({ page, baseUrl }) {
  await registerFreshUser(page, baseUrl, { prefix: "crm" });

  // Kunde anlegen
  await page.goto(`${baseUrl}/app/clients`);
  const clientName = "Bäckerei E2E " + Date.now();
  await page.fill('input[placeholder="Name des Kunden (z. B. Bäckerei Berger)"]', clientName);
  await page.click("text=Kunde anlegen");
  await page.waitForSelector(`text=${clientName}`, { timeout: 10_000 });

  // Ins Kundenprofil wechseln
  await page.click("text=Profil öffnen →");
  await page.waitForSelector('h1:has-text("' + clientName + '")', { timeout: 10_000 });

  // Marke & Strategie ausfüllen und speichern
  await page.fill('textarea[placeholder="Was soll erreicht werden?"]', "Mehr Laufkundschaft");
  await page.fill('textarea[placeholder="Wen sprechen wir an?"]', "Familien im Kiez");
  await page.fill('textarea[placeholder="Worum geht es inhaltlich?"]', "Frisches Brot, Events");
  await page.fill('input[placeholder="z. B. #2563eb, Gold"]', "#8b4513, Creme");
  await page.fill('input[placeholder="z. B. Inter, Playfair"]', "Fraunces");
  await page.fill('textarea[placeholder="#backstube #regional …"]', "#backstube #regional");
  await page.click('button:has-text("Marke & Strategie speichern")');
  await page.waitForTimeout(600);

  // Ansprechpartner hinzufügen
  await page.fill('input[placeholder="Name*"]', "Frauke Beispiel");
  await page.fill('input[placeholder="Rolle (z. B. Marketing)"]', "Inhaberin");
  await page.click("text=+ Ansprechpartner");
  await page.waitForSelector("text=Frauke Beispiel", { timeout: 10_000 });

  // Aufgabe hinzufügen und abhaken
  const taskTitle = "E2E-Aufgabe " + Date.now();
  await page.fill('input[placeholder="Neue Aufgabe …"]', taskTitle);
  await page.click("text=+ Aufgabe");
  const taskRow = page.locator(`text=${taskTitle}`).locator("..");
  await taskRow.waitFor({ timeout: 10_000 });
  // Controlled Checkbox (Server Action im Hintergrund) — .check() prüft den
  // Zustand direkt nach dem Klick, bevor die React-Neurendierung durch ist.
  // Also klicken und auf den echten (persistenten) Zustand pollen.
  await taskRow.locator('input[type="checkbox"]').click();
  await page.waitForFunction(
    (title) => {
      const rows = [...document.querySelectorAll("span")].filter((s) => s.textContent === title);
      const row = rows[0]?.closest("div");
      const box = row?.querySelector('input[type="checkbox"]');
      return box && box.checked;
    },
    taskTitle,
    { timeout: 10_000 }
  );

  // Kontakt-Historie: Telefonat protokollieren
  const callNote = "Telefonat E2E " + Date.now();
  await page.click('button:has-text("📞 Telefonat")');
  await page.fill('textarea[placeholder*="telefoniert"]', callNote);
  await page.click("text=+ Eintrag");
  await page.waitForSelector(`text=${callNote}`, { timeout: 10_000 });

  // Wiedervorlage auf gestern setzen → muss sofort als fällig gelten
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  await page.fill('input[aria-label="Wiedervorlage-Datum"]', yKey);
  await page.fill('input[placeholder*="Angebot nachfassen"]', "E2E nachfassen");
  await page.click('button:has-text("Setzen")');
  await page.waitForSelector("text=Fällig seit", { timeout: 10_000 });

  // Reload — Brand-Felder, Kontakt, Aufgabe und Historie müssen persistent sein
  await page.reload();
  assert(
    (await page.inputValue('textarea[placeholder="Was soll erreicht werden?"]')) === "Mehr Laufkundschaft",
    "Ziele-Feld hat den Reload nicht überlebt"
  );
  assert(await page.locator("text=Frauke Beispiel").isVisible(), "Ansprechpartner nicht persistent");
  const checkbox = page.locator(`text=${taskTitle}`).locator("..").locator('input[type="checkbox"]');
  assert(await checkbox.isChecked(), "Aufgaben-Status (erledigt) nicht persistent");
  assert(await page.locator(`text=${callNote}`).isVisible(), "Kontakt-Historie nicht persistent");

  // Fällige Wiedervorlage erscheint als Erinnerung auf jeder Seite
  await page.goto(page.url().replace(/\/app\/.*$/, "/app/planner"));
  await page.waitForSelector("text=Wiedervorlage:", { timeout: 10_000 });
  assert(
    await page.locator("text=E2E nachfassen").isVisible(),
    "Wiedervorlage-Banner fehlt trotz fälligem Datum"
  );

  // "Erledigt" räumt die Erinnerung weg
  await page.click('button:has-text("✓ Erledigt")');
  await page.waitForSelector("text=Wiedervorlage:", { state: "detached", timeout: 10_000 });
}
