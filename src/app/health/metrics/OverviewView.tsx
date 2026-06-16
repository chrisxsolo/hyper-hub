"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity, Scale, Footprints, HeartPulse, Moon, FlaskConical, Dumbbell,
  UtensilsCrossed, Sparkles, ShieldCheck, AlertTriangle, TrendingUp, TrendingDown,
  Minus, Gauge as GaugeIcon, Radar,
} from "lucide-react";
import { fadeUp, SectionCard, Narrative, Pill, ConfidenceBadge } from "@/components/health/ui";
import type {
  WeightRow, StepRow, WorkoutRow, SleepRow, BloodRow, StrengthRow, NutritionRow,
} from "@/lib/health/types";
import {
  analyzeDeviation, mean, type DeviationReport, type DeviationLevel, MI_PER_KM,
} from "@/lib/health/stats";

const fmtDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

// One reading per calendar date (mean if several), chronologically sorted.
function dailySeries<T>(rows: T[], dateOf: (r: T) => string | null, valueOf: (r: T) => number | null) {
  const byDate = new Map<string, number[]>();
  for (const r of rows) {
    const d = dateOf(r);
    const v = valueOf(r);
    if (!d || v == null || !Number.isFinite(v)) continue;
    const key = d.slice(0, 10);
    (byDate.get(key) ?? byDate.set(key, []).get(key)!).push(v);
  }
  return [...byDate.entries()]
    .map(([date, vs]) => ({ date, value: mean(vs) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

const LEVEL_COLOR: Record<DeviationLevel, string> = {
  normal: "#64748b", mild: "#60a5fa", moderate: "#f59e0b", high: "#f87171",
};

type SignalDef = {
  key: string; label: string; unit: string; dec: number; icon: React.ElementType; goodDown: boolean;
};

export default function OverviewView({
  weight, steps, workouts, sleep, blood, strength, nutrition,
}: {
  weight: WeightRow[];
  steps: StepRow[];
  workouts: WorkoutRow[];
  sleep: SleepRow[];
  blood: BloodRow[];
  strength: StrengthRow[];
  nutrition: NutritionRow[];
}) {
  const signals = useMemo(() => {
    const defs: { def: SignalDef; series: { date: string; value: number }[] }[] = [
      { def: { key: "weight", label: "Weight", unit: "lb", dec: 1, icon: Scale, goodDown: true },
        series: dailySeries(weight, (r) => r.measured_on, (r) => Number(r.weight_lbs)) },
      { def: { key: "steps", label: "Steps", unit: "", dec: 0, icon: Footprints, goodDown: false },
        series: dailySeries(steps, (r) => r.measured_on, (r) => Number(r.steps)) },
      { def: { key: "rhr", label: "Resting HR", unit: "bpm", dec: 0, icon: HeartPulse, goodDown: true },
        series: dailySeries(sleep, (r) => r.measured_on, (r) => (r.resting_hr != null ? Number(r.resting_hr) : null)) },
      { def: { key: "hrv", label: "HRV", unit: "ms", dec: 0, icon: Activity, goodDown: false },
        series: dailySeries(sleep, (r) => r.measured_on, (r) => (r.hrv_ms != null ? Number(r.hrv_ms) : null)) },
      { def: { key: "sleep", label: "Sleep", unit: "hrs", dec: 1, icon: Moon, goodDown: false },
        series: dailySeries(sleep, (r) => r.measured_on, (r) => Number(r.total_hours)) },
    ];
    return defs
      .map(({ def, series }) => ({ def, series, report: analyzeDeviation(series) }))
      .filter((s): s is { def: SignalDef; series: { date: string; value: number }[]; report: DeviationReport } => s.report != null);
  }, [weight, steps, sleep]);

  const sustainedCount = signals.filter((s) => s.report.sustained).length;

  // ── Unified timeline (recent events across every source) ───────────────────
  const timeline = useMemo(() => {
    type Ev = { date: string; icon: React.ElementType; color: string; label: string; detail: string };
    const evs: Ev[] = [];
    for (const w of weight) evs.push({ date: w.measured_on, icon: Scale, color: "#60a5fa", label: "Weigh-in", detail: `${Number(w.weight_lbs).toFixed(1)} lb${w.body_fat_pct != null ? ` · ${Number(w.body_fat_pct).toFixed(1)}% bf` : ""}` });
    for (const r of workouts) {
      if (!r.started_at) continue;
      const isRun = (r.workout_type ?? "").toLowerCase().includes("run");
      const mi = r.distance_km != null ? Number(r.distance_km) * MI_PER_KM : 0;
      evs.push({ date: r.started_at.slice(0, 10), icon: Activity, color: isRun ? "#fb923c" : "#34d399", label: r.workout_type ?? "Workout", detail: `${mi.toFixed(1)} mi · ${r.duration_min ?? "?"} min${r.avg_hr != null ? ` · ${r.avg_hr} bpm` : ""}` });
    }
    for (const s of sleep) evs.push({ date: s.measured_on, icon: Moon, color: "#a78bfa", label: "Sleep", detail: `${Number(s.total_hours).toFixed(1)} hrs${s.sleep_score != null ? ` · score ${s.sleep_score}` : ""}` });
    for (const b of blood) evs.push({ date: b.drawn_on, icon: FlaskConical, color: "#22d3ee", label: "Blood panel", detail: `${b.marker} ${b.value}${b.unit ? ` ${b.unit}` : ""}` });
    for (const st of strength) evs.push({ date: st.performed_on, icon: Dumbbell, color: "#f472b6", label: st.exercise, detail: `${st.sets}×${st.reps ?? "?"}${st.weight_lbs != null ? ` @ ${Number(st.weight_lbs)} lb` : ""}` });
    for (const n of nutrition) evs.push({ date: n.eaten_on, icon: UtensilsCrossed, color: "#2dd4bf", label: "Nutrition", detail: `${n.calories ?? "?"} kcal${n.protein_g != null ? ` · ${Number(n.protein_g)}g P` : ""}` });

    // collapse blood panel: keep only one summary event per draw date
    const bloodDates = new Map<string, number>();
    for (const b of blood) bloodDates.set(b.drawn_on, (bloodDates.get(b.drawn_on) ?? 0) + 1);
    const filtered = evs.filter((e) => e.label !== "Blood panel");
    for (const [date, n] of bloodDates) filtered.push({ date, icon: FlaskConical, color: "#22d3ee", label: "Blood panel", detail: `${n} markers drawn` });

    return filtered.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 22);
  }, [weight, workouts, sleep, blood, strength, nutrition]);

  if (signals.length === 0) {
    return (
      <Narrative icon={Radar} accent="#22d3ee" title="Baseline engine warming up">
        Not enough longitudinal data yet to compute personal baselines. Keep logging weight, steps and sleep — once there are a few weeks of readings, this view will flag what&apos;s genuinely unusual for you (and stay quiet otherwise).
      </Narrative>
    );
  }

  const totalObs = weight.length + steps.length + workouts.length + sleep.length + blood.length + strength.length + nutrition.length;

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="space-y-6">
      <Narrative icon={Sparkles} accent="#22d3ee" title="Today's read">
        Tracking <span className="text-white font-medium">{signals.length} baselines</span> across{" "}
        <span className="text-white font-medium">{totalObs.toLocaleString()} observations</span>.{" "}
        {sustainedCount === 0
          ? "Every metric is sitting inside its personal normal range — no sustained deviations. A quiet dashboard is a healthy one."
          : `${sustainedCount} metric${sustainedCount > 1 ? "s have" : " has"} a sustained deviation worth a look below.`}{" "}
        Baselines use a 28-day rolling <span className="text-cyan-300">median ± MAD</span>, and a flag only fires after a deviation persists — one odd reading never trips an alert.
      </Narrative>

      {/* Signal cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {signals.map(({ def, report }) => <SignalCard key={def.key} def={def} report={report} />)}
      </motion.div>

      {/* Per-variable baseline table */}
      <SectionCard title="Baseline & deviation table" subtitle="7-day average vs your 28-day personal normal range, with standardized deviation and data confidence." icon={GaugeIcon} iconColor="#a78bfa">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs min-w-[560px]">
            <thead>
              <tr className="text-readable-faint text-left border-b border-white/8">
                <th className="font-medium py-2 pl-2 pr-3">Metric</th>
                <th className="font-medium py-2 px-3">7-day avg</th>
                <th className="font-medium py-2 px-3">Normal range</th>
                <th className="font-medium py-2 px-3">Deviation</th>
                <th className="font-medium py-2 px-3">Δ vs base</th>
                <th className="font-medium py-2 px-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {signals.map(({ def, series, report }) => {
                const last7 = series.slice(-7).map((p) => p.value);
                const avg7 = mean(last7);
                const TrendIcon = report.direction === "up" ? TrendingUp : report.direction === "down" ? TrendingDown : Minus;
                return (
                  <tr key={def.key} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 pl-2 pr-3 text-white font-medium whitespace-nowrap"><def.icon size={13} className="inline mr-1.5 -mt-0.5" style={{ color: LEVEL_COLOR[report.level] }} />{def.label}</td>
                    <td className="py-2.5 px-3 text-readable-soft tabular-nums">{avg7.toLocaleString(undefined, { maximumFractionDigits: def.dec })}{def.unit && ` ${def.unit}`}</td>
                    <td className="py-2.5 px-3 text-readable-faint tabular-nums">{report.baseline.lo.toFixed(def.dec)}–{report.baseline.hi.toFixed(def.dec)}</td>
                    <td className="py-2.5 px-3"><span style={{ color: LEVEL_COLOR[report.level] }} className="font-medium capitalize">{report.level}</span> <span className="text-readable-faint">({report.z >= 0 ? "+" : ""}{report.z.toFixed(1)}σ)</span></td>
                    <td className="py-2.5 px-3"><TrendIcon size={13} className="inline -mt-0.5 mr-1 text-readable-faint" /><span className="text-readable-faint">{report.pctChange >= 0 ? "+" : ""}{report.pctChange.toFixed(1)}%</span></td>
                    <td className="py-2.5 px-3"><ConfidenceBadge level={report.confidence} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Unified timeline */}
      <SectionCard title="Unified timeline" subtitle="Every logged event across weight, runs, sleep, blood, lifting and food — most recent first." icon={Activity} iconColor="#34d399">
        <div className="relative pl-4">
          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-white/8" />
          <div className="space-y-3">
            {timeline.map((e, i) => {
              const Icon = e.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.02, 0.4) }} className="relative flex items-center gap-3">
                  <span className="absolute -left-4 w-3.5 h-3.5 rounded-full border-2 border-[#0d0d0f]" style={{ background: e.color }} />
                  <span className="text-readable-faint w-16 shrink-0 font-mono text-[11px] ml-1">{fmtDay(e.date)}</span>
                  <Icon size={13} style={{ color: e.color }} className="shrink-0" />
                  <span className="text-white text-xs font-medium shrink-0">{e.label}</span>
                  <span className="text-readable-faint text-[11px] truncate">{e.detail}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );
}

function SignalCard({ def, report }: { def: SignalDef; report: DeviationReport }) {
  const color = LEVEL_COLOR[report.level];
  const bad = (def.goodDown && report.direction === "up") || (!def.goodDown && report.direction === "down");
  const Icon = def.icon;

  let interpretation: string;
  if (!report.sustained) {
    interpretation = report.level === "normal"
      ? "Within your normal range. Nothing to flag."
      : `A ${report.level} reading, but it's only persisted ${report.consecutive} day${report.consecutive === 1 ? "" : "s"} — monitor, not yet a sustained change.`;
  } else {
    interpretation = bad
      ? `${cap(report.level)} and sustained over ${report.consecutive} readings — worth attention.`
      : `${cap(report.level)} and sustained over ${report.consecutive} readings — a real, favorable shift.`;
  }

  const StatusIcon = report.sustained ? AlertTriangle : ShieldCheck;
  const statusColor = report.sustained ? (bad ? "#f87171" : "#34d399") : "#64748b";

  return (
    <motion.div variants={fadeUp} className="glass rounded-2xl border p-4" style={{ borderColor: report.sustained ? `${statusColor}40` : "rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-white"><Icon size={15} style={{ color }} /> {def.label}</span>
        <StatusIcon size={15} style={{ color: statusColor }} />
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold text-white tabular-nums">{report.current.toLocaleString(undefined, { maximumFractionDigits: def.dec })}</span>
        <span className="text-xs text-readable-faint">{def.unit}</span>
        <span className="ml-auto text-[11px] text-readable-faint">normal {report.baseline.lo.toFixed(def.dec)}–{report.baseline.hi.toFixed(def.dec)}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Pill color={color}>{report.level} · {report.z >= 0 ? "+" : ""}{report.z.toFixed(1)}σ</Pill>
        {report.sustained && <Pill color={statusColor}>{report.consecutive}-day {report.direction}</Pill>}
        <ConfidenceBadge level={report.confidence} />
      </div>
      <p className="text-xs text-readable-soft leading-relaxed">{interpretation}</p>
    </motion.div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
