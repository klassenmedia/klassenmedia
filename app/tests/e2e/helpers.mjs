// Gemeinsame Helfer für die E2E-Suite: Server starten/stoppen, Login/Registrierung,
// kleine Assert-Utilities. Läuft gegen einen echten Next.js-Produktionsbuild mit
// einer wegwerfbaren SQLite-DB (tests/e2e/.runtime/) — nie gegen die Dev-DB.

import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import fs from "node:fs";
import net from "node:net";

const APP_DIR = path.resolve(import.meta.dirname, "../..");
const RUNTIME_DIR = path.join(APP_DIR, "tests/e2e/.runtime");

export class AssertionError extends Error {}

export function assert(cond, message) {
  if (!cond) throw new AssertionError(message || "Assertion failed");
}

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // noch nicht bereit
    }
    await sleep(300);
  }
  throw new Error(`Server unter ${url} nicht rechtzeitig erreichbar`);
}

function run(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`));
    });
  });
}

/** Baut die App (falls nötig) und startet sie gegen eine frische Test-DB. */
export async function startApp() {
  fs.rmSync(RUNTIME_DIR, { recursive: true, force: true });
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });

  const port = await findFreePort();
  const dbPath = path.join(RUNTIME_DIR, "e2e.db");
  const env = {
    ...process.env,
    DATABASE_URL: `file:${dbPath}`,
    APP_SECRET: process.env.APP_SECRET || "e2e-test-secret-0000000000000000000000000000",
    UPLOADS_DIR: path.join(RUNTIME_DIR, "uploads"),
    PUBLISH_MODE: "simulate",
    NODE_ENV: "production",
  };

  if (!fs.existsSync(path.join(APP_DIR, ".next/BUILD_ID"))) {
    console.log("→ Kein Build gefunden, baue zuerst (npm run build) …");
    await run("npm", ["run", "build"], { cwd: APP_DIR, env });
  }

  await run("npx", ["prisma", "migrate", "deploy"], { cwd: APP_DIR, env });

  // detached, um eine eigene Prozessgruppe zu bekommen — npx spawnt next-server
  // als Kindprozess; ohne Gruppen-Kill (-pid) bleibt der beim Beenden ein Zombie.
  const server = spawn("npx", ["next", "start", "-p", String(port)], {
    cwd: APP_DIR,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));

  const baseUrl = `http://localhost:${port}`;
  try {
    await waitForServer(baseUrl);
  } catch (e) {
    console.error(serverLog);
    throw e;
  }

  return {
    baseUrl,
    async stop() {
      try {
        process.kill(-server.pid, "SIGKILL");
      } catch {
        server.kill("SIGKILL");
      }
      await sleep(200);
      fs.rmSync(RUNTIME_DIR, { recursive: true, force: true });
    },
  };
}

export async function launchBrowser() {
  return chromium.launch({ executablePath: "/opt/pw-browsers/chromium", headless: true });
}

let counter = 0;
/** Eindeutige, aber deterministische Test-E-Mail (kein Date.now()-Bedarf pro Lauf). */
export function uniqueEmail(prefix) {
  counter += 1;
  return `${prefix}.${process.pid}.${counter}@e2e.test`;
}

/** Registriert einen frischen Nutzer und landet eingeloggt auf /app. */
export async function registerFreshUser(page, baseUrl, { name = "E2E Testerin", prefix = "e2e" } = {}) {
  const email = uniqueEmail(prefix);
  await page.goto(`${baseUrl}/register`);
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.fill("#password", "e2e-passwort-123");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${baseUrl}/app`, { timeout: 15_000 });
  return { email, password: "e2e-passwort-123", name };
}

export async function login(page, baseUrl, email, password) {
  await page.goto(`${baseUrl}/login`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${baseUrl}/app`, { timeout: 15_000 });
}
