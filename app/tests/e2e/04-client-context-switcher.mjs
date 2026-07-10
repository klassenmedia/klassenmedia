import { assert, registerFreshUser } from "./helpers.mjs";

async function createClient(page, baseUrl, name) {
  await page.goto(`${baseUrl}/app/clients`);
  await page.fill('input[placeholder="Name des Kunden (z. B. Bäckerei Berger)"]', name);
  await page.click("text=Kunde anlegen");
  await page.waitForSelector(`text=${name}`, { timeout: 10_000 });
}

async function switchClient(page, baseUrl, name) {
  // ClientBar ist auf jeder /app/*-Seite sichtbar
  if (!page.url().startsWith(`${baseUrl}/app`)) await page.goto(`${baseUrl}/app`);
  await page.click('[data-testid="client-bar-trigger"]');
  await page.click(`[data-testid="client-bar-menu"] [data-client-name="${name}"]`);
}

async function switchToAllClients(page, baseUrl) {
  if (!page.url().startsWith(`${baseUrl}/app`)) await page.goto(`${baseUrl}/app`);
  await page.click('[data-testid="client-bar-trigger"]');
  await page.click('[data-testid="client-bar-option-all"]');
}

async function addAccountForActiveClient(page, baseUrl, displayName, handle) {
  await page.goto(`${baseUrl}/app/accounts`);
  await page.click("text=+ Account verbinden");
  await page.click('button:has-text("Selbst einloggen")');
  await page.fill('input[placeholder="z. B. Klassen Media"]', displayName);
  await page.fill('input[placeholder="z. B. @klassenmedia"]', handle);
  await page.click('text="Verbinden"');
  await page.waitForSelector(`text=${handle}`, { timeout: 10_000 });
}

async function createPostForActiveClient(page, baseUrl, body) {
  await page.goto(`${baseUrl}/app/planner`);
  await page.click("text=+ Neuer Post");
  await page.fill('textarea[placeholder="Was möchtest du posten?"]', body);
  // Der einzige Account des aktiven Kunden ist beim Öffnen des Composers
  // bereits vorausgewählt — nicht extra anklicken.
  await page.click('button:has-text("Planen")');
  await page.waitForSelector(`text=${body}`, { timeout: 10_000 });
}

export default async function run({ page, baseUrl }) {
  await registerFreshUser(page, baseUrl, { prefix: "switcher" });

  const stamp = Date.now();
  const clientA = `Kunde-A-${stamp}`;
  const clientB = `Kunde-B-${stamp}`;
  await createClient(page, baseUrl, clientA);
  await createClient(page, baseUrl, clientB);

  await switchClient(page, baseUrl, clientA);
  await addAccountForActiveClient(page, baseUrl, "Konto A", `@konto-a-${stamp}`);
  const bodyA = `Post für ${clientA}`;
  await createPostForActiveClient(page, baseUrl, bodyA);

  await switchClient(page, baseUrl, clientB);
  await addAccountForActiveClient(page, baseUrl, "Konto B", `@konto-b-${stamp}`);
  const bodyB = `Post für ${clientB}`;
  await createPostForActiveClient(page, baseUrl, bodyB);

  // Im Kontext von Kunde A: nur Post A sichtbar, Post B nicht
  await switchClient(page, baseUrl, clientA);
  await page.goto(`${baseUrl}/app/board`);
  await page.waitForSelector(`text=${bodyA}`, { timeout: 10_000 });
  assert(await page.locator(`text=${bodyA}`).isVisible(), "Post von Kunde A fehlt im eigenen Kontext");
  assert(
    !(await page.locator(`text=${bodyB}`).isVisible().catch(() => false)),
    "Post von Kunde B ist fälschlich im Kontext von Kunde A sichtbar — Kundentrennung verletzt"
  );

  // "Alle Kunden": beide Posts sichtbar
  await switchToAllClients(page, baseUrl);
  await page.goto(`${baseUrl}/app/board`);
  await page.waitForSelector(`text=${bodyA}`, { timeout: 10_000 });
  assert(await page.locator(`text=${bodyA}`).isVisible(), "Post A fehlt in der Gesamtübersicht");
  assert(await page.locator(`text=${bodyB}`).isVisible(), "Post B fehlt in der Gesamtübersicht");
}
