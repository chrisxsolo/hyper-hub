"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

// Tiny inline trend line for small-multiples grids.
export default function Sparkline({
  values,
  color = "#60a5fa",
  width = 130,
  height = 36,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const d = useMemo(() => {
    const v = values.filter((n) => Number.isFinite(n));
    if (v.length < 2) return null;
    let min = Math.min(...v);
    let max = Math.max(...v);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const pad = 3;
    const x = (i: number) => pad + (i / (v.length - 1)) * (width - pad * 2);
    const y = (n: number) => pad + (1 - (n - min) / (max - min)) * (height - pad * 2);
    return {
      line: v.map((n, i) => `${x(i).toFixed(1)},${y(n).toFixed(1)}`).join(" "),
      last: { x: x(v.length - 1), y: y(v[v.length - 1]) },
    };
  }, [values, width, height]);

  if (!d) return <div style={{ width, height }} />;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      <motion.polyline
        points={d.line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <circle cx={d.last.x} cy={d.last.y} r="2.4" fill={color} />
    </svg>
  );
}
