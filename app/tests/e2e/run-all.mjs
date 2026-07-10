// Bündelt die E2E-Suite zu einem Kommando: baut/startet die App einmal gegen
// eine wegwerfbare Test-DB, öffnet für jeden Testfall einen frischen Browser-
// Kontext (eigene Session/Cookies) und meldet Erfolg/Fehler klar in der Konsole.
//
// Aufruf: npm run test:e2e

import path from "node:path";
import { launchBrowser, startApp } from "./helpers.mjs";

const TEST_FILES = [
  "01-auth-and-legal.mjs",
  "02-accounts-planner-board.mjs",
  "03-clients-crm.mjs",
  "04-client-context-switcher.mjs",
];

async function main() {
  console.log("→ Starte App gegen eine frische Test-Datenbank …");
  const app = await startApp();
  console.log(`→ App läuft unter ${app.baseUrl}`);

  const browser = await launchBrowser();
  const results = [];

  for (const file of TEST_FILES) {
    const mod = await import(path.join(import.meta.dirname, file));
    const context = await browser.newContext();
    const page = await context.newPage();
    const started = Date.now();
    process.stdout.write(`  ${file} … `);
    try {
      await mod.default({ page, baseUrl: app.baseUrl });
      const ms = Date.now() - started;
      console.log(`OK (${ms}ms)`);
      results.push({ file, ok: true });
    } catch (err) {
      console.log(`FEHLGESCHLAGEN`);
      console.error(`    ${err instanceof Error ? err.stack : err}`);
      results.push({ file, ok: false, error: err });
    } finally {
      await context.close();
    }
  }

  await browser.close();
  await app.stop();

  const failed = results.filter((r) => !r.ok);
  console.log("");
  console.log(`${results.length - failed.length}/${results.length} Tests bestanden.`);
  if (failed.length > 0) {
    console.log("Fehlgeschlagen: " + failed.map((f) => f.file).join(", "));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("E2E-Suite abgebrochen:", err);
  process.exitCode = 1;
});
