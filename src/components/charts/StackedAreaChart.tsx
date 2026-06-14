"use client";

import { useId, useMemo, useState } from "react";
import { motion } from "framer-motion";

export type StackPoint = { date: string; a: number; b: number }; // a = bottom (lean), b = top (fat)

const W = 680;
const PAD = { top: 18, right: 18, bottom: 30, left: 46 };

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function StackedAreaChart({
  data,
  labelA = "A",
  labelB = "B",
  colorA = "#22d3ee",
  colorB = "#f59e0b",
  unit = "lb",
  height = 280,
}: {
  data: StackPoint[];
  labelA?: string;
  labelB?: string;
  colorA?: string;
  colorB?: string;
  unit?: string;
  height?: number;
}) {
  const idA = useId();
  const idB = useId();
  const [hover, setHover] = useState<number | null>(null);

  const pts = useMemo(() => [...data].sort((x, y) => x.date.localeCompare(y.date)), [data]);
  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const g = useMemo(() => {
    if (!pts.length) return null;
    const totals = pts.map((p) => p.a + p.b);
    const max = Math.max(...totals) * 1.08;
    const min = 0;
    const x = (i: number) => PAD.left + (pts.length === 1 ? innerW / 2 : (i / (pts.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH;

    const coords = pts.map((p, i) => ({ x: x(i), yA: y(p.a), yTotal: y(p.a + p.b), p, i }));
    const base = `${coords[0].x},${PAD.top + innerH} ` + coords.map((c) => `${c.x.toFixed(1)},${(PAD.top + innerH).toFixed(1)}`).join(" ");
    const areaA = `${coords[0].x},${PAD.top + innerH} ` + coords.map((c) => `${c.x.toFixed(1)},${c.yA.toFixed(1)}`).join(" ") + ` ${coords[coords.length - 1].x},${PAD.top + innerH}`;
    const areaB = coords.map((c) => `${c.x.toFixed(1)},${c.yA.toFixed(1)}`).join(" ") + " " + [...coords].reverse().map((c) => `${c.x.toFixed(1)},${c.yTotal.toFixed(1)}`).join(" ");

    const ticks = Array.from({ length: 4 }, (_, k) => {
      const v = min + (k / 3) * (max - min);
      return { v, y: y(v) };
    });
    return { coords, areaA, areaB, base, max, ticks };
  }, [pts, innerW, innerH]);

  if (!g) return <div className="flex items-center justify-center text-sm text-readable-faint" style={{ height }}>No data.</div>;

  const hp = hover != null ? g.coords[hover] : null;

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-4 mb-2 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorA }} /> {labelA}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorB }} /> {labelB}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={idA} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorA} stopOpacity="0.55" />
            <stop offset="100%" stopColor={colorA} stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id={idB} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorB} stopOpacity="0.6" />
            <stop offset="100%" stopColor={colorB} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {g.ticks.map((t, k) => (
          <g key={k}>
            <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} stroke="rgba(255,255,255,0.06)" />
            <text x={PAD.left - 8} y={t.y + 3} textAnchor="end" fontSize="10" className="fill-white/40">{t.v.toFixed(0)}</text>
          </g>
        ))}

        <motion.polygon points={g.areaA} fill={`url(#${idA})`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} />
        <motion.polygon points={g.areaB} fill={`url(#${idB})`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15 }} />

        {g.coords.map((c) => (
          <rect key={c.i} x={c.x - innerW / Math.max(pts.length, 1) / 2} y={PAD.top} width={innerW / Math.max(pts.length, 1)} height={innerH} fill="transparent" onMouseEnter={() => setHover(c.i)} />
        ))}
        {hp && <line x1={hp.x} x2={hp.x} y1={PAD.top} y2={PAD.top + innerH} stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />}

        {[0, pts.length - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
          <text key={i} x={g.coords[i].x} y={H - 9} textAnchor={i === 0 ? "start" : "end"} fontSize="10" className="fill-white/40">{fmt(pts[i].date)}</text>
        ))}
      </svg>

      {hp && (
        <div className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-white/10 bg-[#15151a] px-2.5 py-1.5 text-xs shadow-xl whitespace-nowrap" style={{ left: `${(hp.x / W) * 100}%`, top: 4 }}>
          <div className="text-[10px] text-readable-faint mb-0.5">{fmt(hp.p.date)}</div>
          <div style={{ color: colorB }}>{labelB}: {hp.p.b.toFixed(1)} {unit}</div>
          <div style={{ color: colorA }}>{labelA}: {hp.p.a.toFixed(1)} {unit}</div>
        </div>
      )}
    </div>
  );
}
