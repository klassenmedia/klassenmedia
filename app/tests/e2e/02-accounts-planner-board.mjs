import { assert, registerFreshUser } from "./helpers.mjs";

export default async function run({ page, baseUrl }) {
  await registerFreshUser(page, baseUrl, { prefix: "planner" });

  // Account verbinden (Demo-"Selbst einloggen"-Flow)
  await page.goto(`${baseUrl}/app/accounts`);
  await page.click("text=+ Account verbinden");
  await page.click('button:has-text("Selbst einloggen")');
  await page.fill('input[placeholder="z. B. Klassen Media"]', "Testkunde GmbH");
  await page.fill('input[placeholder="z. B. @klassenmedia"]', "@testkunde");
  await page.click('text="Verbinden"');
  await page.waitForSelector("text=@testkunde", { timeout: 10_000 });

  // Neuen Post im Planer anlegen — Standardstatus ist "Geplant"
  await page.goto(`${baseUrl}/app/planner`);
  await page.click("text=+ Neuer Post");
  const body = "E2E-Testbeitrag " + Date.now();
  await page.fill('textarea[placeholder="Was möchtest du posten?"]', body);
  // Der erste Account ist beim Öffnen des Composers bereits vorausgewählt —
  // nicht extra anklicken, sonst wird die Auswahl wieder abgewählt.
  await page.click('button:has-text("Planen")');
  await page.waitForSelector(`text=${body}`, { timeout: 10_000 });

  // Im Kanban-Board landet er in der Spalte "Geplant"
  await page.goto(`${baseUrl}/app/board`);
  await page.waitForSelector(`text=${body}`, { timeout: 10_000 });
  assert(
    await page.locator(`text=${body}`).isVisible(),
    "Neu angelegter Beitrag taucht nicht im Board auf"
  );
}
