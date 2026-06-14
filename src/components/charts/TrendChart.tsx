"use client";

import { useId, useMemo, useState } from "react";
import { motion } from "framer-motion";

export type TrendPoint = { date: string; value: number };

const W = 680;
const PAD = { top: 18, right: 18, bottom: 30, left: 46 };

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function movingAverage(pts: TrendPoint[], window: number): (number | null)[] {
  return pts.map((_, i) => {
    if (i < window - 1) return null;
    let sum = 0;
    for (let k = i - window + 1; k <= i; k++) sum += pts[k].value;
    return sum / window;
  });
}

export default function TrendChart({
  data,
  color = "#60a5fa",
  unit = "",
  height = 280,
  showAvg = false,
  avgWindow = 7,
  markMinMax = false,
  goal = null,
}: {
  data: TrendPoint[];
  color?: string;
  unit?: string;
  height?: number;
  showAvg?: boolean;
  avgWindow?: number;
  markMinMax?: boolean;
  goal?: number | null;
}) {
  const gid = useId();
  const [hover, setHover] = useState<number | null>(null);

  const pts = useMemo(
    () => [...data].sort((a, b) => a.date.localeCompare(b.date)),
    [data],
  );

  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const g = useMemo(() => {
    if (!pts.length) return null;
    const vals = pts.map((p) => p.value);
    const extra: number[] = goal != null ? [goal] : [];
    let min = Math.min(...vals, ...extra);
    let max = Math.max(...vals, ...extra);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const span = max - min;
    min -= span * 0.12;
    max += span * 0.12;

    const x = (i: number) =>
      PAD.left + (pts.length === 1 ? innerW / 2 : (i / (pts.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH;

    const coords = pts.map((p, i) => ({ x: x(i), y: y(p.value), p, i }));
    const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
    const area =
      `${coords[0].x},${PAD.top + innerH} ` +
      line +
      ` ${coords[coords.length - 1].x},${PAD.top + innerH}`;

    const avg = showAvg ? movingAverage(pts, avgWindow) : [];
    const avgLine = showAvg
      ? coords
          .map((c, i) => (avg[i] == null ? null : `${c.x.toFixed(1)},${y(avg[i]!).toFixed(1)}`))
          .filter(Boolean)
          .join(" ")
      : "";

    let minI = 0,
      maxI = 0;
    vals.forEach((v, i) => {
      if (v < vals[minI]) minI = i;
      if (v > vals[maxI]) maxI = i;
    });

    const ticks = Array.from({ length: 4 }, (_, k) => {
      const v = min + (k / 3) * (max - min);
      return { v, y: y(v) };
    });

    return { coords, line, area, avgLine, min, max, y, ticks, minI, maxI };
  }, [pts, innerW, innerH, showAvg, avgWindow, goal]);

  if (!g) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-sm text-readable-faint"
        style={{ height }}
      >
        No data yet.
      </div>
    );
  }

  const hp = hover != null ? g.coords[hover] : null;
  const decimals = g.max - g.min > 30 ? 0 : 1;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.30" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {g.ticks.map((t, k) => (
          <g key={k}>
            <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} stroke="rgba(255,255,255,0.06)" />
            <text x={PAD.left - 8} y={t.y + 3} textAnchor="end" fontSize="10" className="fill-white/40">
              {t.v.toFixed(decimals)}
            </text>
          </g>
        ))}

        {goal != null && (
          <g>
            <line x1={PAD.left} x2={W - PAD.right} y1={g.y(goal)} y2={g.y(goal)} stroke="#34d399" strokeDasharray="4 4" strokeOpacity="0.6" />
            <text x={W - PAD.right} y={g.y(goal) - 5} textAnchor="end" fontSize="9" className="fill-emerald-400/80">goal {goal}</text>
          </g>
        )}

        <motion.polygon
          points={g.area}
          fill={`url(#${gid})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
        <motion.polyline
          points={g.line}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.3, ease: "easeInOut" }}
        />

        {showAvg && g.avgLine && (
          <motion.polyline
            points={g.avgLine}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.6"
            strokeDasharray="5 4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          />
        )}

        {markMinMax &&
          [g.minI, g.maxI].map((i, k) => (
            <g key={k}>
              <circle cx={g.coords[i].x} cy={g.coords[i].y} r="4" fill={k === 0 ? "#34d399" : "#f87171"} stroke="#0d0d0f" strokeWidth="1.5" />
              <text x={g.coords[i].x} y={g.coords[i].y + (k === 0 ? 18 : -10)} textAnchor="middle" fontSize="9" className={k === 0 ? "fill-emerald-400" : "fill-red-400"}>
                {pts[i].value.toFixed(decimals)}
              </text>
            </g>
          ))}

        {/* hover hit zones */}
        {g.coords.map((c) => (
          <rect
            key={c.i}
            x={c.x - innerW / Math.max(pts.length, 1) / 2}
            y={PAD.top}
            width={innerW / Math.max(pts.length, 1)}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(c.i)}
          />
        ))}

        {hp && (
          <>
            <line x1={hp.x} x2={hp.x} y1={PAD.top} y2={PAD.top + innerH} stroke="rgba(255,255,255,0.22)" strokeDasharray="3 3" />
            <circle cx={hp.x} cy={hp.y} r="4.5" fill="#fff" stroke={color} strokeWidth="2" />
          </>
        )}

        {[0, pts.length - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
          <text key={i} x={g.coords[i].x} y={H - 9} textAnchor={i === 0 ? "start" : "end"} fontSize="10" className="fill-white/40">
            {fmt(pts[i].date)}
          </text>
        ))}
      </svg>

      {hp && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-[#15151a] px-2.5 py-1.5 text-xs shadow-xl whitespace-nowrap"
          style={{ left: `${(hp.x / W) * 100}%`, top: `${(hp.y / H) * 100}%` }}
        >
          <div className="font-semibold text-white">
            {hp.p.value.toFixed(decimals)}
            {unit && <span className="text-readable-faint"> {unit}</span>}
          </div>
          <div className="text-[10px] text-readable-faint">{fmt(hp.p.date)}</div>
        </div>
      )}
    </div>
  );
}
