"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingDown, Flame, Droplets, Dumbbell, Activity, Target, Gauge as GaugeIcon } from "lucide-react";
import AnimatedNumber from "@/components/charts/AnimatedNumber";
import TrendChart from "@/components/charts/TrendChart";
import StackedAreaChart from "@/components/charts/StackedAreaChart";
import BarChart from "@/components/charts/BarChart";
import Gauge from "@/components/charts/Gauge";
import Sparkline from "@/components/charts/Sparkline";

export type WeightRow = {
  id: string;
  measured_on: string;
  measured_at: string | null;
  weight_lbs: number;
  body_fat_pct: number | null;
  bmi: number | null;
  fat_free_lbs: number | null;
  subcutaneous_fat_pct: number | null;
  visceral_fat: number | null;
  body_water_pct: number | null;
  skeletal_muscle_pct: number | null;
  muscle_mass_lbs: number | null;
  bone_mass_lbs: number | null;
  protein_pct: number | null;
  bmr_kcal: number | null;
  metabolic_age: number | null;
  note: string | null;
};

type MetricKey =
  | "weight_lbs" | "body_fat_pct" | "muscle_mass_lbs" | "bmi" | "body_water_pct"
  | "visceral_fat" | "skeletal_muscle_pct" | "bmr_kcal" | "metabolic_age";

const METRICS: { key: MetricKey; label: string; unit: string; color: string }[] = [
  { key: "weight_lbs", label: "Weight", unit: "lb", color: "#60a5fa" },
  { key: "body_fat_pct", label: "Body Fat", unit: "%", color: "#f59e0b" },
  { key: "muscle_mass_lbs", label: "Muscle Mass", unit: "lb", color: "#a78bfa" },
  { key: "bmi", label: "BMI", unit: "", color: "#34d399" },
  { key: "body_water_pct", label: "Body Water", unit: "%", color: "#22d3ee" },
  { key: "visceral_fat", label: "Visceral Fat", unit: "", color: "#f87171" },
  { key: "skeletal_muscle_pct", label: "Skeletal Muscle", unit: "%", color: "#c084fc" },
  { key: "bmr_kcal", label: "BMR", unit: "kcal", color: "#fb923c" },
  { key: "metabolic_age", label: "Metabolic Age", unit: "yr", color: "#94a3b8" },
];

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

function firstLast<T>(arr: T[]): [T, T] {
  return [arr[0], arr[arr.length - 1]];
}

export default function WeightLossView({ rows }: { rows: WeightRow[] }) {
  const [metric, setMetric] = useState<MetricKey>("weight_lbs");
  const [smooth, setSmooth] = useState(true);

  const chrono = useMemo(
    () =>
      [...rows].sort((a, b) =>
        (a.measured_at ?? a.measured_on).localeCompare(b.measured_at ?? b.measured_on),
      ),
    [rows],
  );

  const series = (key: MetricKey) =>
    chrono
      .filter((r) => r[key] != null)
      .map((r) => ({ date: r.measured_on, value: Number(r[key]) }));

  const stats = useMemo(() => {
    if (chrono.length < 2) return null;
    const w = chrono.map((r) => Number(r.weight_lbs));
    const [startW, curW] = firstLast(w);
    const lowest = Math.min(...w);
    const lost = startW - curW;
    const pct = (lost / startW) * 100;

    const bfRows = chrono.filter((r) => r.body_fat_pct != null);
    const [bfStart, bfCur] = bfRows.length >= 2 ? firstLast(bfRows.map((r) => Number(r.body_fat_pct))) : [null, null];

    const leanRows = chrono.filter((r) => r.fat_free_lbs != null);
    const [leanStart, leanCur] = leanRows.length >= 2 ? firstLast(leanRows.map((r) => Number(r.fat_free_lbs))) : [null, null];

    const fatMass = (r: WeightRow) =>
      r.fat_free_lbs != null ? Number(r.weight_lbs) - Number(r.fat_free_lbs) : null;
    const fmRows = chrono.filter((r) => fatMass(r) != null);
    const [fmStart, fmCur] = fmRows.length >= 2 ? firstLast(fmRows.map((r) => fatMass(r)!)) : [null, null];

    const vfRows = chrono.filter((r) => r.visceral_fat != null);
    const [vfStart, vfCur] = vfRows.length >= 2 ? firstLast(vfRows.map((r) => Number(r.visceral_fat))) : [null, null];

    const t0 = new Date((chrono[0].measured_at ?? chrono[0].measured_on)).getTime();
    const t1 = new Date((chrono[chrono.length - 1].measured_at ?? chrono[chrono.length - 1].measured_on)).getTime();
    const weeks = Math.max(1, (t1 - t0) / (1000 * 60 * 60 * 24 * 7));
    const ratePerWeek = lost / weeks;

    return {
      startW, curW, lowest, lost, pct, weeks,
      ratePerWeek,
      bfStart, bfCur,
      leanStart, leanCur, leanChange: leanStart != null && leanCur != null ? leanCur - leanStart : null,
      fatLost: fmStart != null && fmCur != null ? fmStart - fmCur : null,
      vfStart, vfCur,
      bmiCur: chrono.filter((r) => r.bmi != null).map((r) => Number(r.bmi)).slice(-1)[0] ?? null,
      bmrCur: chrono.filter((r) => r.bmr_kcal != null).map((r) => Number(r.bmr_kcal)).slice(-1)[0] ?? null,
      metAgeCur: chrono.filter((r) => r.metabolic_age != null).map((r) => Number(r.metabolic_age)).slice(-1)[0] ?? null,
      count: chrono.length,
    };
  }, [chrono]);

  const recomp = useMemo(
    () =>
      chrono
        .filter((r) => r.fat_free_lbs != null)
        .map((r) => ({ date: r.measured_on, a: Number(r.fat_free_lbs), b: Number(r.weight_lbs) - Number(r.fat_free_lbs) })),
    [chrono],
  );

  const monthly = useMemo(() => {
    const byMonth = new Map<string, WeightRow>();
    for (const r of chrono) {
      const m = r.measured_on.slice(0, 7);
      const prev = byMonth.get(m);
      if (!prev || (r.measured_at ?? r.measured_on) > (prev.measured_at ?? prev.measured_on)) byMonth.set(m, r);
    }
    const months = [...byMonth.keys()].sort();
    const bars: { label: string; value: number }[] = [];
    for (let i = 1; i < months.length; i++) {
      const cur = Number(byMonth.get(months[i])!.weight_lbs);
      const prev = Number(byMonth.get(months[i - 1])!.weight_lbs);
      bars.push({
        label: new Date(months[i] + "-01").toLocaleDateString(undefined, { month: "short" }),
        value: +(cur - prev).toFixed(1),
      });
    }
    return bars;
  }, [chrono]);

  if (!stats) {
    return <div className="glass rounded-2xl border border-white/8 p-8 text-sm text-readable-faint">Not enough weight data yet.</div>;
  }

  const activeMetric = METRICS.find((m) => m.key === metric)!;
  const lostPositive = stats.lost >= 0;

  const kpis = [
    { icon: TrendingDown, color: "#60a5fa", label: "Current weight", value: stats.curW, dec: 1, suffix: " lb",
      sub: `${lostPositive ? "↓" : "↑"} ${Math.abs(stats.lost).toFixed(1)} lb from ${stats.startW.toFixed(1)}` },
    { icon: Target, color: "#34d399", label: "Total lost", value: Math.abs(stats.lost), dec: 1, suffix: " lb",
      sub: `${stats.pct >= 0 ? "−" : "+"}${Math.abs(stats.pct).toFixed(1)}% body weight` },
    { icon: Flame, color: "#f59e0b", label: "Body fat now", value: stats.bfCur ?? 0, dec: 1, suffix: "%",
      sub: stats.bfStart != null ? `↓ ${(stats.bfStart - (stats.bfCur ?? 0)).toFixed(1)} pts from ${stats.bfStart.toFixed(1)}%` : "—" },
    { icon: Flame, color: "#fb7185", label: "Fat mass lost", value: stats.fatLost ?? 0, dec: 1, suffix: " lb",
      sub: "Pure fat, not muscle" },
    { icon: Dumbbell, color: "#a78bfa", label: "Lean mass", value: stats.leanCur ?? 0, dec: 1, suffix: " lb",
      sub: stats.leanChange != null ? `${stats.leanChange >= 0 ? "+" : ""}${stats.leanChange.toFixed(1)} lb change` : "—" },
    { icon: Activity, color: "#22d3ee", label: "Avg rate", value: Math.abs(stats.ratePerWeek), dec: 2, suffix: " lb/wk",
      sub: `over ${Math.round(stats.weeks)} weeks` },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="space-y-6">
      {/* KPI grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glass rounded-2xl border border-white/8 p-4 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-[0.07]"><Icon size={72} /></div>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={15} style={{ color: k.color }} />
                <span className="text-[11px] uppercase tracking-wide text-readable-faint">{k.label}</span>
              </div>
              <div className="text-2xl font-bold text-white leading-none">
                <AnimatedNumber value={k.value} decimals={k.dec} suffix={k.suffix} />
              </div>
              <div className="text-[11px] text-readable-faint mt-1.5">{k.sub}</div>
            </div>
          );
        })}
      </motion.div>

      {/* Main interactive trend with metric switcher */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: activeMetric.color }} />
            <h2 className="text-sm font-semibold text-white">{activeMetric.label} over time</h2>
            {activeMetric.unit && <span className="text-xs text-readable-faint">({activeMetric.unit})</span>}
          </div>
          <button
            onClick={() => setSmooth((s) => !s)}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${smooth ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "text-readable-faint border-white/10"}`}
          >
            7-pt avg
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${metric === m.key ? "text-white" : "text-readable-faint border-white/10 hover:bg-white/[0.05]"}`}
              style={metric === m.key ? { background: `${m.color}22`, borderColor: `${m.color}55` } : undefined}
            >
              {m.label}
            </button>
          ))}
        </div>

        <TrendChart
          key={metric}
          data={series(metric)}
          color={activeMetric.color}
          unit={activeMetric.unit}
          showAvg={smooth}
          markMinMax={metric === "weight_lbs"}
        />
      </motion.div>

      {/* Body recomposition */}
      {recomp.length > 1 && (
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Body recomposition</h2>
          <p className="text-xs text-readable-faint mb-3">How your fat mass and lean mass each changed as the weight came off (scale bioimpedance estimate).</p>
          <StackedAreaChart data={recomp} labelA="Lean mass" labelB="Fat mass" colorA="#a78bfa" colorB="#f59e0b" unit="lb" />
        </motion.div>
      )}

      {/* Two-up: monthly change + BMI gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Monthly change</h2>
          <p className="text-xs text-readable-faint mb-3">Green = lost weight that month, red = gained.</p>
          <BarChart data={monthly} unit="lb" decimals={1} />
        </motion.div>

        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-white mb-3">BMI</h2>
          {stats.bmiCur != null ? <Gauge value={stats.bmiCur} /> : <div className="text-sm text-readable-faint">No BMI data.</div>}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <div className="text-[10px] uppercase tracking-wide text-readable-faint mb-1">Metabolic age</div>
              <div className="text-lg font-bold text-white">{stats.metAgeCur ?? "—"}<span className="text-xs text-readable-faint"> yr</span></div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <div className="text-[10px] uppercase tracking-wide text-readable-faint mb-1">BMR</div>
              <div className="text-lg font-bold text-white">{stats.bmrCur ?? "—"}<span className="text-xs text-readable-faint"> kcal</span></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Small multiples */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-semibold text-white mb-4">All metrics at a glance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {METRICS.map((m) => {
            const s = series(m.key);
            if (s.length < 2) return null;
            const last = s[s.length - 1].value;
            const first = s[0].value;
            const diff = last - first;
            return (
              <div key={m.key} className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-readable-soft">{m.label}</span>
                  <span className="text-[10px]" style={{ color: diff <= 0 ? "#34d399" : "#f87171" }}>
                    {diff > 0 ? "+" : ""}{diff.toFixed(m.unit === "%" || m.key === "bmi" ? 1 : 0)}
                  </span>
                </div>
                <Sparkline values={s.map((p) => p.value)} color={m.color} width={160} height={34} />
                <div className="text-sm font-semibold text-white mt-1">
                  {last.toFixed(m.unit === "%" || m.key === "bmi" ? 1 : 0)}<span className="text-[10px] text-readable-faint"> {m.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
