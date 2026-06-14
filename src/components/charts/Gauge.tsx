"use client";

import { motion } from "framer-motion";

// Semicircular gauge, used for BMI. Zones drawn as colored arcs.
const ZONES = [
  { upTo: 18.5, color: "#60a5fa", label: "Under" },
  { upTo: 25, color: "#34d399", label: "Normal" },
  { upTo: 30, color: "#f59e0b", label: "Over" },
  { upTo: 40, color: "#f87171", label: "Obese" },
];

const MIN = 15;
const MAX = 35;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function arc(cx: number, cy: number, r: number, startVal: number, endVal: number) {
  const toAngle = (v: number) => 180 + ((Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)) * 180;
  const s = polar(cx, cy, r, toAngle(startVal));
  const e = polar(cx, cy, r, toAngle(endVal));
  const large = toAngle(endVal) - toAngle(startVal) > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export default function Gauge({ value, label = "BMI" }: { value: number; label?: string }) {
  const cx = 120;
  const cy = 110;
  const r = 86;
  const toAngle = (v: number) => 180 + ((Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)) * 180;
  const needle = polar(cx, cy, r - 14, toAngle(value));
  const zone = ZONES.find((z) => value < z.upTo) ?? ZONES[ZONES.length - 1];

  let prev = MIN;
  return (
    <svg viewBox="0 0 240 140" className="w-full">
      {ZONES.map((z, i) => {
        const seg = arc(cx, cy, r, prev, z.upTo);
        const node = (
          <path key={i} d={seg} fill="none" stroke={z.color} strokeWidth="12" strokeLinecap="butt" opacity="0.85" />
        );
        prev = z.upTo;
        return node;
      })}
      <motion.line
        x1={cx}
        y1={cy}
        x2={needle.x}
        y2={needle.y}
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ x2: polar(cx, cy, r - 14, 180).x, y2: polar(cx, cy, r - 14, 180).y }}
        animate={{ x2: needle.x, y2: needle.y }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      <circle cx={cx} cy={cy} r="5" fill="#fff" />
      <text x={cx} y={cy - 22} textAnchor="middle" fontSize="30" fontWeight="700" className="fill-white">
        {value.toFixed(1)}
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fontSize="12" fontWeight="600" style={{ fill: zone.color }}>
        {zone.label} · {label}
      </text>
    </svg>
  );
}
