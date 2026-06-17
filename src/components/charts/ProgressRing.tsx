"use client";

import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";

// Animated circular progress ring. Fills clockwise to `value / target`, with a
// calm over-target treatment (no alarming red — the spec asks for neutral feedback).
export default function ProgressRing({
  value,
  target,
  label,
  unit = "",
  color,
  size = 168,
  stroke = 13,
  sublabel,
}: {
  value: number;
  target: number;
  label: string;
  unit?: string;
  color: string;
  size?: number;
  stroke?: number;
  sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? value / target : 0;
  const clamped = Math.max(0, Math.min(1, pct));
  const over = pct > 1.02;
  // When over target, the base ring shows the full goal and a softer amber arc
  // shows the overage — informative, not punitive.
  const overFrac = over ? Math.min(1, pct - 1) : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - clamped) }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
          {over && (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c * (1 - overFrac) }}
              transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
              opacity={0.85}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-white leading-none">
            <AnimatedNumber value={Math.round(value)} />
          </div>
          <div className="text-[11px] text-readable-faint mt-1">
            of {Math.round(target).toLocaleString()}
            {unit && ` ${unit}`}
          </div>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-xs font-semibold text-white">{label}</div>
        {sublabel && <div className="text-[11px] text-readable-faint mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
}
