"use client";

import { useId, useMemo, useState } from "react";

export type ChartPoint = { date: string; value: number; label?: string };

type Props = {
  data: ChartPoint[];
  color?: string; // hex
  unit?: string;
  /** Optional reference band (e.g. blood marker healthy range). */
  refLow?: number | null;
  refHigh?: number | null;
  height?: number;
};

const W = 640;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };

function fmtDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function LineChart({
  data,
  color = "#22d3ee",
  unit = "",
  refLow = null,
  refHigh = null,
  height = 240,
}: Props) {
  const gradId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const pts = useMemo(
    () => [...data].sort((a, b) => a.date.localeCompare(b.date)),
    [data],
  );

  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const geom = useMemo(() => {
    if (pts.length === 0) return null;
    const values = pts.map((p) => p.value);
    const candidates = [...values];
    if (refLow != null) candidates.push(refLow);
    if (refHigh != null) candidates.push(refHigh);
    let min = Math.min(...candidates);
    let max = Math.max(...candidates);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const span = max - min;
    min -= span * 0.1;
    max += span * 0.1;

    const x = (i: number) =>
      PAD.left + (pts.length === 1 ? innerW / 2 : (i / (pts.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH;

    const coords = pts.map((p, i) => ({ x: x(i), y: y(p.value), p, i }));
    const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
    const area =
      `${PAD.left + (pts.length === 1 ? innerW / 2 : 0)},${PAD.top + innerH} ` +
      line +
      ` ${coords[coords.length - 1].x},${PAD.top + innerH}`;

    const ticks = Array.from({ length: 4 }, (_, k) => {
      const v = min + (k / 3) * (max - min);
      return { v, y: y(v) };
    });

    return { coords, line, area, y, min, max, ticks };
  }, [pts, innerW, innerH, refLow, refHigh]);

  if (!geom) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-sm text-readable-faint"
        style={{ height }}
      >
        No data yet — add an entry below to see it charted.
      </div>
    );
  }

  const hp = hover != null ? geom.coords[hover] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: "auto" }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* reference band */}
        {refLow != null && refHigh != null && (
          <rect
            x={PAD.left}
            y={geom.y(refHigh)}
            width={innerW}
            height={Math.max(0, geom.y(refLow) - geom.y(refHigh))}
            fill="#34d399"
            opacity="0.08"
          />
        )}

        {/* gridlines + y labels */}
        {geom.ticks.map((t, k) => (
          <g key={k}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={t.y}
              y2={t.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 8}
              y={t.y + 3}
              textAnchor="end"
              className="fill-white/40"
              fontSize="10"
            >
              {t.v.toFixed(geom.max - geom.min > 20 ? 0 : 1).replace(/\.0$/, "")}
            </text>
          </g>
        ))}

        {/* area + line */}
        <polygon points={geom.area} fill={`url(#${gradId})`} />
        <polyline
          points={geom.line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* points + hover hit areas */}
        {geom.coords.map((c) => (
          <g key={c.i}>
            <circle
              cx={c.x}
              cy={c.y}
              r={hover === c.i ? 4.5 : 3}
              fill={hover === c.i ? "#fff" : color}
              stroke={color}
              strokeWidth="1.5"
            />
            <rect
              x={c.x - innerW / Math.max(pts.length, 1) / 2}
              y={PAD.top}
              width={innerW / Math.max(pts.length, 1)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(c.i)}
            />
          </g>
        ))}

        {/* x labels (first, middle, last) */}
        {[0, Math.floor((pts.length - 1) / 2), pts.length - 1]
          .filter((v, i, a) => a.indexOf(v) === i)
          .map((i) => (
            <text
              key={i}
              x={geom.coords[i].x}
              y={H - 8}
              textAnchor="middle"
              className="fill-white/40"
              fontSize="10"
            >
              {fmtDate(pts[i].date)}
            </text>
          ))}

        {/* hover guide line */}
        {hp && (
          <line
            x1={hp.x}
            x2={hp.x}
            y1={PAD.top}
            y2={PAD.top + innerH}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {hp && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-[#15151a] px-2.5 py-1.5 text-xs shadow-xl"
          style={{
            left: `${(hp.x / W) * 100}%`,
            top: `${(hp.y / H) * 100}%`,
          }}
        >
          <div className="font-semibold text-white">
            {hp.p.value}
            {unit && <span className="text-readable-faint"> {unit}</span>}
          </div>
          <div className="text-[10px] text-readable-faint">{fmtDate(hp.p.date)}</div>
        </div>
      )}
    </div>
  );
}
