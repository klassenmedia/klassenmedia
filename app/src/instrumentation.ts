// Wird von Next.js beim Serverstart ausgeführt — startet den Publishing-
// Scheduler (nur im Node-Runtime-Prozess, nicht im Edge/Browser-Bundle).

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./lib/publishing/scheduler");
    startScheduler();
  }
}
