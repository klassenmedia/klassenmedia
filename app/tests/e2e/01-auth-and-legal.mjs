import { assert, login, registerFreshUser } from "./helpers.mjs";

export default async function run({ page, baseUrl }) {
  // Landing page + Impressum/Datenschutz erreichbar (App-Review-Voraussetzung)
  await page.goto(baseUrl);
  assert((await page.title()).length > 0, "Landingpage hat keinen Titel");
  await page.click('a[href="/impressum"]');
  await page.waitForURL(`${baseUrl}/impressum`);
  assert(await page.locator("h1", { hasText: "Impressum" }).isVisible(), "Impressum-Überschrift fehlt");

  await page.goto(baseUrl);
  await page.click('a[href="/datenschutz"]');
  await page.waitForURL(`${baseUrl}/datenschutz`);
  assert(
    await page.locator("h1", { hasText: "Datenschutzerklärung" }).isVisible(),
    "Datenschutz-Überschrift fehlt"
  );

  // Registrierung → landet eingeloggt auf /app
  const user = await registerFreshUser(page, baseUrl, { prefix: "auth" });
  assert(await page.locator("text=Abmelden").isVisible(), "Nach Registrierung nicht eingeloggt");

  // Abmelden → Login mit falschem Passwort schlägt fehl, mit richtigem klappt's
  await page.click("text=Abmelden");
  await page.waitForURL(`${baseUrl}/login`, { timeout: 10_000 }).catch(() => {});
  if (!page.url().includes("/login")) await page.goto(`${baseUrl}/login`);

  await page.fill("#email", user.email);
  await page.fill("#password", "falsches-passwort");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  assert(page.url().includes("/login"), "Login mit falschem Passwort hätte scheitern müssen");
  assert(
    await page.locator("text=/E-Mail oder Passwort/i").isVisible().catch(() => false),
    "Keine Fehlermeldung bei falschem Login sichtbar"
  );

  await login(page, baseUrl, user.email, user.password);
  assert(page.url() === `${baseUrl}/app`, "Login mit korrektem Passwort hat nicht auf /app geführt");
}
