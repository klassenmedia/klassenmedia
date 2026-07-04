"use client";

import { useState } from "react";
import { acceptInviteByTokenAction } from "@/lib/connect-actions";

export function ConnectButton({
  token,
  platformLabel,
}: {
  token: string;
  platformLabel: string;
}) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setState("working");
    const res = await acceptInviteByTokenAction(token);
    if (res.ok) {
      setState("done");
    } else {
      setError(res.error ?? "Unbekannter Fehler");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="mt-5 rounded-xl bg-success/10 px-4 py-3 text-center text-sm font-medium text-success">
        ✓ Freigabe erteilt! Du kannst dieses Fenster jetzt schließen.
      </div>
    );
  }

  return (
    <>
      <button
        onClick={accept}
        disabled={state === "working"}
        className="mt-5 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-contrast transition hover:brightness-110 disabled:opacity-50"
      >
        {state === "working" ? "Einen Moment …" : `Mit ${platformLabel} anmelden & freigeben`}
      </button>
      {error && <p className="mt-2 text-center text-sm text-danger">{error}</p>}
    </>
  );
}
