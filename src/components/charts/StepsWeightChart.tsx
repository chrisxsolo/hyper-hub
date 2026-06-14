"use client";

import { useId, useMemo, useState } from "react";
import { motion } from "framer-motion";

export type SWPoint = { label: string; steps: number; weight: number | null };

const W = 680;
const PAD = { top: 18, right: 48, bottom: 30, left: 46 };

// Dual-axis: monthly average steps (bars, left) vs average weight (line, right).
export default function StepsWeightChart({ data, height = 280 }: { data: SWPoint[]; height?: number }) {
  const gid = useId();
  const [hover, setHover] = useState<number | null>(null);
  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const g = useMemo(() => {
    if (!data.length) return null;
    const maxSteps = Math.max(...data.map((d) => d.steps)) * 1.1 || 1;
    const ws = data.map((d) => d.weight).filter((w): w is number => w != null);
    let wMin = ws.length ? Math.min(...ws) : 0;
    let wMax = ws.length ? Math.max(...ws) : 1;
    const span = wMax - wMin || 1;
    wMin -= span * 0.3; wMax += span * 0.3;

    const bw = innerW / data.length;
    const ys = (v: number) => PAD.top + innerH - (v / maxSteps) * innerH;
    const yw = (v: number) => PAD.top + innerH - ((v - wMin) / (wMax - wMin)) * innerH;
    const cx = (i: number) => PAD.left + bw * i + bw / 2;

    const bars = data.map((d, i) => ({ d, i, x: cx(i), top: ys(d.steps), h: PAD.top + innerH - ys(d.steps), w: Math.min(38, bw * 0.55) }));
    const wpts = data.map((d, i) => (d.weight == null ? null : { x: cx(i), y: yw(d.weight), v: d.weight, i })).filter(Boolean) as { x: number; y: number; v: number; i: number }[];
    const wline = wpts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const stepTicks = Array.from({ length: 4 }, (_, k) => { const v = (k / 3) * maxSteps; return { v, y: ys(v) }; });
    return { bars, wpts, wline, stepTicks, yw, wMin, wMax };
  }, [data, innerW, innerH]);

  if (!g) return <div className="flex items-center justify-center text-sm text-readable-faint" style={{ height }}>No data.</div>;

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-4 mb-2 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" /> Avg daily steps</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Avg weight</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        {g.stepTicks.map((t, k) => (
          <g key={k}>
            <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} stroke="rgba(255,255,255,0.06)" />
            <text x={PAD.left - 8} y={t.y + 3} textAnchor="end" fontSize="9" className="fill-cyan-400/60">{(t.v / 1000).toFixed(0)}k</text>
          </g>
        ))}
        {/* weight axis labels */}
        {[g.wMin, (g.wMin + g.wMax) / 2, g.wMax].map((v, k) => (
          <text key={k} x={W - PAD.right + 8} y={g.yw(v) + 3} fontSize="9" className="fill-blue-400/70">{v.toFixed(0)}</text>
        ))}

        {g.bars.map((b) => (
          <g key={b.i} onMouseEnter={() => setHover(b.i)}>
            <motion.rect x={b.x - b.w / 2} width={b.w} rx="3" fill={`url(#${gid})`} fillOpacity={hover === b.i ? 1 : 0.85}
              initial={{ height: 0, y: PAD.top + innerH }} animate={{ height: b.h, y: b.top }} transition={{ duration: 0.7, delay: b.i * 0.05 }} />
            <text x={b.x} y={H - 10} textAnchor="middle" fontSize="9" className="fill-white/45">{b.d.label}</text>
          </g>
        ))}

        <motion.polyline points={g.wline} fill="none" stroke="#60a5fa" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: "easeInOut", delay: 0.4 }} />
        {g.wpts.map((p) => (
          <motion.circle key={p.i} cx={p.x} cy={p.y} r="3.5" fill="#60a5fa" stroke="#0d0d0f" strokeWidth="1.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 + p.i * 0.05 }} />
        ))}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-white/10 bg-[#15151a] px-2.5 py-1.5 text-xs shadow-xl whitespace-nowrap"
          style={{ left: `${(g.bars[hover].x / W) * 100}%`, top: 4 }}>
          <div className="text-[10px] text-readable-faint mb-0.5">{g.bars[hover].d.label}</div>
          <div className="text-cyan-300">{Math.round(g.bars[hover].d.steps).toLocaleString()} steps/day</div>
          {g.bars[hover].d.weight != null && <div className="text-blue-300">{g.bars[hover].d.weight!.toFixed(1)} lb avg</div>}
        </div>
      )}
    </div>
  );
}
