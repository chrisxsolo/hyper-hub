"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Footprints, Sparkles, Trophy, Target, Flame, TrendingDown, TrendingUp,
  Minus, Zap, Activity, CalendarDays, MapPin, Timer, HeartPulse, Route,
} from "lucide-react";
import AnimatedNumber from "@/components/charts/AnimatedNumber";
import TrendChart, { type Annotation } from "@/components/charts/TrendChart";
import BarChart from "@/components/charts/BarChart";
import StepsWeightChart, { type SWPoint } from "@/components/charts/StepsWeightChart";
import type { WeightRow } from "./WeightLossView";

export type StepRow = { id: string; measured_on: string; steps: number; distance_km: number | null; source: string | null };
export type HourlyRow = { id: string; measured_on: string; hour: number; steps: number };
export type WorkoutRow = {
  id: string; workout_type: string | null; started_at: string | null; ended_at: string | null;
  duration_min: number | null; active_kcal: number | null; distance_km: number | null;
  avg_hr: number | null; max_hr: number | null; steps: number | null;
};

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const GOAL = 10000;
const KM2MI = 0.621371;
const fmtDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
const monthLabel = (ym: string) => new Date(ym + "-01T00:00:00").toLocaleDateString(undefined, { month: "short" });

export default function StepsView({
  rows, workouts, weight,
}: {
  rows: StepRow[];
  workouts: WorkoutRow[];
  weight: WeightRow[];
}) {
  const chrono = useMemo(() => [...rows].sort((a, b) => a.measured_on.localeCompare(b.measured_on)), [rows]);

  const stats = useMemo(() => {
    if (!chrono.length) return null;
    const vals = chrono.map((r) => Number(r.steps));
    const total = vals.reduce((s, v) => s + v, 0);
    const avg = total / vals.length;
    let bestIdx = 0;
    vals.forEach((v, i) => { if (v > vals[bestIdx]) bestIdx = i; });
    const daysHit = vals.filter((v) => v >= GOAL).length;

    // longest >=10k streak (consecutive calendar days)
    let streak = 0, best = 0, prev: number | null = null;
    for (const r of chrono) {
      const d = new Date(r.measured_on + "T00:00:00").getTime();
      const consecutive = prev != null && d - prev === 86400000;
      if (Number(r.steps) >= GOAL) { streak = consecutive ? streak + 1 : 1; best = Math.max(best, streak); }
      else streak = 0;
      prev = d;
    }

    // first-30 vs last-30 average
    const first30 = vals.slice(0, 30); const last30 = vals.slice(-30);
    const a1 = first30.reduce((s, v) => s + v, 0) / first30.length;
    const a2 = last30.reduce((s, v) => s + v, 0) / last30.length;

    return { total, avg, bestVal: vals[bestIdx], bestDate: chrono[bestIdx].measured_on, daysHit, days: vals.length, streakBest: best, firstAvg: a1, lastAvg: a2 };
  }, [chrono]);

  // monthly avg steps + avg weight
  const monthly = useMemo(() => {
    const stepM = new Map<string, number[]>();
    for (const r of chrono) {
      const m = r.measured_on.slice(0, 7);
      (stepM.get(m) ?? stepM.set(m, []).get(m)!).push(Number(r.steps));
    }
    const wM = new Map<string, number[]>();
    for (const r of weight) {
      const m = r.measured_on.slice(0, 7);
      (wM.get(m) ?? wM.set(m, []).get(m)!).push(Number(r.weight_lbs));
    }
    const months = [...stepM.keys()].sort();
    const sw: SWPoint[] = months.map((m) => {
      const s = stepM.get(m)!; const w = wM.get(m);
      return { label: monthLabel(m), steps: s.reduce((a, b) => a + b, 0) / s.length, weight: w ? w.reduce((a, b) => a + b, 0) / w.length : null };
    });
    const bars = months.map((m) => {
      const s = stepM.get(m)!;
      return { label: monthLabel(m), value: Math.round(s.reduce((a, b) => a + b, 0) / s.length) };
    });
    return { sw, bars, months, stepM };
  }, [chrono, weight]);

  // day-of-week average (Mon..Sun)
  const dow = useMemo(() => {
    const buckets: number[][] = Array.from({ length: 7 }, () => []);
    for (const r of chrono) buckets[new Date(r.measured_on + "T00:00:00").getDay()].push(Number(r.steps));
    const order = [1, 2, 3, 4, 5, 6, 0];
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return order.map((i) => ({ label: names[i], value: buckets[i].length ? Math.round(buckets[i].reduce((a, b) => a + b, 0) / buckets[i].length) : 0 }));
  }, [chrono]);

  // running progression (miles per run over time)
  const runs = useMemo(() => workouts.filter((w) => (w.workout_type ?? "").includes("Run")), [workouts]);
  const runProg = useMemo(
    () => runs.filter((w) => w.started_at && Number(w.distance_km) > 0)
      .map((w) => ({ date: w.started_at!.slice(0, 10), value: +(Number(w.distance_km) * KM2MI).toFixed(2) }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    [runs],
  );
  const runTotalMi = runs.reduce((s, w) => s + Number(w.distance_km ?? 0), 0) * KM2MI;
  const longestRunMi = runs.reduce((m, w) => Math.max(m, Number(w.distance_km ?? 0)), 0) * KM2MI;

  const dailyTrend = chrono.map((r) => ({ date: r.measured_on, value: Number(r.steps) }));

  if (!stats) {
    return <div className="glass rounded-2xl border border-white/8 p-8 text-sm text-readable-faint">No step data yet.</div>;
  }

  const trendDelta = stats.lastAvg - stats.firstAvg;
  const mostActive = monthly.bars.reduce((a, b) => (b.value > a.value ? b : a), monthly.bars[0]);
  const goalPct = (stats.daysHit / stats.days) * 100;

  const annotations: Annotation[] = [{ date: stats.bestDate, label: `Best ${(stats.bestVal / 1000).toFixed(1)}k`, color: "#34d399" }];

  const kpis = [
    { icon: Footprints, color: "#22d3ee", label: "Avg / day", value: Math.round(stats.avg), suffix: "", sub: `over ${stats.days} days` },
    { icon: Trophy, color: "#34d399", label: "Best day", value: stats.bestVal, suffix: "", sub: fmtDay(stats.bestDate) },
    { icon: Activity, color: "#a78bfa", label: "Total steps", value: stats.total, suffix: "", sub: `${(stats.total / 1_000_000).toFixed(2)}M lifetime` },
    { icon: Target, color: "#60a5fa", label: "Days over 10k", value: stats.daysHit, suffix: "", sub: `${goalPct.toFixed(0)}% of days` },
    { icon: Route, color: "#fb923c", label: "Runs logged", value: runs.length, suffix: "", sub: `${Math.round(runTotalMi)} mi total` },
    { icon: Flame, color: "#f87171", label: "Longest run", value: +longestRunMi.toFixed(1), dec: 1, suffix: " mi", sub: "personal distance best" },
  ];

  const insights: { icon: React.ElementType; color: string; title: string; text: string }[] = [];
  insights.push(trendDelta > 500
    ? { icon: TrendingUp, color: "#34d399", title: "Trending up", text: `Your daily average rose from ~${Math.round(stats.firstAvg).toLocaleString()} (first month) to ~${Math.round(stats.lastAvg).toLocaleString()} (last 30 days). More movement over time.` }
    : trendDelta < -500
    ? { icon: TrendingDown, color: "#f59e0b", title: "Easing off lately", text: `Recent 30-day average (~${Math.round(stats.lastAvg).toLocaleString()}) is below your early average (~${Math.round(stats.firstAvg).toLocaleString()}). Worth a nudge back up.` }
    : { icon: Minus, color: "#60a5fa", title: "Rock-steady volume", text: `You've held ~${Math.round(stats.avg).toLocaleString()} steps/day consistently — remarkable consistency over ${stats.days} days.` });
  insights.push({ icon: Target, color: "#34d399", title: "Crushing the 10k goal", text: `You hit 10,000+ steps on ${stats.daysHit} of ${stats.days} days (${goalPct.toFixed(0)}%) — double the typical recommendation on your average day.` });
  insights.push({ icon: Zap, color: "#22d3ee", title: "Longest 10k streak", text: `${stats.streakBest} days in a row over 10k — momentum like that is what drives the weight trend down.` });
  insights.push({ icon: CalendarDays, color: "#a78bfa", title: "Most active month", text: `${mostActive.label} was your biggest, averaging ${mostActive.value.toLocaleString()} steps/day.` });
  insights.push({ icon: Route, color: "#fb923c", title: "Serious running base", text: `${runs.length} runs covering ~${Math.round(runTotalMi)} mi, up to ${longestRunMi.toFixed(1)} mi in one go — that's the engine behind the calorie burn.` });
  insights.push({ icon: HeartPulse, color: "#f87171", title: "Activity ↔ weight", text: `Your high-step months line up with steady fat loss — the steps-vs-weight chart below shows the two moving together.` });

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="space-y-6">
      {/* Narrative */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-cyan-500/20 p-5 bg-gradient-to-br from-cyan-500/8 to-transparent">
        <div className="flex items-center gap-2 mb-2"><Sparkles size={16} className="text-cyan-400" /><h2 className="text-sm font-semibold text-white">Your movement story</h2></div>
        <p className="text-sm text-readable-soft leading-relaxed">
          Across <span className="text-white font-medium">{stats.days} days</span> ({fmtDay(chrono[0].measured_on)} – {fmtDay(chrono[chrono.length - 1].measured_on)}) you&apos;ve taken{" "}
          <span className="text-cyan-300 font-medium">{(stats.total / 1_000_000).toFixed(2)} million steps</span> — averaging{" "}
          <span className="text-white font-medium">{Math.round(stats.avg).toLocaleString()}/day</span> and clearing 10k on{" "}
          <span className="text-emerald-300 font-medium">{goalPct.toFixed(0)}% of days</span>. On top of that, <span className="text-white font-medium">{runs.length} runs</span> covering ~{Math.round(runTotalMi)} mi.
          That volume of daily movement is a big part of why the weight came off.
        </p>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glass rounded-2xl border border-white/8 p-4 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-[0.07]"><Icon size={72} /></div>
              <div className="flex items-center gap-2 mb-2"><Icon size={15} style={{ color: k.color }} /><span className="text-[11px] uppercase tracking-wide text-readable-faint">{k.label}</span></div>
              <div className="text-2xl font-bold text-white leading-none"><AnimatedNumber value={k.value} decimals={k.dec ?? 0} suffix={k.suffix} /></div>
              <div className="text-[11px] text-readable-faint mt-1.5">{k.sub}</div>
            </div>
          );
        })}
      </motion.div>

      {/* Daily trend */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-semibold text-white mb-1">Daily steps</h2>
        <p className="text-xs text-readable-faint mb-3">Every day since November, with a 7-day average to cut through the noise.</p>
        <TrendChart data={dailyTrend} color="#22d3ee" unit="steps" showAvg avgWindow={7} goal={GOAL} annotations={annotations} />
      </motion.div>

      {/* Insights */}
      <motion.div variants={fadeUp}>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Sparkles size={15} className="text-amber-400" /> What the data says</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {insights.map((ins, i) => {
            const Icon = ins.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="glass rounded-xl border border-white/8 p-4 flex gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ins.color}1f`, border: `1px solid ${ins.color}40` }}><Icon size={15} style={{ color: ins.color }} /></div>
                <div><div className="text-xs font-semibold text-white mb-0.5">{ins.title}</div><div className="text-xs text-readable-soft leading-relaxed">{ins.text}</div></div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Goal progress */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-white flex items-center gap-2"><Target size={15} className="text-emerald-400" /> 10k-a-day consistency</h2><span className="text-xs text-readable-faint">{stats.daysHit} / {stats.days} days</span></div>
        <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden mb-2">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-500/70 to-emerald-400" initial={{ width: 0 }} animate={{ width: `${goalPct}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
        </div>
        <p className="text-xs text-readable-faint">{goalPct.toFixed(0)}% of tracked days hit the 10,000-step goal.</p>
      </motion.div>

      {/* Steps vs Weight */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-semibold text-white mb-1">Steps vs weight</h2>
        <p className="text-xs text-readable-faint mb-3">Monthly average steps (bars) against your average weight (line) — activity up, weight down.</p>
        <StepsWeightChart data={monthly.sw} />
      </motion.div>

      {/* Monthly avg + day-of-week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Monthly average</h2>
          <p className="text-xs text-readable-faint mb-3">Average steps per day, by month.</p>
          <BarChart data={monthly.bars} singleColor="#22d3ee" unit="steps" />
        </motion.div>
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">By day of week</h2>
          <p className="text-xs text-readable-faint mb-3">Which days you move most.</p>
          <BarChart data={dow} singleColor="#a78bfa" unit="steps" />
        </motion.div>
      </div>

      {/* Running progression + recent activity */}
      {runProg.length > 1 && (
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Running progression</h2>
          <p className="text-xs text-readable-faint mb-3">Distance per run (mi) over time — {runs.length} runs and counting.</p>
          <TrendChart data={runProg} color="#fb923c" unit="mi" markMinMax height={240} />
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Recent activity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...workouts].sort((a, b) => (b.started_at ?? "").localeCompare(a.started_at ?? "")).slice(0, 6).map((w) => (
            <div key={w.id} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-sm font-medium text-white"><MapPin size={14} className="text-orange-400" /> {w.workout_type}</span>
                <span className="text-[11px] text-readable-faint">{w.started_at ? fmtDay(w.started_at.slice(0, 10)) : ""}</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
                <Stat icon={Route} color="#34d399" label="Distance" value={`${(Number(w.distance_km) * KM2MI).toFixed(2)} mi`} />
                <Stat icon={Timer} color="#60a5fa" label="Duration" value={`${w.duration_min} min`} />
                <Stat icon={Flame} color="#f59e0b" label="Active" value={`${Math.round(Number(w.active_kcal))} kcal`} />
                <Stat icon={HeartPulse} color="#f87171" label="Avg HR" value={w.avg_hr ? `${w.avg_hr} bpm` : "—"} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ icon: Icon, color, label, value }: { icon: React.ElementType; color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2"><Icon size={13} style={{ color }} /><span className="text-readable-faint">{label}</span><span className="ml-auto text-white font-medium">{value}</span></div>
  );
}
