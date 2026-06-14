"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingDown, Flame, Dumbbell, Activity, Target, Sparkles,
  TrendingUp, Minus, Trophy, CalendarDays, Gauge as GaugeIcon, Zap, ArrowDownRight,
} from "lucide-react";
import AnimatedNumber from "@/components/charts/AnimatedNumber";
import TrendChart, { type Annotation } from "@/components/charts/TrendChart";
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

const METRICS: { key: MetricKey; label: string; unit: string; color: string; goodDown: boolean }[] = [
  { key: "weight_lbs", label: "Weight", unit: "lb", color: "#60a5fa", goodDown: true },
  { key: "body_fat_pct", label: "Body Fat", unit: "%", color: "#f59e0b", goodDown: true },
  { key: "muscle_mass_lbs", label: "Muscle Mass", unit: "lb", color: "#a78bfa", goodDown: false },
  { key: "bmi", label: "BMI", unit: "", color: "#34d399", goodDown: true },
  { key: "body_water_pct", label: "Body Water", unit: "%", color: "#22d3ee", goodDown: false },
  { key: "visceral_fat", label: "Visceral Fat", unit: "", color: "#f87171", goodDown: true },
  { key: "skeletal_muscle_pct", label: "Skeletal Muscle", unit: "%", color: "#c084fc", goodDown: false },
  { key: "bmr_kcal", label: "BMR", unit: "kcal", color: "#fb923c", goodDown: false },
  { key: "metabolic_age", label: "Metabolic Age", unit: "yr", color: "#94a3b8", goodDown: true },
];

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

const parse = (r: WeightRow) => new Date((r.measured_at ?? r.measured_on).replace(" ", "T")).getTime();
const fmtDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
const DAY = 86400000;

// least-squares slope (units/day) over {x:ms, y}
function slopePerDay(pts: { t: number; v: number }[]) {
  const n = pts.length;
  if (n < 2) return 0;
  const mx = pts.reduce((s, p) => s + p.t, 0) / n;
  const my = pts.reduce((s, p) => s + p.v, 0) / n;
  let num = 0, den = 0;
  for (const p of pts) { num += (p.t - mx) * (p.v - my); den += (p.t - mx) ** 2; }
  return den === 0 ? 0 : (num / den) * DAY;
}

export default function WeightLossView({ rows }: { rows: WeightRow[] }) {
  const [metric, setMetric] = useState<MetricKey>("weight_lbs");
  const [smooth, setSmooth] = useState(true);
  const [showNotes, setShowNotes] = useState(true);

  const chrono = useMemo(() => [...rows].sort((a, b) => parse(a) - parse(b)), [rows]);

  const series = (key: MetricKey) =>
    chrono.filter((r) => r[key] != null).map((r) => ({ date: r.measured_on, value: Number(r[key]) }));

  const stats = useMemo(() => {
    if (chrono.length < 2) return null;
    const w = chrono.map((r) => Number(r.weight_lbs));
    const startW = w[0], curW = w[w.length - 1];
    let lowIdx = 0, highIdx = 0;
    w.forEach((v, i) => { if (v < w[lowIdx]) lowIdx = i; if (v > w[highIdx]) highIdx = i; });
    const lost = startW - curW;
    const pct = (lost / startW) * 100;
    const weeks = Math.max(1, (parse(chrono[chrono.length - 1]) - parse(chrono[0])) / (DAY * 7));

    const bf = chrono.filter((r) => r.body_fat_pct != null).map((r) => Number(r.body_fat_pct));
    const lean = chrono.filter((r) => r.fat_free_lbs != null).map((r) => Number(r.fat_free_lbs));
    const fatMass = (r: WeightRow) => (r.fat_free_lbs != null ? Number(r.weight_lbs) - Number(r.fat_free_lbs) : null);
    const fm = chrono.map(fatMass).filter((v): v is number => v != null);
    const vf = chrono.filter((r) => r.visceral_fat != null).map((r) => Number(r.visceral_fat));

    // recent 8-week trajectory
    const cutoff = parse(chrono[chrono.length - 1]) - 56 * DAY;
    const recent = chrono.filter((r) => parse(r) >= cutoff).map((r) => ({ t: parse(r), v: Number(r.weight_lbs) }));
    const recentSlopeWk = slopePerDay(recent) * 7;

    // 30-day delta
    const c30 = parse(chrono[chrono.length - 1]) - 30 * DAY;
    const ago30 = [...chrono].reverse().find((r) => parse(r) <= c30);
    const delta30 = ago30 ? curW - Number(ago30.weight_lbs) : null;

    // biggest single drop
    let bigDrop = { d: 0, from: chrono[0], to: chrono[0] };
    for (let i = 1; i < chrono.length; i++) {
      const d = Number(chrono[i].weight_lbs) - Number(chrono[i - 1].weight_lbs);
      if (d < bigDrop.d) bigDrop = { d, from: chrono[i - 1], to: chrono[i] };
    }

    return {
      startW, curW, lost, pct, weeks,
      lowW: w[lowIdx], lowDate: chrono[lowIdx].measured_on,
      highW: w[highIdx], highDate: chrono[highIdx].measured_on,
      bfStart: bf[0] ?? null, bfCur: bf[bf.length - 1] ?? null,
      leanStart: lean[0] ?? null, leanCur: lean[lean.length - 1] ?? null,
      leanChange: lean.length >= 2 ? lean[lean.length - 1] - lean[0] : null,
      fatLost: fm.length >= 2 ? fm[0] - fm[fm.length - 1] : null,
      vfStart: vf[0] ?? null, vfCur: vf[vf.length - 1] ?? null,
      bmiCur: chrono.filter((r) => r.bmi != null).map((r) => Number(r.bmi)).slice(-1)[0] ?? null,
      bmrCur: chrono.filter((r) => r.bmr_kcal != null).map((r) => Number(r.bmr_kcal)).slice(-1)[0] ?? null,
      metAgeCur: chrono.filter((r) => r.metabolic_age != null).map((r) => Number(r.metabolic_age)).slice(-1)[0] ?? null,
      ratePerWeek: lost / weeks, recentSlopeWk, delta30, bigDrop,
      count: chrono.length,
    };
  }, [chrono]);

  // monthly last-of-month deltas
  const monthly = useMemo(() => {
    const byMonth = new Map<string, WeightRow>();
    for (const r of chrono) {
      const m = r.measured_on.slice(0, 7);
      const prev = byMonth.get(m);
      if (!prev || parse(r) > parse(prev)) byMonth.set(m, r);
    }
    const months = [...byMonth.keys()].sort();
    const bars: { label: string; value: number }[] = [];
    for (let i = 1; i < months.length; i++) {
      bars.push({
        label: new Date(months[i] + "-01").toLocaleDateString(undefined, { month: "short" }),
        value: +(Number(byMonth.get(months[i])!.weight_lbs) - Number(byMonth.get(months[i - 1])!.weight_lbs)).toFixed(1),
      });
    }
    return bars;
  }, [chrono]);

  // weekly last-of-week deltas (velocity)
  const weekly = useMemo(() => {
    const byWeek = new Map<string, WeightRow>();
    for (const r of chrono) {
      const d = new Date(r.measured_on + "T00:00:00");
      const onejan = new Date(d.getFullYear(), 0, 1);
      const wk = Math.ceil((((d.getTime() - onejan.getTime()) / DAY) + onejan.getDay() + 1) / 7);
      const key = `${d.getFullYear()}-${String(wk).padStart(2, "0")}`;
      const prev = byWeek.get(key);
      if (!prev || parse(r) > parse(prev)) byWeek.set(key, r);
    }
    const keys = [...byWeek.keys()].sort();
    const bars: { label: string; value: number }[] = [];
    for (let i = 1; i < keys.length; i++) {
      bars.push({
        label: fmtDay(byWeek.get(keys[i])!.measured_on),
        value: +(Number(byWeek.get(keys[i])!.weight_lbs) - Number(byWeek.get(keys[i - 1])!.weight_lbs)).toFixed(1),
      });
    }
    return bars;
  }, [chrono]);

  const cumulative = useMemo(() => {
    if (!stats) return [];
    return chrono.map((r) => ({ date: r.measured_on, value: +(stats.startW - Number(r.weight_lbs)).toFixed(1) }));
  }, [chrono, stats]);

  const recomp = useMemo(
    () => chrono.filter((r) => r.fat_free_lbs != null)
      .map((r) => ({ date: r.measured_on, a: Number(r.fat_free_lbs), b: Number(r.weight_lbs) - Number(r.fat_free_lbs) })),
    [chrono],
  );

  // interactive goal
  const [goal, setGoal] = useState<number>(118);

  const active = METRICS.find((m) => m.key === metric)!;
  const aSeries = series(metric);

  // annotations for the active metric (start / low / high / current)
  const annotations: Annotation[] = useMemo(() => {
    if (!aSeries.length) return [];
    const vals = aSeries.map((p) => p.value);
    let lo = 0, hi = 0;
    vals.forEach((v, i) => { if (v < vals[lo]) lo = i; if (v > vals[hi]) hi = i; });
    const dec = active.unit === "%" || active.key === "bmi" ? 1 : 0;
    const out: Annotation[] = [
      { date: aSeries[0].date, label: `Start ${vals[0].toFixed(dec)}`, color: "#94a3b8" },
    ];
    if (lo !== 0 && lo !== aSeries.length - 1) out.push({ date: aSeries[lo].date, label: `Low ${vals[lo].toFixed(dec)}`, color: "#34d399", place: "below" });
    if (hi !== 0 && hi !== aSeries.length - 1) out.push({ date: aSeries[hi].date, label: `High ${vals[hi].toFixed(dec)}`, color: "#f87171", place: "above" });
    out.push({ date: aSeries[aSeries.length - 1].date, label: `Now ${vals[vals.length - 1].toFixed(dec)}`, color: active.color });
    return out;
  }, [aSeries, active]);

  if (!stats) {
    return <div className="glass rounded-2xl border border-white/8 p-8 text-sm text-readable-faint">Not enough weight data yet.</div>;
  }

  const metricCaption = () => {
    const vals = aSeries.map((p) => p.value);
    if (vals.length < 2) return "";
    const dec = active.unit === "%" || active.key === "bmi" ? 1 : 0;
    const diff = vals[vals.length - 1] - vals[0];
    const dir = diff < 0 ? "down" : diff > 0 ? "up" : "flat";
    const good = (active.goodDown && diff < 0) || (!active.goodDown && diff > 0);
    return `${active.label} went from ${vals[0].toFixed(dec)} to ${vals[vals.length - 1].toFixed(dec)} ${active.unit} — ${dir === "flat" ? "essentially unchanged" : `${dir} ${Math.abs(diff).toFixed(dec)} ${active.unit}`}${dir !== "flat" ? (good ? " ✓ moving the right way" : "") : ""}.`;
  };

  const lostPositive = stats.lost >= 0;
  const kpis = [
    { icon: TrendingDown, color: "#60a5fa", label: "Current weight", value: stats.curW, dec: 1, suffix: " lb", sub: `${lostPositive ? "↓" : "↑"} ${Math.abs(stats.lost).toFixed(1)} lb from ${stats.startW.toFixed(1)}` },
    { icon: Target, color: "#34d399", label: "Total lost", value: Math.abs(stats.lost), dec: 1, suffix: " lb", sub: `${stats.pct >= 0 ? "−" : "+"}${Math.abs(stats.pct).toFixed(1)}% body weight` },
    { icon: Flame, color: "#f59e0b", label: "Body fat now", value: stats.bfCur ?? 0, dec: 1, suffix: "%", sub: stats.bfStart != null ? `↓ ${(stats.bfStart - (stats.bfCur ?? 0)).toFixed(1)} pts from ${stats.bfStart.toFixed(1)}%` : "—" },
    { icon: Flame, color: "#fb7185", label: "Fat mass lost", value: stats.fatLost ?? 0, dec: 1, suffix: " lb", sub: "Pure fat, not muscle" },
    { icon: Dumbbell, color: "#a78bfa", label: "Lean mass", value: stats.leanCur ?? 0, dec: 1, suffix: " lb", sub: stats.leanChange != null ? `${stats.leanChange >= 0 ? "+" : ""}${stats.leanChange.toFixed(1)} lb change` : "—" },
    { icon: Activity, color: "#22d3ee", label: "Avg rate", value: Math.abs(stats.ratePerWeek), dec: 2, suffix: " lb/wk", sub: `over ${Math.round(stats.weeks)} weeks` },
  ];

  // auto insight cards
  const insights: { icon: React.ElementType; color: string; title: string; text: string }[] = [];
  {
    const trendUp = stats.recentSlopeWk;
    if (stats.delta30 != null) {
      const d = stats.delta30;
      insights.push(d < -0.3
        ? { icon: TrendingDown, color: "#34d399", title: "Still trending down", text: `Down ${Math.abs(d).toFixed(1)} lb over the last 30 days — the most recent stretch is still heading the right way.` }
        : d > 0.3
        ? { icon: TrendingUp, color: "#f59e0b", title: "Slight uptick", text: `Up ${d.toFixed(1)} lb in the last 30 days. A small bounce after a long drop is normal — worth watching.` }
        : { icon: Minus, color: "#60a5fa", title: "Holding steady", text: `Within ${Math.abs(d).toFixed(1)} lb over the last 30 days — you're maintaining at your new lower set-point.` });
    }
    insights.push({ icon: Trophy, color: "#34d399", title: "All-time low", text: `Your lowest reading was ${stats.lowW.toFixed(1)} lb on ${fmtDay(stats.lowDate)} — ${(stats.startW - stats.lowW).toFixed(1)} lb under where you started.` });
    if (stats.bigDrop.d < -0.5)
      insights.push({ icon: ArrowDownRight, color: "#22d3ee", title: "Biggest single drop", text: `${Math.abs(stats.bigDrop.d).toFixed(1)} lb between ${fmtDay(stats.bigDrop.from.measured_on)} and ${fmtDay(stats.bigDrop.to.measured_on)}.` });
    if (stats.fatLost != null && stats.leanChange != null)
      insights.push({ icon: Dumbbell, color: "#a78bfa", title: "Mostly fat, not muscle", text: `Of the weight lost, ~${stats.fatLost.toFixed(1)} lb was fat. Lean mass changed by ${stats.leanChange >= 0 ? "+" : ""}${stats.leanChange.toFixed(1)} lb — keep protein and resistance work up to protect it.` });
    if (stats.vfStart != null && stats.vfCur != null && stats.vfCur < stats.vfStart)
      insights.push({ icon: Flame, color: "#f59e0b", title: "Visceral fat down", text: `Visceral fat dropped from ${stats.vfStart} to ${stats.vfCur} — the metabolically dangerous fat around your organs is shrinking.` });
    insights.push(trendUp < -0.05
      ? { icon: Zap, color: "#34d399", title: "Current trajectory", text: `Your 8-week trend is about ${Math.abs(trendUp).toFixed(2)} lb/week down. Steady and sustainable beats crash dieting.` }
      : { icon: Zap, color: "#60a5fa", title: "Current trajectory", text: `Your 8-week trend is roughly flat (${trendUp.toFixed(2)} lb/wk) — a maintenance phase.` });
  }

  // goal projection
  const rateForProj = Math.min(stats.recentSlopeWk, 0); // only if losing
  const toGo = stats.curW - goal;
  const goalProgress = stats.startW > goal ? Math.min(100, Math.max(0, ((stats.startW - stats.curW) / (stats.startW - goal)) * 100)) : 100;
  let projText = "";
  if (toGo <= 0) projText = `You're already at or below ${goal} lb — set a new target below.`;
  else if (rateForProj < -0.05) {
    const wks = toGo / Math.abs(rateForProj);
    const date = new Date(parse(chrono[chrono.length - 1]) + wks * 7 * DAY);
    projText = `${toGo.toFixed(1)} lb to go. At your recent pace (~${Math.abs(rateForProj).toFixed(2)} lb/wk) you'd reach it in ~${Math.round(wks)} weeks, around ${date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}.`;
  } else projText = `${toGo.toFixed(1)} lb to go. Your recent trend is flat, so reaching ${goal} lb would need a renewed deficit.`;

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="space-y-6">
      {/* Narrative banner */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-emerald-500/20 p-5 bg-gradient-to-br from-emerald-500/8 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">The story so far</h2>
        </div>
        <p className="text-sm text-readable-soft leading-relaxed">
          Since <span className="text-white font-medium">{fmtDay(chrono[0].measured_on)}</span> you&apos;ve gone from{" "}
          <span className="text-white font-medium">{stats.startW.toFixed(1)} lb</span> to{" "}
          <span className="text-emerald-300 font-medium">{stats.curW.toFixed(1)} lb</span> — a loss of{" "}
          <span className="text-emerald-300 font-medium">{stats.lost.toFixed(1)} lb ({stats.pct.toFixed(1)}%)</span> over{" "}
          {Math.round(stats.weeks)} weeks (~{Math.abs(stats.ratePerWeek).toFixed(2)} lb/week).{" "}
          {stats.bfStart != null && stats.bfCur != null && <>Body fat fell from {stats.bfStart.toFixed(1)}% to {stats.bfCur.toFixed(1)}%, and {stats.fatLost != null ? `about ${stats.fatLost.toFixed(1)} lb of that was fat` : "most of the loss was fat"}.</>}
        </p>
      </motion.div>

      {/* KPIs */}
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

      {/* Main annotated trend */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: active.color }} />
            <h2 className="text-sm font-semibold text-white">{active.label} over time</h2>
            {active.unit && <span className="text-xs text-readable-faint">({active.unit})</span>}
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setShowNotes((s) => !s)} className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${showNotes ? "bg-white/10 text-white border-white/20" : "text-readable-faint border-white/10"}`}>Annotations</button>
            <button onClick={() => setSmooth((s) => !s)} className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${smooth ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "text-readable-faint border-white/10"}`}>7-pt avg</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {METRICS.map((m) => (
            <button key={m.key} onClick={() => setMetric(m.key)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${metric === m.key ? "text-white" : "text-readable-faint border-white/10 hover:bg-white/[0.05]"}`}
              style={metric === m.key ? { background: `${m.color}22`, borderColor: `${m.color}55` } : undefined}>
              {m.label}
            </button>
          ))}
        </div>
        <TrendChart key={metric} data={aSeries} color={active.color} unit={active.unit} showAvg={smooth} annotations={showNotes ? annotations : []} />
        <motion.p key={metric + "cap"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-xs text-readable-faint mt-3 border-l-2 pl-3" style={{ borderColor: `${active.color}66` }}>
          {metricCaption()}
        </motion.p>
      </motion.div>

      {/* Insight cards */}
      <motion.div variants={fadeUp}>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Sparkles size={15} className="text-amber-400" /> What the data says</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {insights.map((ins, i) => {
            const Icon = ins.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="glass rounded-xl border border-white/8 p-4 flex gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ins.color}1f`, border: `1px solid ${ins.color}40` }}>
                  <Icon size={15} style={{ color: ins.color }} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white mb-0.5">{ins.title}</div>
                  <div className="text-xs text-readable-soft leading-relaxed">{ins.text}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Goal projection */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Target size={15} className="text-emerald-400" /> Goal projection</h2>
          <label className="flex items-center gap-2 text-xs text-readable-faint">
            Target
            <input type="number" value={goal} onChange={(e) => setGoal(Number(e.target.value) || 0)}
              className="w-20 rounded-lg bg-white/[0.05] border border-white/10 px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500/40" />
            lb
          </label>
        </div>
        <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden mb-2">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-500/70 to-emerald-400"
            initial={{ width: 0 }} animate={{ width: `${goalProgress}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
        </div>
        <div className="flex justify-between text-[10px] text-readable-faint mb-3">
          <span>{stats.startW.toFixed(0)} lb start</span>
          <span className="text-emerald-300">{goalProgress.toFixed(0)}% there</span>
          <span>{goal} lb goal</span>
        </div>
        <p className="text-sm text-readable-soft leading-relaxed">{projText}</p>
      </motion.div>

      {/* Cumulative loss + weekly velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Cumulative lbs lost</h2>
          <p className="text-xs text-readable-faint mb-3">Total pounds gone since day one — every step of progress added up.</p>
          <TrendChart data={cumulative} color="#34d399" unit="lb" height={220} />
        </motion.div>
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Weekly velocity</h2>
          <p className="text-xs text-readable-faint mb-3">Change each week — green weeks down, red weeks up.</p>
          <BarChart data={weekly} unit="lb" decimals={1} height={220} />
        </motion.div>
      </div>

      {/* Recomposition */}
      {recomp.length > 1 && (
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Body recomposition</h2>
          <p className="text-xs text-readable-faint mb-3">How your fat mass and lean mass each changed as the weight came off (scale bioimpedance estimate).</p>
          <StackedAreaChart data={recomp} labelA="Lean mass" labelB="Fat mass" colorA="#a78bfa" colorB="#f59e0b" unit="lb" />
        </motion.div>
      )}

      {/* Monthly + BMI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Monthly change</h2>
          <p className="text-xs text-readable-faint mb-3">Green = lost weight that month, red = gained.</p>
          <BarChart data={monthly} unit="lb" decimals={1} />
        </motion.div>
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><GaugeIcon size={15} className="text-emerald-400" /> BMI</h2>
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
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><CalendarDays size={15} className="text-cyan-400" /> All metrics at a glance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {METRICS.map((m) => {
            const s = series(m.key);
            if (s.length < 2) return null;
            const diff = s[s.length - 1].value - s[0].value;
            const good = (m.goodDown && diff <= 0) || (!m.goodDown && diff >= 0);
            const dec = m.unit === "%" || m.key === "bmi" ? 1 : 0;
            return (
              <button key={m.key} onClick={() => setMetric(m.key)} className="text-left rounded-xl bg-white/[0.03] border border-white/5 p-3 hover:border-white/15 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-readable-soft">{m.label}</span>
                  <span className="text-[10px]" style={{ color: good ? "#34d399" : "#f87171" }}>{diff > 0 ? "+" : ""}{diff.toFixed(dec)}</span>
                </div>
                <Sparkline values={s.map((p) => p.value)} color={m.color} width={160} height={34} />
                <div className="text-sm font-semibold text-white mt-1">{s[s.length - 1].value.toFixed(dec)}<span className="text-[10px] text-readable-faint"> {m.unit}</span></div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
