"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button, inputCls, Modal, PlatformChip } from "@/components/ui";
import type { ClientItem } from "@/lib/types";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#e11d48", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

function ColorDot({ color, size = 12 }: { color: string; size?: number }) {
  return <span className="inline-block rounded-full" style={{ width: size, height: size, background: color }} />;
}

export default function ClientsPage() {
  const { clients, accounts, can, createClient, updateClient, deleteClient, assignAccount } = useStore();
  const manage = can("accounts");

  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [edit, setEdit] = useState<ClientItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(COLORS[0]);

  const unassigned = accounts.filter((a) => !a.clientId);

  async function addClient() {
    if (!name.trim()) return;
    setCreating(true);
    const ok = await createClient(name.trim(), color);
    setCreating(false);
    if (ok) {
      setName("");
      setColor(COLORS[0]);
    }
  }

  function openEdit(c: ClientItem) {
    setEdit(c);
    setEditName(c.name);
    setEditColor(c.color);
  }

  async function saveEdit() {
    if (!edit) return;
    await updateClient(edit.id, { name: editName.trim() || undefined, color: editColor });
    setEdit(null);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Kunden</h1>
        <p className="mt-1 text-sm text-muted">
          Gruppiere die Accounts deiner Kunden. Mit dem Kunden-Filter links siehst du überall nur
          diesen Kunden — oder alle auf einen Blick.
        </p>
      </div>

      {/* Neuer Kunde */}
      {manage && (
        <div className="mb-8 rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 font-semibold">Neuer Kunde</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !creating && addClient()}
              placeholder="Name des Kunden (z. B. Bäckerei Berger)"
              className={`${inputCls} min-w-56 flex-1`}
            />
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Farbe ${c}`}
                  className={`h-6 w-6 rounded-full transition ${color === c ? "ring-2 ring-offset-2 ring-offset-surface" : ""}`}
                  style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
                />
              ))}
            </div>
            <Button onClick={addClient} disabled={!name.trim() || creating} className="shrink-0">
              {creating ? "Legt an …" : "Kunde anlegen"}
            </Button>
          </div>
        </div>
      )}

      {/* Kundenliste */}
      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          Noch keine Kunden. Leg oben deinen ersten Kunden an und ordne ihm dann Accounts zu.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {clients.map((c) => {
            const accs = accounts.filter((a) => a.clientId === c.id);
            return (
              <div key={c.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="h-1.5" style={{ background: c.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <ColorDot color={c.color} size={14} />
                      <span className="font-semibold">{c.name}</span>
                    </div>
                    {manage && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-surface-2 hover:text-foreground"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Kunde „${c.name}“ löschen? Die Accounts bleiben erhalten (werden „ohne Kunde“).`))
                              deleteClient(c.id);
                          }}
                          aria-label="Kunde löschen"
                          className="rounded-lg px-2 py-1 text-sm text-muted transition hover:bg-danger/15 hover:text-danger"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {c.accountCount} {c.accountCount === 1 ? "Account" : "Accounts"} · {c.postCount} Posts
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {accs.length === 0 ? (
                      <span className="text-xs text-muted">Noch keine Accounts zugeordnet.</span>
                    ) : (
                      accs.map((a) => (
                        <span
                          key={a.id}
                          className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-xs"
                        >
                          <PlatformChip platform={a.platform} size={16} /> {a.handle}
                        </span>
                      ))
                    )}
                  </div>

                  <Link
                    href={`/app/clients/${c.id}`}
                    className="mt-4 inline-block text-sm font-medium text-accent-fg hover:underline"
                  >
                    Profil öffnen →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Accounts ohne Kunde */}
      {unassigned.length > 0 && (
        <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Accounts ohne Kunde ({unassigned.length})</h2>
          <p className="mt-1 text-sm text-muted">Ordne sie einem Kunden zu, damit sie in der Gruppierung auftauchen.</p>
          <div className="mt-4 flex flex-col gap-2">
            {unassigned.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5"
              >
                <PlatformChip platform={a.platform} size={22} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{a.displayName}</div>
                  <div className="truncate text-xs text-muted">{a.handle}</div>
                </div>
                {manage ? (
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && assignAccount(a.id, e.target.value)}
                    className="rounded-lg border border-line bg-surface px-2 py-1 text-xs"
                  >
                    <option value="" disabled>
                      Kunde wählen …
                    </option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-muted">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {edit && (
        <Modal title="Kunde bearbeiten" onClose={() => setEdit(null)}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} autoFocus />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Farbe</label>
              <div className="flex items-center gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    aria-label={`Farbe ${c}`}
                    className="h-7 w-7 rounded-full transition"
                    style={{ background: c, boxShadow: editColor === c ? `0 0 0 2px ${c}` : undefined }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <Button variant="ghost" onClick={() => setEdit(null)}>
                Abbrechen
              </Button>
              <Button onClick={saveEdit} disabled={!editName.trim()}>
                Speichern
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
