"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Database, ShieldCheck, Activity, Scale, Footprints, Moon, Droplet,
  Dumbbell, Apple, Clock, CalendarRange, Layers, Copy, Crosshair,
  CircleCheck, CircleAlert, HeartPulse,
} from "lucide-react";
import {
  KpiGrid, Narrative, EmptyState, Pill, ConfidenceBadge, fadeUp,
  type Kpi,
} from "@/components/health/ui";
import {
  daysBetween, baseline, robustZ, confidence,
  type Confidence,
} from "@/lib/health/stats";
import type {
  WeightRow, StepRow, SleepRow, BloodRow,
  WorkoutRow, StrengthRow, NutritionRow, VitalsRow,
} from "@/lib/health/types";

const TODAY = new Date().toISOString().slice(0, 10);

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });

function sinceLabel(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

type Coverage = {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  count: number;
  firstDate: string | null;
  lastDate: string | null;
  spanDays: number;
  daysWithData: number;
  coveragePct: number;
  daysSinceLast: number | null;
  duplicateDays: number;
};

// Coverage % → semantic color (emerald >=80, amber 50–80, red <50).
function covColor(pct: number): string {
  if (pct >= 80) return "#34d399";
  if (pct >= 50) return "#f59e0b";
  return "#f87171";
}

function buildCoverage(
  key: string,
  label: string,
  icon: React.ElementType,
  color: string,
  dates: string[],
): Coverage {
  const clean = dates.filter((d): d is string => Boolean(d)).map((d) => d.slice(0, 10));
  const count = clean.length;
  const byDay = new Map<string, number>();
  for (const d of clean) byDay.set(d, (byDay.get(d) ?? 0) + 1);
  const distinct = [...byDay.keys()].sort();
  const daysWithData = distinct.length;
  const duplicateDays = [...byDay.values()].filter((n) => n > 1).length;

  if (daysWithData === 0) {
    return {
      key, label, icon, color, count,
      firstDate: null, lastDate: null, spanDays: 0,
      daysWithData: 0, coveragePct: 0, daysSinceLast: null, duplicateDays: 0,
    };
  }

  const firstDate = distinct[0];
  const lastDate = distinct[distinct.length - 1];
  const spanDays = daysBetween(firstDate, lastDate) + 1;
  const coveragePct = Math.min(100, (daysWithData / spanDays) * 100);
  const daysSinceLast = Math.max(0, daysBetween(lastDate, TODAY));

  return {
    key, label, icon, color, count, firstDate, lastDate, spanDays,
    daysWithData, coveragePct, daysSinceLast, duplicateDays,
  };
}

// Robust-z>3 outlier count over a daily value series.
function outlierCount(values: number[]): number {
  if (values.length < 4) return 0;
  const base = baseline(values);
  if (base.scale <= 1e-9) return 0;
  return values.reduce(
    (n, v) => (Math.abs(robustZ(v, base.center, base.scale)) > 3 ? n + 1 : n),
    0,
  );
}

export default function DataQualityView({
  weight, steps, sleep, blood, workouts, strength, nutrition, vitals,
}: {
  weight: WeightRow[];
  steps: StepRow[];
  sleep: SleepRow[];
  blood: BloodRow[];
  workouts: WorkoutRow[];
  strength: StrengthRow[];
  nutrition: NutritionRow[];
  vitals: VitalsRow[];
}) {
  const sources = useMemo<Coverage[]>(() => [
    buildCoverage("weight", "Body composition", Scale, "#22d3ee", weight.map((r) => r.measured_on)),
    buildCoverage("steps", "Steps", Footprints, "#34d399", steps.map((r) => r.measured_on)),
    buildCoverage("vitals", "Heart (RHR/HRV)", HeartPulse, "#fb7185", vitals.map((r) => r.measured_on)),
    buildCoverage("sleep", "Sleep", Moon, "#a78bfa", sleep.map((r) => r.measured_on)),
    buildCoverage("blood", "Blood panels", Droplet, "#f87171", blood.map((r) => r.drawn_on)),
    buildCoverage("workouts", "Workouts", Activity, "#fb923c", workouts.map((r) => (r.started_at ? r.started_at.slice(0, 10) : ""))),
    buildCoverage("strength", "Strength", Dumbbell, "#60a5fa", strength.map((r) => r.performed_on)),
    buildCoverage("nutrition", "Nutrition", Apple, "#2dd4bf", nutrition.map((r) => r.eaten_on)),
  ], [weight, steps, vitals, sleep, blood, workouts, strength, nutrition]);

  const active = useMemo(() => sources.filter((s) => s.count > 0), [sources]);

  const summary = useMemo(() => {
    const totalObs = sources.reduce((s, c) => s + c.count, 0);
    const withFresh = active.filter((s) => s.daysSinceLast != null);
    const freshest = withFresh.length
      ? withFresh.reduce((a, b) => (b.daysSinceLast! < a.daysSinceLast! ? b : a))
      : null;
    const stalest = withFresh.length
      ? withFresh.reduce((a, b) => (b.daysSinceLast! > a.daysSinceLast! ? b : a))
      : null;
    return { totalObs, freshest, stalest };
  }, [sources, active]);

  // Honest caveats derived from the data.
  const caveats = useMemo(() => {
    const out: { color: string; tag: string; text: string }[] = [];

    const bloodDays = new Set(blood.map((r) => r.drawn_on.slice(0, 10)));
    if (blood.length > 0 && bloodDays.size === 1) {
      const day = [...bloodDays][0];
      out.push({
        color: "#f87171", tag: "Blood",
        text: `Single blood panel (${blood.length} marker${blood.length === 1 ? "" : "s"} on ${fmtDate(day)}) — no trend possible yet.`,
      });
    }

    const sleepCov = sources.find((s) => s.key === "sleep");
    const nights = sleepCov ? sleepCov.count : 0;
    if (nights > 0 && nights < 14) {
      out.push({
        color: "#a78bfa", tag: "Sleep",
        text: `Only ${nights} night${nights === 1 ? "" : "s"} logged — too sparse for a 28-day baseline.`,
      });
    }

    return out;
  }, [blood, sources]);

  // Data-quality checks: duplicates + simple outliers for steps & weight.
  const checks = useMemo(() => {
    const dupTotal = sources.reduce((s, c) => s + c.duplicateDays, 0);
    const dupSources = sources.filter((c) => c.duplicateDays > 0);
    const stepOutliers = outlierCount(steps.map((r) => Number(r.steps)).filter(Number.isFinite));
    const weightOutliers = outlierCount(weight.map((r) => Number(r.weight_lbs)).filter(Number.isFinite));
    return { dupTotal, dupSources, stepOutliers, weightOutliers };
  }, [sources, steps, weight]);

  if (active.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title="No data to audit yet"
        text="Once any source — weight, steps, sleep, blood, workouts, strength or nutrition — has rows, this view reports its coverage, freshness and quality."
      />
    );
  }

  const kpis: Kpi[] = [
    { icon: Layers, color: "#22d3ee", label: "Total observations", value: summary.totalObs, sub: `across ${active.length} source${active.length === 1 ? "" : "s"}` },
    { icon: Database, color: "#34d399", label: "Sources with data", value: active.length, sub: `of ${sources.length} tracked` },
    {
      icon: Clock, color: "#a78bfa", label: "Freshest source",
      value: summary.freshest ? summary.freshest.daysSinceLast ?? 0 : 0,
      animate: false,
      suffix: summary.freshest && (summary.freshest.daysSinceLast ?? 0) === 1 ? " day" : " days",
      sub: summary.freshest ? `${summary.freshest.label} · ${sinceLabel(summary.freshest.daysSinceLast ?? 0)}` : "—",
    },
    {
      icon: CalendarRange, color: "#fb923c", label: "Stalest source",
      value: summary.stalest ? summary.stalest.daysSinceLast ?? 0 : 0,
      animate: false,
      suffix: summary.stalest && (summary.stalest.daysSinceLast ?? 0) === 1 ? " day" : " days",
      sub: summary.stalest ? `${summary.stalest.label} · ${sinceLabel(summary.stalest.daysSinceLast ?? 0)}` : "—",
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-6"
    >
      <Narrative icon={ShieldCheck} accent="#34d399" title="Data honesty check">
        {summary.freshest && summary.stalest ? (
          <>
            You&apos;re tracking <span className="text-white font-medium">{active.length}</span> of{" "}
            {sources.length} sources, <span className="text-emerald-300 font-medium">{summary.totalObs.toLocaleString()}</span> observations in total.
            Your freshest signal is <span className="text-white font-medium">{summary.freshest.label.toLowerCase()}</span>{" "}
            ({sinceLabel(summary.freshest.daysSinceLast ?? 0)}); the stalest is{" "}
            <span className="text-amber-300 font-medium">{summary.stalest.label.toLowerCase()}</span>{" "}
            ({sinceLabel(summary.stalest.daysSinceLast ?? 0)}). Numbers elsewhere in this dashboard are only as trustworthy as the coverage below — sparse or stale series are flagged honestly, not smoothed over.
          </>
        ) : (
          <>You&apos;re tracking {active.length} source{active.length === 1 ? "" : "s"} with {summary.totalObs.toLocaleString()} observations. Coverage and freshness for each are detailed below.</>
        )}
      </Narrative>

      <KpiGrid kpis={kpis} />

      {/* Coverage table */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Database size={15} style={{ color: "#22d3ee" }} /> Coverage by source
        </h2>
        <p className="text-xs text-readable-faint mb-4">
          Distinct days with data vs the calendar span they cover. Coverage colours: emerald ≥80%, amber 50–80%, red &lt;50%.
        </p>
        <div className="space-y-3">
          {active.map((c) => {
            const Icon = c.icon;
            const bar = covColor(c.coveragePct);
            const conf: Confidence = confidence(c.daysWithData, c.coveragePct / 100);
            const stale = (c.daysSinceLast ?? 0) > 30;
            return (
              <div key={c.key} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Icon size={15} style={{ color: c.color }} />
                  <span className="text-sm font-medium text-white">{c.label}</span>
                  <ConfidenceBadge level={conf} />
                  <span className="ml-auto text-xs text-readable-faint">
                    {c.count.toLocaleString()} obs · {c.daysWithData.toLocaleString()} day{c.daysWithData === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <div className="h-2.5 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: bar }}
                      initial={{ width: 0 }}
                      animate={{ width: `${c.coveragePct}%` }}
                      transition={{ duration: 1.1, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-12 text-right" style={{ color: bar }}>
                    {c.coveragePct.toFixed(0)}%
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-[11px] text-readable-faint flex-wrap">
                  <span className="flex items-center gap-1">
                    <CalendarRange size={12} className="text-readable-faint" />
                    {c.firstDate && c.lastDate
                      ? c.firstDate === c.lastDate
                        ? fmtDate(c.firstDate)
                        : `${fmtDate(c.firstDate)} – ${fmtDate(c.lastDate)} · ${c.spanDays.toLocaleString()}d span`
                      : "—"}
                  </span>
                  <span className="flex items-center gap-1" style={{ color: stale ? "#f59e0b" : undefined }}>
                    <Clock size={12} />
                    last sync {sinceLabel(c.daysSinceLast ?? 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Caveats */}
      {caveats.length > 0 && (
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <Crosshair size={15} style={{ color: "#f59e0b" }} /> Read with care
          </h2>
          <p className="text-xs text-readable-faint mb-4">Where the data is too thin to draw conclusions — stated plainly.</p>
          <div className="space-y-2.5">
            {caveats.map((cv, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/5 p-3">
                <div className="mt-0.5"><Pill color={cv.color}>{cv.tag}</Pill></div>
                <p className="text-xs text-readable-soft leading-relaxed">{cv.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Data-quality checks */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <ShieldCheck size={15} style={{ color: "#34d399" }} /> Integrity checks
        </h2>
        <p className="text-xs text-readable-faint mb-4">Duplicate dates and robust outliers (|z| &gt; 3) — surfaced, never silently dropped.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Check
            icon={Copy}
            ok={checks.dupTotal === 0}
            title="Duplicate dates"
            text={
              checks.dupTotal === 0
                ? "No source has more than one row on the same date."
                : `${checks.dupTotal} duplicated day${checks.dupTotal === 1 ? "" : "s"} across ${checks.dupSources.map((s) => s.label.toLowerCase()).join(", ")}.`
            }
          />
          <Check
            icon={Footprints}
            ok={checks.stepOutliers === 0}
            title="Step outliers"
            text={
              steps.length < 4
                ? "Not enough step data to assess outliers."
                : checks.stepOutliers === 0
                ? "No step readings sit beyond 3 robust σ of the median."
                : `${checks.stepOutliers} step day${checks.stepOutliers === 1 ? "" : "s"} beyond 3σ — likely real big days, but worth a glance.`
            }
          />
          <Check
            icon={Scale}
            ok={checks.weightOutliers === 0}
            title="Weight outliers"
            text={
              weight.length < 4
                ? "Not enough weigh-ins to assess outliers."
                : checks.weightOutliers === 0
                ? "No weigh-ins sit beyond 3 robust σ of the median."
                : `${checks.weightOutliers} weigh-in${checks.weightOutliers === 1 ? "" : "s"} beyond 3σ — possible mis-entries or off-scale readings.`
            }
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function Check({
  icon: Icon, ok, title, text,
}: {
  icon: React.ElementType;
  ok: boolean;
  title: string;
  text: string;
}) {
  const color = ok ? "#34d399" : "#f59e0b";
  const Badge = ok ? CircleCheck : CircleAlert;
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <span className="text-xs font-semibold text-white">{title}</span>
        <Badge size={14} style={{ color }} className="ml-auto" />
      </div>
      <p className="text-[11px] text-readable-soft leading-relaxed">{text}</p>
    </div>
  );
}
