"use client";

import { Fragment, useMemo, useState } from "react";
import type { Analytics } from "@/lib/analytics";
import { getAnalyticsAction } from "@/lib/analytics-actions";
import { PlatformChip } from "@/components/ui";
import { PLATFORMS } from "@/lib/types";

const RANGES = [
  { days: 7, label: "7 Tage" },
  { days: 30, label: "30 Tage" },
  { days: 90, label: "90 Tage" },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + " Mio.";
  if (n >= 10_000) return Math.round(n / 1000) + "k";
  if (n >= 1_000) return (n / 1000).toFixed(1).replace(".", ",") + "k";
  return n.toLocaleString("de-DE");
}

function Delta({ value, unit = "%" }: { value: number; unit?: string }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        up ? "text-success" : "text-danger"
      }`}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {up ? "+" : ""}
      {value}
      {unit}
    </span>
  );
}

// ── Trend-Chart (eine Serie, eine Akzentfarbe, eine Achse) ──────────────
function TrendChart({
  series,
  metric,
}: {
  series: Analytics["series"];
  metric: "reach" | "engagement";
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 1000;
  const H = 280;
  const padX = 8;
  const padY = 20;

  const values = series.map((d) => d[metric]);
  const max = Math.max(1, ...values);
  const stepX = series.length > 1 ? (W - padX * 2) / (series.length - 1) : 0;
  const x = (i: number) => padX + i * stepX;
  const y = (v: number) => padY + (H - padY * 2) * (1 - v / max);

  const linePath = series
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[metric]).toFixed(1)}`)
    .join(" ");
  const areaPath =
    `M${x(0).toFixed(1)},${(H - padY).toFixed(1)} ` +
    series.map((d, i) => `L${x(i).toFixed(1)},${y(d[metric]).toFixed(1)}`).join(" ") +
    ` L${x(series.length - 1).toFixed(1)},${(H - padY).toFixed(1)} Z`;

  // wenige, gut lesbare X-Beschriftungen
  const labelEvery = Math.ceil(series.length / 6);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round((rel - padX) / (stepX || 1));
    setHover(Math.max(0, Math.min(series.length - 1, i)));
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 280 }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`Verlauf ${metric === "reach" ? "Reichweite" : "Interaktionen"}`}
      >
        {/* recessive Grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={W - padX}
            y1={padY + (H - padY * 2) * f}
            y2={padY + (H - padY * 2) * f}
            stroke="var(--border)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {hover !== null && (
          <>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={padY}
              y2={H - padY}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={x(hover)}
              cy={y(series[hover][metric])}
              r={4}
              fill="var(--accent)"
              stroke="var(--surface)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
      </svg>

      {/* X-Achsen-Beschriftung */}
      <div className="mt-1 flex justify-between px-1 text-[10px] text-muted">
        {series.map((d, i) =>
          i % labelEvery === 0 || i === series.length - 1 ? (
            <span key={i}>{d.label}</span>
          ) : null
        )}
      </div>

      {hover !== null && (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs shadow-lg">
          <span className="text-muted">{series[hover].label} </span>
          <span className="font-semibold">
            {(metric === "reach" ? series[hover].reach : series[hover].engagement).toLocaleString(
              "de-DE"
            )}
          </span>{" "}
          {metric === "reach" ? "Reichweite" : "Interaktionen"}
        </div>
      )}
    </div>
  );
}

// ── Kanal-Balken (horizontal, Plattform-Markenfarbe + immer beschriftet) ─
function ChannelBars({ channels }: { channels: Analytics["channels"] }) {
  const max = Math.max(1, ...channels.map((c) => c.reach));
  if (channels.length === 0) {
    return <p className="text-sm text-muted">Noch keine Kanäle verbunden.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {channels.map((c) => (
        <div key={c.platform} className="flex items-center gap-3">
          <div className="flex w-28 shrink-0 items-center gap-2">
            <PlatformChip platform={c.platform} size={20} />
            <span className="truncate text-xs font-medium">{PLATFORMS[c.platform].label}</span>
          </div>
          <div className="relative h-5 flex-1 rounded-full bg-surface-2">
            <div
              className="h-5 rounded-full"
              style={{
                width: `${Math.max(4, (c.reach / max) * 100)}%`,
                background: PLATFORMS[c.platform].color,
              }}
              title={`${PLATFORMS[c.platform].label}: ${c.reach.toLocaleString("de-DE")} Reichweite`}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums">
            {fmt(c.reach)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Beste Zeiten (Heatmap, sequenziell eine Akzentfarbe hell→kräftig) ────
function BestTimes({ data }: { data: Analytics["bestTimes"] }) {
  return (
    <div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${data.buckets.length}, 1fr)` }}>
        <div />
        {data.buckets.map((b) => (
          <div key={b} className="pb-1 text-center text-[9px] text-muted">
            {b}
          </div>
        ))}
        {data.days.map((day, d) => (
          <Fragment key={day}>
            <div className="flex items-center pr-1.5 text-[10px] font-medium text-muted">
              {day}
            </div>
            {data.grid[d].map((v, b) => (
              <div
                key={`${d}-${b}`}
                className="aspect-square rounded-[4px]"
                title={`${day} ${data.buckets[b]} Uhr · ${Math.round(v * 100)}% relativ`}
                style={{
                  background: `color-mix(in srgb, var(--accent) ${Math.round(v * 90 + 6)}%, var(--surface-2))`,
                }}
              />
            ))}
          </Fragment>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        Bester Slot: <span className="font-semibold text-accent-fg">{data.peak}</span>
      </p>
    </div>
  );
}

export function AnalyticsView({ initial }: { initial: Analytics }) {
  const [data, setData] = useState<Analytics>(initial);
  const [range, setRange] = useState(30);
  const [metric, setMetric] = useState<"reach" | "engagement">("reach");
  const [loading, setLoading] = useState(false);

  async function changeRange(days: number) {
    setRange(days);
    setLoading(true);
    try {
      setData(await getAnalyticsAction(days));
    } finally {
      setLoading(false);
    }
  }

  const kpis = useMemo(
    () => [
      { label: "Reichweite", value: fmt(data.kpis.reach.value), delta: data.kpis.reach.deltaPct },
      { label: "Interaktionen", value: fmt(data.kpis.engagement.value), delta: data.kpis.engagement.deltaPct },
      {
        label: "Engagement-Rate",
        value: data.kpis.engagementRate.value.toLocaleString("de-DE") + " %",
        delta: data.kpis.engagementRate.deltaPct,
        unit: " Pp",
      },
      { label: "Follower gesamt", value: fmt(data.kpis.followers.value), delta: data.kpis.followers.deltaPct },
    ],
    [data]
  );

  return (
    <div className={`mx-auto max-w-6xl transition-opacity ${loading ? "opacity-60" : ""}`}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted">
            Reichweite, Interaktionen und beste Zeiten über alle Kanäle.
          </p>
        </div>
        <div className="flex rounded-xl border border-line bg-surface p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => changeRange(r.days)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                range === r.days
                  ? "bg-accent text-accent-contrast"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {data.simulated && (
        <div className="mb-6 rounded-xl border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm text-warning">
          Simulierte Beispiel-Daten. Sobald deine Accounts über die Plattform-APIs verbunden sind
          (Phase 6b), erscheinen hier die echten Insights-Zahlen.
        </div>
      )}

      {/* KPI-Kacheln */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-surface p-5">
            <div className="text-sm text-muted">{k.label}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight">{k.value}</span>
              <Delta value={k.delta} unit={k.unit ?? "%"} />
            </div>
            <div className="mt-0.5 text-[11px] text-muted">vs. Vorperiode</div>
          </div>
        ))}
      </div>

      {/* Trend */}
      <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Verlauf</h2>
          <div className="flex rounded-lg border border-line p-0.5 text-xs">
            {(
              [
                ["reach", "Reichweite"],
                ["engagement", "Interaktionen"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMetric(key)}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  metric === key ? "bg-accent-soft text-accent-fg" : "text-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <TrendChart series={data.series} metric={metric} />
      </div>

      {/* Kanäle + beste Zeiten */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-4 font-semibold">Reichweite pro Kanal</h2>
          <ChannelBars channels={data.channels} />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-4 font-semibold">Beste Posting-Zeiten</h2>
          <BestTimes data={data.bestTimes} />
        </div>
      </div>

      {/* Top-Posts */}
      <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 font-semibold">Top-Beiträge</h2>
        {data.topPosts.length === 0 ? (
          <p className="text-sm text-muted">
            Noch keine veröffentlichten Beiträge im Zeitraum — sobald Posts live gehen, erscheinen
            hier die stärksten.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="pb-2 font-semibold">Beitrag</th>
                  <th className="pb-2 font-semibold">Kanäle</th>
                  <th className="pb-2 text-right font-semibold">Reichweite</th>
                  <th className="pb-2 text-right font-semibold">Interakt.</th>
                  <th className="pb-2 text-right font-semibold">Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.topPosts.map((p) => (
                  <tr key={p.id} className="border-b border-line/60 last:border-0">
                    <td className="max-w-xs py-2.5 pr-4">
                      <div className="truncate">{p.body}</div>
                      <div className="text-xs text-muted">{p.date}</div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex -space-x-1.5">
                        {p.platforms.map((pl) => (
                          <PlatformChip key={pl} platform={pl} size={20} />
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{fmt(p.reach)}</td>
                    <td className="py-2.5 text-right tabular-nums">{fmt(p.engagement)}</td>
                    <td className="py-2.5 text-right font-medium tabular-nums text-accent-fg">
                      {p.engagementRate.toLocaleString("de-DE")} %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
