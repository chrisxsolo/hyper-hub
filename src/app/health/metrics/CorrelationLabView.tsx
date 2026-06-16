"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FlaskConical, ShieldAlert, GitCompareArrows, Activity, Crosshair, Moon,
  Footprints, Beaker, ClipboardList, CheckCircle2, CircleDot, Trash2, Link2,
} from "lucide-react";
import TrendChart from "@/components/charts/TrendChart";
import {
  pearson, laggedCorrelation, linreg, correlationStrength, isoWeek, movingAverage,
} from "@/lib/health/stats";
import {
  Field, AddCard, SectionCard, Narrative, EmptyState, Pill, inputCls, fadeUp,
} from "@/components/health/ui";
import type {
  WeightRow, StepRow, WorkoutRow, SleepRow, ExperimentRow,
} from "@/lib/health/types";

const KM2MI = 0.621371;
const today = () => new Date().toISOString().slice(0, 10);
const fmtDay = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

// ── correlation math helpers (build aligned series, never reimplement stats) ──

type Corr = {
  key: string;
  title: string;
  icon: React.ElementType;
  color: string;
  r: number;
  n: number;
  caption: string;
};

/** Direction phrasing for a signed r — purely descriptive, never causal. */
function direction(r: number): string {
  if (r > 0.05) return "move together";
  if (r < -0.05) return "move opposite";
  return "show no clear link";
}

/** |r|-keyed accent: emerald strong, amber moderate, faint weak. */
function strengthColor(r: number): string {
  const a = Math.abs(r);
  if (a >= 0.5) return "#34d399";
  if (a >= 0.3) return "#f59e0b";
  return "#64748b";
}

export default function CorrelationLabView({
  weight, steps, workouts, sleep, experiments, canEdit, saving, onAddExperiment, onDeleteExperiment,
}: {
  weight: WeightRow[];
  steps: StepRow[];
  workouts: WorkoutRow[];
  sleep: SleepRow[];
  experiments: ExperimentRow[];
  canEdit: boolean;
  saving: boolean;
  onAddExperiment: (p: Record<string, unknown>) => Promise<boolean>;
  onDeleteExperiment: (id: string) => void;
}) {
  // Daily series (sorted, numeric-coerced) for the lag explorer.
  const stepsDaily = useMemo(
    () =>
      [...steps]
        .map((r) => ({ date: r.measured_on.slice(0, 10), value: Number(r.steps) }))
        .filter((p) => Number.isFinite(p.value))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [steps],
  );
  const weightDaily = useMemo(
    () =>
      [...weight]
        .map((r) => ({ date: r.measured_on.slice(0, 10), value: Number(r.weight_lbs) }))
        .filter((p) => Number.isFinite(p.value))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [weight],
  );

  // Weekly aggregates aligned by ISO week.
  const correlations = useMemo<Corr[]>(() => {
    const out: Corr[] = [];

    // Build per-week buckets keyed by ISO week.
    const weeklyMean = (rows: { date: string; value: number }[]) => {
      const m = new Map<string, number[]>();
      for (const r of rows) {
        const k = isoWeek(r.date).key;
        (m.get(k) ?? m.set(k, []).get(k)!).push(r.value);
      }
      const o = new Map<string, number>();
      m.forEach((vals, k) => o.set(k, vals.reduce((s, v) => s + v, 0) / vals.length));
      return o;
    };
    const weeklySum = (rows: { date: string; value: number }[]) => {
      const m = new Map<string, number>();
      for (const r of rows) {
        const k = isoWeek(r.date).key;
        m.set(k, (m.get(k) ?? 0) + r.value);
      }
      return m;
    };

    const wWeight = weeklyMean(weightDaily);
    const wSteps = weeklyMean(stepsDaily);

    // 1) weekly avg steps vs weekly avg weight
    {
      const xs: number[] = []; const ys: number[] = [];
      wSteps.forEach((sv, k) => {
        const wv = wWeight.get(k);
        if (wv != null) { xs.push(sv); ys.push(wv); }
      });
      if (xs.length >= 3) {
        const r = pearson(xs, ys);
        out.push({
          key: "steps-weight",
          title: "Weekly steps vs weight",
          icon: Footprints,
          color: strengthColor(r),
          r,
          n: xs.length,
          caption: `Across ${xs.length} overlapping weeks, steps and weight ${direction(r)} — an observational pattern, not evidence one caused the other.`,
        });
      }
    }

    // 2) weekly running mileage vs weekly avg weight
    {
      const runDaily = workouts
        .filter((w) => (w.workout_type ?? "").includes("Run") && w.started_at && Number(w.distance_km) > 0)
        .map((w) => ({ date: w.started_at!.slice(0, 10), value: Number(w.distance_km) * KM2MI }))
        .filter((p) => Number.isFinite(p.value));
      const wMiles = weeklySum(runDaily);
      const xs: number[] = []; const ys: number[] = [];
      wMiles.forEach((mv, k) => {
        const wv = wWeight.get(k);
        if (wv != null) { xs.push(mv); ys.push(wv); }
      });
      if (xs.length >= 3) {
        const r = pearson(xs, ys);
        out.push({
          key: "miles-weight",
          title: "Weekly run mileage vs weight",
          icon: Activity,
          color: strengthColor(r),
          r,
          n: xs.length,
          caption: `Over ${xs.length} weeks with logged runs, weekly mileage and weight ${direction(r)}. Many other factors vary week to week — read this as a hint, not a cause.`,
        });
      }
    }

    // 3) sleep hours vs next-day resting HR (only if sleep has >=10 rows)
    if (sleep.length >= 10) {
      const sleepByDate = [...sleep]
        .map((s) => ({ date: s.measured_on.slice(0, 10), hours: Number(s.total_hours), rhr: s.resting_hr == null ? null : Number(s.resting_hr) }))
        .sort((a, b) => a.date.localeCompare(b.date));
      const rhrMap = new Map(sleepByDate.filter((s) => s.rhr != null).map((s) => [s.date, s.rhr as number]));
      const xs: number[] = []; const ys: number[] = [];
      for (const s of sleepByDate) {
        if (!Number.isFinite(s.hours)) continue;
        const next = new Date(new Date(s.date + "T00:00:00Z").getTime() + 86_400_000).toISOString().slice(0, 10);
        const rhr = rhrMap.get(next);
        if (rhr != null) { xs.push(s.hours); ys.push(rhr); }
      }
      if (xs.length >= 3) {
        const r = pearson(xs, ys);
        out.push({
          key: "sleep-rhr",
          title: "Sleep hours vs next-day resting HR",
          icon: Moon,
          color: strengthColor(r),
          r,
          n: xs.length,
          caption: `On ${xs.length} nights with a next-morning reading, sleep duration and resting heart rate ${direction(r)}. A single-person signal, easily confounded by stress or training.`,
        });
      }
    }

    return out;
  }, [weightDaily, stepsDaily, workouts, sleep]);

  // Lag explorer state.
  const [lag, setLag] = useState(7);
  const lagResult = useMemo(
    () => laggedCorrelation(stepsDaily, weightDaily, lag),
    [stepsDaily, weightDaily, lag],
  );

  // A small steps-vs-weight scatter-as-trend visual: weekly smoothed weight overlaid
  // with where it sits is overkill; instead show the regression fit strength readout.
  const fit = useMemo(() => {
    // align daily where both exist (same date) for an OLS readout
    const wMap = new Map(weightDaily.map((p) => [p.date, p.value]));
    const pts = stepsDaily
      .filter((p) => wMap.has(p.date))
      .map((p) => ({ x: p.value, y: wMap.get(p.date)! }));
    if (pts.length < 3) return null;
    return linreg(pts);
  }, [stepsDaily, weightDaily]);

  // Weekly-smoothed weight trend, purely illustrative context for the lab.
  const weightSmoothTrend = useMemo(() => {
    if (weightDaily.length < 7) return [];
    const vals = weightDaily.map((p) => p.value);
    const ma = movingAverage(vals, 7);
    return weightDaily
      .map((p, i) => (ma[i] == null ? null : { date: p.date, value: +ma[i]!.toFixed(1) }))
      .filter((x): x is { date: string; value: number } => x !== null);
  }, [weightDaily]);

  const hasAnyCorrelation = correlations.length > 0;

  // ── Experiment form state ──
  const [name, setName] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [metric, setMetric] = useState("");
  const [startedOn, setStartedOn] = useState(today());
  const [endedOn, setEndedOn] = useState("");
  const [status, setStatus] = useState<"active" | "done">("active");
  const [result, setResult] = useState("");
  const [note, setNote] = useState("");

  async function submitExperiment(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const ok = await onAddExperiment({
      name: name.trim(),
      hypothesis: hypothesis.trim() || null,
      metric: metric.trim() || null,
      started_on: startedOn,
      ended_on: endedOn || null,
      status,
      result: result.trim() || null,
      note: note.trim() || null,
    });
    if (ok) {
      setName("");
      setHypothesis("");
      setMetric("");
      setEndedOn("");
      setResult("");
      setNote("");
      setStatus("active");
      setStartedOn(today());
    }
  }

  const orderedExperiments = useMemo(
    () =>
      [...experiments].sort((a, b) => {
        const ar = a.status === "active" ? 0 : 1;
        const br = b.status === "active" ? 0 : 1;
        if (ar !== br) return ar - br;
        return b.started_on.localeCompare(a.started_on);
      }),
    [experiments],
  );

  const LAGS = [0, 3, 7, 14];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-6"
    >
      {/* Causal-humility banner — leads the view */}
      <Narrative icon={ShieldAlert} accent="#fb923c" title="Correlation is not causation">
        This is a personal laboratory, not a study. Every number below is an{" "}
        <span className="text-white font-medium">n=1 observational signal</span> drawn from your own
        logs — two things moving together does <span className="text-white font-medium">not</span> mean
        one caused the other. Weeks differ in sleep, stress, travel, diet and dozens of unmeasured
        factors. Treat these as hypotheses worth testing, never as proof.
      </Narrative>

      {/* Correlation cards */}
      {hasAnyCorrelation ? (
        <motion.div variants={fadeUp}>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <GitCompareArrows size={15} className="text-cyan-400" /> Correlation signals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {correlations.map((c) => {
              const Icon = c.icon;
              const pct = Math.min(100, Math.abs(c.r) * 100);
              return (
                <div key={c.key} className="glass rounded-2xl border border-white/8 p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Icon size={15} style={{ color: c.color }} /> {c.title}
                    </span>
                    <Pill color={c.color}>{correlationStrength(c.r)}</Pill>
                  </div>
                  <div className="flex items-end gap-3 mb-3">
                    <span className="text-3xl font-bold text-white leading-none tabular-nums">
                      {c.r >= 0 ? "+" : ""}{c.r.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-readable-faint mb-0.5">
                      r · n={c.n} · {c.r > 0 ? "positive" : c.r < 0 ? "negative" : "flat"}
                    </span>
                  </div>
                  {/* strength bar */}
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: c.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-readable-soft leading-relaxed">{c.caption}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <EmptyState
          icon={Beaker}
          title="Not enough overlapping data yet"
          text="Correlations need weeks where two metrics were both logged. Keep recording weight, steps, runs and sleep — once they overlap, the signals will appear here. The experiments log below is ready whenever you are."
        />
      )}

      {/* Lag explorer: does steps lead weight? */}
      {stepsDaily.length > 0 && weightDaily.length > 0 && (
        <SectionCard
          title="Lag explorer · steps → weight"
          subtitle="Does a step count predict weight some days later? Shift the series and watch r change. This explores timing — it still proves nothing."
          icon={Crosshair}
          iconColor="#a78bfa"
        >
          <div className="flex flex-wrap gap-2 mb-4">
            {LAGS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLag(l)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                  lag === l
                    ? "bg-violet-500/20 border-violet-400/40 text-violet-200"
                    : "bg-white/[0.03] border-white/10 text-readable-faint hover:text-white"
                }`}
              >
                {l === 0 ? "same day" : `+${l} days`}
              </button>
            ))}
          </div>
          {lagResult.n < 6 ? (
            <p className="text-sm text-readable-faint">
              Not enough overlapping data at this lag (n={lagResult.n}). Need at least 6 aligned days.
            </p>
          ) : (
            <div>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-3xl font-bold text-white leading-none tabular-nums">
                  {lagResult.r >= 0 ? "+" : ""}{lagResult.r.toFixed(2)}
                </span>
                <span className="text-[11px] text-readable-faint mb-0.5">
                  r at {lag === 0 ? "same day" : `+${lag}d`} · n={lagResult.n} ·{" "}
                  {correlationStrength(lagResult.r)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                <motion.div
                  key={lag}
                  className="h-full rounded-full"
                  style={{ background: strengthColor(lagResult.r) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.abs(lagResult.r) * 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-readable-soft leading-relaxed">
                With weight shifted {lag === 0 ? "to the same day" : `${lag} days after`} a step count,
                the two {direction(lagResult.r)}. Comparing lags hints at <em>when</em> any link shows
                up — but lag does not imply a mechanism.
              </p>
            </div>
          )}
        </SectionCard>
      )}

      {/* Optional OLS readout + smoothed weight context */}
      {fit && (
        <SectionCard
          title="Same-day fit · steps on weight"
          subtitle="Ordinary least-squares on days where both were logged. Shown for honesty about how little a straight line explains."
          icon={Link2}
          iconColor="#60a5fa"
        >
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <div className="text-lg font-bold text-white tabular-nums">{fit.r.toFixed(2)}</div>
              <div className="text-[10px] uppercase tracking-wide text-readable-faint mt-1">r</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <div className="text-lg font-bold text-white tabular-nums">{(fit.r2 * 100).toFixed(0)}%</div>
              <div className="text-[10px] uppercase tracking-wide text-readable-faint mt-1">variance explained</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <div className="text-lg font-bold text-white tabular-nums">{fit.n}</div>
              <div className="text-[10px] uppercase tracking-wide text-readable-faint mt-1">paired days</div>
            </div>
          </div>
          <p className="text-xs text-readable-faint mt-3">
            Steps explain only {(fit.r2 * 100).toFixed(0)}% of day-to-day weight variation here — a
            reminder that weight is driven by far more than one input.
          </p>
        </SectionCard>
      )}

      {weightSmoothTrend.length > 1 && (
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Weight (7-day smoothed)</h2>
          <p className="text-xs text-readable-faint mb-3">
            Context for the signals above — the underlying trend the correlations are reading against.
          </p>
          <TrendChart data={weightSmoothTrend} color="#34d399" unit="lbs" height={220} markMinMax />
        </motion.div>
      )}

      {/* Experiments log */}
      <motion.div variants={fadeUp}>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <FlaskConical size={15} className="text-emerald-400" /> Experiment log
        </h2>

        {orderedExperiments.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No experiments logged yet"
            text="The best way to move past correlation is a deliberate test. Log your first experiment — a hypothesis, the metric you'll watch, and a date range — and track what actually changes."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orderedExperiments.map((ex) => {
              const active = ex.status === "active";
              return (
                <div key={ex.id} className="glass rounded-2xl border border-white/8 p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                      {active ? (
                        <CircleDot size={15} className="text-cyan-400" />
                      ) : (
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      )}
                      {ex.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Pill color={active ? "#22d3ee" : "#34d399"}>{active ? "active" : "done"}</Pill>
                      {canEdit && (
                        <button
                          onClick={() => onDeleteExperiment(ex.id)}
                          className="text-readable-faint hover:text-red-400 transition-colors"
                          aria-label="Delete experiment"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {ex.hypothesis && (
                    <p className="text-xs text-readable-soft leading-relaxed mb-2">{ex.hypothesis}</p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-readable-faint mb-2">
                    {ex.metric && (
                      <span>
                        Metric: <span className="text-readable-soft">{ex.metric}</span>
                      </span>
                    )}
                    <span>
                      {fmtDay(ex.started_on)}
                      {ex.ended_on ? ` – ${fmtDay(ex.ended_on)}` : " – ongoing"}
                    </span>
                  </div>
                  {ex.result && (
                    <div className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2 text-xs text-readable-soft leading-relaxed">
                      <span className="text-readable-faint">Result: </span>
                      {ex.result}
                    </div>
                  )}
                  {ex.note && <p className="text-[11px] text-readable-faint mt-2 italic">{ex.note}</p>}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Add experiment */}
      {canEdit && (
        <motion.div variants={fadeUp}>
          <AddCard onSubmit={submitExperiment} saving={saving} submitLabel="Log experiment">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="16:8 fasting"
                className={inputCls}
              />
            </Field>
            <Field label="Metric watched">
              <input
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                placeholder="weight, resting HR…"
                className={inputCls}
              />
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "done")}
                className={inputCls}
              >
                <option value="active">active</option>
                <option value="done">done</option>
              </select>
            </Field>
            <Field label="Started">
              <input type="date" value={startedOn} onChange={(e) => setStartedOn(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Ended">
              <input type="date" value={endedOn} onChange={(e) => setEndedOn(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Hypothesis">
              <input
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                placeholder="Eating window cuts late snacking"
                className={inputCls}
              />
            </Field>
            <Field label="Result">
              <input
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="filled in when done"
                className={inputCls}
              />
            </Field>
            <Field label="Note">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="optional context"
                className={inputCls}
              />
            </Field>
          </AddCard>
        </motion.div>
      )}
    </motion.div>
  );
}
