"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

export type Bar = { label: string; value: number };

const W = 680;
const PAD = { top: 18, right: 14, bottom: 30, left: 40 };

export default function BarChart({
  data,
  height = 240,
  unit = "",
  positiveColor = "#34d399",
  negativeColor = "#f87171",
  singleColor = null,
  decimals = 0,
}: {
  data: Bar[];
  height?: number;
  unit?: string;
  positiveColor?: string;
  negativeColor?: string;
  singleColor?: string | null;
  decimals?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const g = useMemo(() => {
    if (!data.length) return null;
    const vals = data.map((d) => d.value);
    const max = Math.max(0, ...vals);
    const min = Math.min(0, ...vals);
    const range = max - min || 1;
    const y = (v: number) => PAD.top + innerH - ((v - min) / range) * innerH;
    const zeroY = y(0);
    const bw = innerW / data.length;
    const bars = data.map((d, i) => {
      const cx = PAD.left + bw * i + bw / 2;
      const top = y(Math.max(0, d.value));
      const bottom = y(Math.min(0, d.value));
      return { d, i, cx, top, h: Math.max(1, bottom - top), w: Math.min(46, bw * 0.6) };
    });
    return { bars, zeroY, bw };
  }, [data, innerW, innerH]);

  if (!g) return <div className="flex items-center justify-center text-sm text-readable-faint" style={{ height }}>No data.</div>;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} onMouseLeave={() => setHover(null)}>
        <line x1={PAD.left} x2={W - PAD.right} y1={g.zeroY} y2={g.zeroY} stroke="rgba(255,255,255,0.15)" />
        {g.bars.map((b) => {
          const color = singleColor ?? (b.d.value <= 0 ? positiveColor : negativeColor);
          return (
            <g key={b.i} onMouseEnter={() => setHover(b.i)}>
              <motion.rect
                x={b.cx - b.w / 2}
                width={b.w}
                rx="3"
                fill={color}
                fillOpacity={hover === b.i ? 1 : 0.8}
                initial={{ height: 0, y: g.zeroY }}
                animate={{ height: b.h, y: b.top }}
                transition={{ duration: 0.7, delay: b.i * 0.04, ease: "easeOut" }}
              />
              <text x={b.cx} y={H - 10} textAnchor="middle" fontSize="9" className="fill-white/45">{b.d.label}</text>
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-[#15151a] px-2.5 py-1.5 text-xs shadow-xl whitespace-nowrap"
          style={{ left: `${(g.bars[hover].cx / W) * 100}%`, top: `${(g.bars[hover].top / H) * 100}%` }}>
          <div className="font-semibold text-white">{g.bars[hover].d.value > 0 ? "+" : ""}{g.bars[hover].d.value.toFixed(decimals)}{unit && ` ${unit}`}</div>
          <div className="text-[10px] text-readable-faint">{g.bars[hover].d.label}</div>
        </div>
      )}
    </div>
  );
}
