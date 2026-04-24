"use client";

import { motion } from "framer-motion";

interface Stat {
  label: string;
  value: string;
  note: string;
}

const accentMap: Record<string, string> = {
  amber: "text-amber-400",
  purple: "text-purple-400",
  green: "text-emerald-400",
  blue: "text-blue-400",
};

export default function StatCard({ stat, color, index }: { stat: Stat; color: string; index: number }) {
  const accent = accentMap[color] ?? accentMap.amber;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 + index * 0.06, duration: 0.35 }}
      className="glass rounded-xl p-4 text-center"
    >
      <div className={`text-2xl font-bold ${accent} mb-0.5`}>{stat.value}</div>
      <div className="text-xs text-readable-soft leading-tight">{stat.note}</div>
      <div className="text-xs text-readable-muted mt-1 font-medium">{stat.label}</div>
    </motion.div>
  );
}
