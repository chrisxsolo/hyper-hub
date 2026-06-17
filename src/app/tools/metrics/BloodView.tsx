"use client";

import { useMemo, useState } from "react";
import { Trash2, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import LineChart, { type ChartPoint } from "@/components/LineChart";
import {
  MARKER_META,
  CATEGORY_ORDER,
  DEFAULT_CATEGORY,
} from "@/data/health/bloodMarkers";

export type BloodRow = {
  id: string;
  drawn_on: string;
  marker: string;
  value: number;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  lab: string | null;
};

const GREEN = "#34d399";
const AMBER = "#fbbf24";

const num = (v: number | string | null): number | null =>
  v == null || v === "" ? null : Number(v);

type State = "in" | "low" | "high" | "good" | "unknown";

function statusOf(r: BloodRow): { state: State; ok: boolean; color: string } {
  const value = Number(r.value);
  const low = num(r.ref_low);
  const high = num(r.ref_high);
  const higherIsBetter = MARKER_META[r.marker]?.higherIsBetter;

  if (higherIsBetter && low != null) {
    return value >= low
      ? { state: "good", ok: true, color: GREEN }
      : { state: "low", ok: false, color: AMBER };
  }
  if (low != null && high != null) {
    if (value < low) return { state: "low", ok: false, color: AMBER };
    if (value > high) return { state: "high", ok: false, color: AMBER };
    return { state: "in", ok: true, color: GREEN };
  }
  return { state: "unknown", ok: true, color: "#94a3b8" };
}

const fmt = (n: number) =>
  Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Range bar ────────────────────────────────────────────────────────────────
function RangeBar({ row }: { row: BloodRow }) {
  const value = Number(row.value);
  const low = num(row.ref_low);
  const high = num(row.ref_high);
  const { color, ok } = statusOf(row);
  const higherIsBetter = MARKER_META[row.marker]?.higherIsBetter;

  // Domain for the track.
  let dMin: number;
  let dMax: number;
  let zoneStart: number;
  let zoneEnd: number;
  if (low != null && high != null) {
    const span = high - low || Math.abs(high) || 1;
    dMin = Math.min(low, value) - span * 0.3;
    dMax = Math.max(high, value) + span * 0.3;
    zoneStart = low;
    zoneEnd = high;
  } else if (higherIsBetter && low != null) {
    dMax = Math.max(value, low * 2) * 1.1;
    dMin = 0;
    zoneStart = low;
    zoneEnd = dMax;
  } else {
    return null;
  }

  const pct = (v: number) =>
    Math.max(0, Math.min(100, ((v - dMin) / (dMax - dMin)) * 100));

  return (
    <div className="mt-2">
      <div className="relative h-2 rounded-full bg-white/[0.06]">
        {/* healthy zone */}
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: `${pct(zoneStart)}%`,
            width: `${pct(zoneEnd) - pct(zoneStart)}%`,
            background: `${GREEN}33`,
          }}
        />
        {/* value marker */}
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#15151a]"
          style={{ left: `${pct(value)}%`, background: color }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-readable-faint">
        <span>{low != null ? fmt(low) : ""}</span>
        <span className={ok ? "" : "text-amber-300/80"}>
          {high != null ? fmt(high) : higherIsBetter ? "↑ higher better" : ""}
        </span>
      </div>
    </div>
  );
}

// ── Marker row ───────────────────────────────────────────────────────────────
function MarkerCard({
  row,
  canEdit,
  onDelete,
}: {
  row: BloodRow;
  canEdit: boolean;
  onDelete?: (id: string) => void;
}) {
  const { color, ok, state } = statusOf(row);
  const meta = MARKER_META[row.marker];
  const flagNote = !ok ? meta?.flagNote : undefined;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate">
              {row.marker}
            </span>
            {!ok && (
              <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-300">
                {state === "high" ? "High" : state === "low" ? "Low" : "Flag"}
              </span>
            )}
          </div>
          {meta?.about && (
            <p className="mt-0.5 text-[11px] leading-snug text-readable-faint">
              {meta.about}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <div className="font-semibold tabular-nums" style={{ color }}>
              {fmt(Number(row.value))}
            </div>
            {row.unit && (
              <div className="text-[10px] text-readable-faint">{row.unit}</div>
            )}
          </div>
          {canEdit && onDelete && (
            <button
              onClick={() => onDelete(row.id)}
              className="text-readable-faint transition-colors hover:text-red-400"
              aria-label="Delete reading"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      <RangeBar row={row} />
      {flagNote && (
        <p className="mt-2 rounded-lg bg-amber-500/[0.07] px-2.5 py-1.5 text-[11px] leading-snug text-amber-200/80">
          {flagNote}
        </p>
      )}
    </div>
  );
}

// ── Derived ratios ───────────────────────────────────────────────────────────
type Insight = { label: string; value: string; note: string; good: boolean };

function buildInsights(get: (m: string) => number | null): Insight[] {
  const out: Insight[] = [];
  const tg = get("Triglycerides");
  const hdl = get("HDL");
  const total = get("Total Cholesterol");

  if (tg != null && hdl != null && hdl > 0) {
    const r = tg / hdl;
    out.push({
      label: "Triglyceride / HDL",
      value: r.toFixed(2),
      note:
        r < 2
          ? "Excellent — a strong sign of insulin sensitivity"
          : r < 3
            ? "Good"
            : "Worth watching (insulin-resistance proxy)",
      good: r < 2,
    });
  }
  if (total != null && hdl != null && hdl > 0) {
    const r = total / hdl;
    out.push({
      label: "Cholesterol / HDL",
      value: r.toFixed(1),
      note: r < 3.5 ? "Excellent cardiovascular ratio" : r < 5 ? "Good" : "Elevated",
      good: r < 3.5,
    });
  }
  if (total != null && hdl != null) {
    const nonHdl = total - hdl;
    out.push({
      label: "Non-HDL cholesterol",
      value: `${fmt(nonHdl)} mg/dL`,
      note: nonHdl < 130 ? "Optimal — all the atherogenic cholesterol" : "Above optimal",
      good: nonHdl < 130,
    });
  }
  return out;
}

// ── Main view ────────────────────────────────────────────────────────────────
export default function BloodView({
  rows,
  canEdit,
  onDelete,
}: {
  rows: BloodRow[];
  canEdit: boolean;
  onDelete?: (id: string) => void;
}) {
  const dates = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.drawn_on))).sort((a, b) =>
        b.localeCompare(a),
      ),
    [rows],
  );
  const [activeDate, setActiveDate] = useState<string>("");
  const panelDate = activeDate || dates[0] || "";
  const panel = useMemo(
    () => rows.filter((r) => r.drawn_on === panelDate),
    [rows, panelDate],
  );

  const get = useMemo(() => {
    const m = new Map(panel.map((r) => [r.marker, Number(r.value)]));
    return (marker: string) => m.get(marker) ?? null;
  }, [panel]);

  const statuses = panel.map((r) => ({ r, s: statusOf(r) }));
  const flagged = statuses.filter((x) => !x.s.ok);
  const inRange = statuses.filter((x) => x.s.ok && x.s.state !== "unknown");
  const lab = panel.find((r) => r.lab)?.lab ?? null;
  const insights = buildInsights(get);

  // Group the active panel by category.
  const grouped = useMemo(() => {
    const map = new Map<string, BloodRow[]>();
    for (const r of panel) {
      const cat = MARKER_META[r.marker]?.category ?? DEFAULT_CATEGORY;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(r);
    }
    const order = [...CATEGORY_ORDER, DEFAULT_CATEGORY];
    return [...map.entries()].sort(
      (a, b) => order.indexOf(a[0] as never) - order.indexOf(b[0] as never),
    );
  }, [panel]);

  // Markers that have more than one reading across panels → trend candidates.
  const trendMarkers = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((r) => counts.set(r.marker, (counts.get(r.marker) ?? 0) + 1));
    return Array.from(counts.entries())
      .filter(([, c]) => c > 1)
      .map(([m]) => m)
      .sort();
  }, [rows]);
  const [trendMarker, setTrendMarker] = useState<string>("");
  const activeTrend = trendMarker || trendMarkers[0] || "";
  const trendSeries = rows.filter((r) => r.marker === activeTrend);
  const trendPoints: ChartPoint[] = trendSeries.map((r) => ({
    date: r.drawn_on,
    value: Number(r.value),
  }));
  const trendLast = trendSeries[trendSeries.length - 1];

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-10 text-center text-sm text-readable-faint">
        No blood panels yet — add a reading below to get started.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Panel date selector */}
      {dates.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDate(d)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                panelDate === d
                  ? "border-cyan-500/30 bg-cyan-500/15 text-cyan-200"
                  : "border-white/10 text-readable-soft hover:bg-white/[0.05]"
              }`}
            >
              {fmtDate(d)}
            </button>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Latest panel</h2>
            <p className="mt-0.5 text-xs text-readable-faint">
              {fmtDate(panelDate)}
              {lab ? ` · ${lab}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center">
              <div className="text-lg font-bold leading-none text-emerald-300">
                {inRange.length}
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-wide text-emerald-300/70">
                In range
              </div>
            </div>
            <div
              className={`rounded-xl border px-3 py-2 text-center ${
                flagged.length
                  ? "border-amber-500/25 bg-amber-500/10"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div
                className={`text-lg font-bold leading-none ${
                  flagged.length ? "text-amber-300" : "text-readable-faint"
                }`}
              >
                {flagged.length}
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-wide text-readable-faint">
                Flagged
              </div>
            </div>
          </div>
        </div>

        {/* Derived insight chips */}
        {insights.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {insights.map((it) => (
              <div
                key={it.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <div className="text-[10px] uppercase tracking-wide text-readable-faint">
                  {it.label}
                </div>
                <div
                  className={`mt-0.5 text-lg font-bold ${
                    it.good ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  {it.value}
                </div>
                <div className="mt-0.5 text-[10px] leading-snug text-readable-soft">
                  {it.note}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flagged callout */}
      {flagged.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-200">
              Outside the standard range
            </h3>
          </div>
          <div className="mt-2.5 space-y-1.5">
            {flagged.map(({ r, s }) => (
              <div key={r.id} className="flex items-baseline gap-2 text-xs">
                <span className="font-medium text-white">{r.marker}</span>
                <span className="text-amber-300">
                  {fmt(Number(r.value))}
                  {r.unit ? ` ${r.unit}` : ""}
                </span>
                <span className="text-readable-faint">
                  (ref {fmt(num(r.ref_low) ?? 0)}–{fmt(num(r.ref_high) ?? 0)}) ·{" "}
                  {s.state === "high" ? "high" : "low"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {flagged.length === 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 size={15} className="text-emerald-400" />
          Every marker on this panel is within its reference range.
        </div>
      )}

      {/* Category groups */}
      {grouped.map(([category, items]) => {
        const flaggedCount = items.filter((r) => !statusOf(r).ok).length;
        return (
          <div key={category} className="glass rounded-2xl border border-white/8 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{category}</h3>
              <span className="text-[10px] text-readable-faint">
                {flaggedCount > 0
                  ? `${flaggedCount} flagged`
                  : `${items.length} normal`}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {items.map((r) => (
                <MarkerCard
                  key={r.id}
                  row={r}
                  canEdit={canEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Trends over time */}
      {trendMarkers.length > 0 && (
        <div className="glass rounded-2xl border border-white/8 p-5">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={15} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Trends over time</h3>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {trendMarkers.map((m) => (
              <button
                key={m}
                onClick={() => setTrendMarker(m)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTrend === m
                    ? "border-cyan-500/30 bg-cyan-500/15 text-cyan-200"
                    : "border-white/10 text-readable-soft hover:bg-white/[0.05]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <LineChart
            data={trendPoints}
            color="#22d3ee"
            unit={trendLast?.unit ?? ""}
            refLow={num(trendLast?.ref_low ?? null)}
            refHigh={num(trendLast?.ref_high ?? null)}
          />
        </div>
      )}

      <p className="px-1 text-[10px] leading-relaxed text-readable-faint">
        Reference ranges are from the lab report. This is a personal dashboard, not
        medical advice — discuss any flagged values with your doctor.
      </p>
    </div>
  );
}
