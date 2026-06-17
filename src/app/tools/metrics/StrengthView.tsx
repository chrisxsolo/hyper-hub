"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Dumbbell, Sparkles, Trophy, Layers, Flame, Activity, CalendarDays,
  Gauge, Crosshair, TrendingUp, Info, BicepsFlexed,
} from "lucide-react";
import TrendChart from "@/components/charts/TrendChart";
import BarChart from "@/components/charts/BarChart";
import {
  AddCard, Field, HistoryList, KpiGrid, InsightGrid, EmptyState, inputCls,
  fadeUp, type Kpi, type Insight,
} from "@/components/health/ui";
import { epley1RM, isoWeek } from "@/lib/health/stats";
import { MUSCLE_GROUPS, type StrengthRow } from "@/lib/health/types";

const fmtDay = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

const today = () => new Date().toISOString().slice(0, 10);

const numOrNull = (s: string): number | null => {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

const blankForm = () => ({
  performed_on: today(),
  exercise: "",
  muscle_group: "" as string,
  sets: "",
  reps: "",
  weight_lbs: "",
  rir: "",
  duration_min: "",
  note: "",
});

export default function StrengthView({
  rows,
  canEdit,
  saving,
  onAdd,
  onDelete,
  bodyWeightLbs,
}: {
  rows: StrengthRow[];
  canEdit: boolean;
  saving: boolean;
  onAdd: (p: Record<string, unknown>) => Promise<boolean>;
  onDelete: (id: string) => void;
  bodyWeightLbs: number | null;
}) {
  const [form, setForm] = useState(blankForm);

  const set = (k: keyof ReturnType<typeof blankForm>, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.exercise.trim() || numOrNull(form.sets) == null) return;
    const ok = await onAdd({
      performed_on: form.performed_on || today(),
      exercise: form.exercise.trim(),
      muscle_group: form.muscle_group.trim() || null,
      sets: numOrNull(form.sets),
      reps: numOrNull(form.reps),
      weight_lbs: numOrNull(form.weight_lbs),
      rir: numOrNull(form.rir),
      duration_min: numOrNull(form.duration_min),
      note: form.note.trim() || null,
    });
    if (ok) setForm(blankForm());
  }

  // ── Derived lines (volume + est 1RM per logged row) ────────────────────────
  const lines = useMemo(() => {
    return [...rows]
      .sort((a, b) => a.performed_on.localeCompare(b.performed_on))
      .map((r) => {
        const sets = Number(r.sets);
        const reps = r.reps == null ? null : Number(r.reps);
        const weight = r.weight_lbs == null ? null : Number(r.weight_lbs);
        const rir = r.rir == null ? null : Number(r.rir);
        const volume = reps != null && weight != null ? sets * reps * weight : 0;
        const e1rm = reps != null && weight != null ? epley1RM(weight, reps) : 0;
        return { r, sets, reps, weight, rir, volume, e1rm };
      });
  }, [rows]);

  const exercises = useMemo(
    () => [...new Set(lines.map((l) => l.r.exercise))].sort(),
    [lines],
  );
  const [movement, setMovement] = useState<string>("");
  const selected = movement || exercises[0] || "";

  const stats = useMemo(() => {
    if (!lines.length) return null;
    const nowWeek = isoWeek(today()).key;
    let weekHardSets = 0;
    let weekVolume = 0;
    let topE1rm = 0;
    const sessions = new Set<string>();
    for (const l of lines) {
      sessions.add(l.r.performed_on);
      if (l.e1rm > topE1rm) topE1rm = l.e1rm;
      if (isoWeek(l.r.performed_on).key === nowWeek) {
        weekVolume += l.volume;
        if (l.rir != null && l.rir <= 3) weekHardSets += l.sets;
      }
    }
    return {
      weekHardSets,
      weekVolume,
      exerciseCount: exercises.length,
      sessionCount: sessions.size,
      topE1rm,
      totalVolume: lines.reduce((s, l) => s + l.volume, 0),
    };
  }, [lines, exercises]);

  // Weekly volume bars (sum volume per ISO week, label = week start).
  const weeklyVolume = useMemo(() => {
    const m = new Map<string, { start: string; vol: number }>();
    for (const l of lines) {
      if (l.volume <= 0) continue;
      const { key, start } = isoWeek(l.r.performed_on);
      const e = m.get(key) ?? { start, vol: 0 };
      e.vol += l.volume;
      m.set(key, e);
    }
    return [...m.values()]
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((e) => ({ label: fmtDay(e.start), value: Math.round(e.vol) }));
  }, [lines]);

  // Hard sets this week by muscle group.
  const groupHardSets = useMemo(() => {
    const nowWeek = isoWeek(today()).key;
    const m = new Map<string, number>();
    for (const l of lines) {
      if (isoWeek(l.r.performed_on).key !== nowWeek) continue;
      if (l.rir == null || l.rir > 3) continue;
      const g = l.r.muscle_group || "Unspecified";
      m.set(g, (m.get(g) ?? 0) + l.sets);
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }, [lines]);

  // e1RM progression for the selected movement: best e1RM per session date.
  const e1rmTrend = useMemo(() => {
    if (!selected) return [];
    const byDate = new Map<string, number>();
    for (const l of lines) {
      if (l.r.exercise !== selected || l.e1rm <= 0) continue;
      byDate.set(l.r.performed_on, Math.max(byDate.get(l.r.performed_on) ?? 0, l.e1rm));
    }
    return [...byDate.entries()]
      .map(([date, value]) => ({ date, value: +value.toFixed(1) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [lines, selected]);

  // ── Form (rendered whenever the user can edit, even with no rows yet) ───────
  const formNode = canEdit && (
    <AddCard onSubmit={submit} saving={saving} submitLabel="Log set">
      <Field label="Date">
        <input type="date" className={inputCls} value={form.performed_on} onChange={(e) => set("performed_on", e.target.value)} />
      </Field>
      <Field label="Exercise">
        <input className={inputCls} placeholder="Bench Press" list="strength-exercises" value={form.exercise} onChange={(e) => set("exercise", e.target.value)} />
        <datalist id="strength-exercises">
          {exercises.map((ex) => <option key={ex} value={ex} />)}
        </datalist>
      </Field>
      <Field label="Muscle group">
        <select className={inputCls} value={form.muscle_group} onChange={(e) => set("muscle_group", e.target.value)}>
          <option value="">—</option>
          {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </Field>
      <Field label="Sets">
        <input type="number" min="1" step="1" className={inputCls} placeholder="3" value={form.sets} onChange={(e) => set("sets", e.target.value)} />
      </Field>
      <Field label="Reps">
        <input type="number" min="0" step="1" className={inputCls} placeholder="8" value={form.reps} onChange={(e) => set("reps", e.target.value)} />
      </Field>
      <Field label="Weight (lb)">
        <input type="number" min="0" step="any" className={inputCls} placeholder="135" value={form.weight_lbs} onChange={(e) => set("weight_lbs", e.target.value)} />
      </Field>
      <Field label="RIR">
        <input type="number" min="0" step="1" className={inputCls} placeholder="2" value={form.rir} onChange={(e) => set("rir", e.target.value)} />
      </Field>
      <Field label="Duration (min)">
        <input type="number" min="0" step="any" className={inputCls} placeholder="optional" value={form.duration_min} onChange={(e) => set("duration_min", e.target.value)} />
      </Field>
      <Field label="Note">
        <input className={inputCls} placeholder="optional" value={form.note} onChange={(e) => set("note", e.target.value)} />
      </Field>
    </AddCard>
  );

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!stats) {
    return (
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className="space-y-6"
      >
        <motion.div variants={fadeUp}>
          <EmptyState
            icon={Dumbbell}
            title="No lifts logged yet"
            text="Start tracking resistance training to unlock weekly volume, hard-set counts per muscle group, and Epley-estimated 1RM progression for every movement. Log your first set below — even one entry lights up the dashboard."
          />
        </motion.div>
        {canEdit && <motion.div variants={fadeUp}>{formNode}</motion.div>}
      </motion.div>
    );
  }

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpis: Kpi[] = [
    { icon: Flame, color: "#fb923c", label: "Hard sets this wk", value: stats.weekHardSets, sub: "RIR ≤ 3, current ISO week" },
    { icon: Layers, color: "#a78bfa", label: "Volume this wk", value: Math.round(stats.weekVolume), suffix: " lb", sub: "sets × reps × weight" },
    { icon: Dumbbell, color: "#22d3ee", label: "Exercises", value: stats.exerciseCount, sub: "distinct movements tracked" },
    { icon: CalendarDays, color: "#60a5fa", label: "Sessions", value: stats.sessionCount, sub: "distinct training days" },
    { icon: Trophy, color: "#34d399", label: "Top est. 1RM", value: Math.round(stats.topE1rm), suffix: " lb", sub: "Epley estimate, best line" },
    { icon: Activity, color: "#2dd4bf", label: "Lifetime volume", value: Math.round(stats.totalVolume), suffix: " lb", sub: `${rows.length} sets logged` },
  ];

  // ── Insights ───────────────────────────────────────────────────────────────
  const insights: Insight[] = [];
  const topGroup = groupHardSets[0];
  if (topGroup) {
    insights.push({
      icon: BicepsFlexed,
      color: "#a78bfa",
      title: `${topGroup.label} leads the week`,
      text: `${topGroup.value} hard set${topGroup.value === 1 ? "" : "s"} (RIR ≤ 3) on ${topGroup.label.toLowerCase()} so far this ISO week — your highest-stimulus group right now.`,
    });
  }
  if (e1rmTrend.length >= 2 && selected) {
    const first = e1rmTrend[0].value;
    const last = e1rmTrend[e1rmTrend.length - 1].value;
    const delta = last - first;
    insights.push({
      icon: TrendingUp,
      color: delta >= 0 ? "#34d399" : "#f59e0b",
      title: `${selected} est. 1RM ${delta >= 0 ? "climbing" : "easing"}`,
      text: `Estimated 1RM on ${selected} has gone from ~${Math.round(first)} to ~${Math.round(last)} lb (${delta >= 0 ? "+" : ""}${Math.round(delta)} lb) across ${e1rmTrend.length} sessions. Epley-estimated from your top set, not a tested max.`,
    });
  }
  if (stats.weekHardSets > 0) {
    insights.push({
      icon: Flame,
      color: "#fb923c",
      title: "Weekly stimulus check",
      text: `${stats.weekHardSets} hard sets this week across ${groupHardSets.length} muscle group${groupHardSets.length === 1 ? "" : "s"}. Research-backed hypertrophy ranges sit around 10–20 hard sets per muscle per week.`,
    });
  }
  if (bodyWeightLbs != null && stats.topE1rm > 0) {
    const ratio = stats.topE1rm / Number(bodyWeightLbs);
    insights.push({
      icon: Gauge,
      color: "#38bdf8",
      title: "Strength-to-bodyweight",
      text: `Your best est. 1RM (~${Math.round(stats.topE1rm)} lb) is ${ratio.toFixed(2)}× your ${Math.round(Number(bodyWeightLbs))} lb bodyweight — a rough relative-strength gauge, not movement-specific.`,
    });
  }

  // ── Recent sessions (HistoryList) ──────────────────────────────────────────
  const historyItems = lines.map((l) => {
    const weightStr = l.weight != null ? `${l.weight}` : "BW";
    const repStr = l.reps != null ? `${l.reps}` : "—";
    const group = l.r.muscle_group ?? "Unspecified";
    const e1rmStr = l.e1rm > 0 ? `e1RM ${Math.round(l.e1rm)}` : "—";
    return {
      id: l.r.id,
      date: l.r.performed_on,
      primary: `${l.r.exercise} ${l.sets}x${repStr} @ ${weightStr} lb`,
      secondary: `${group} · ${e1rmStr}`,
    };
  });

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-6"
    >
      {/* Narrative */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-violet-500/20 p-5 bg-gradient-to-br from-violet-500/8 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-white">Your lifting log</h2>
        </div>
        <p className="text-sm text-readable-soft leading-relaxed">
          <span className="text-white font-medium">{rows.length} sets</span> across{" "}
          <span className="text-violet-300 font-medium">{stats.sessionCount} sessions</span> and{" "}
          <span className="text-white font-medium">{stats.exerciseCount} movements</span> — that&apos;s{" "}
          <span className="text-white font-medium">{Math.round(stats.totalVolume).toLocaleString()} lb</span> of lifetime volume.
          This week you&apos;ve banked <span className="text-amber-300 font-medium">{stats.weekHardSets} hard sets</span>. Estimated
          1RMs below are Epley calculations from your top sets — useful for spotting trends, not a substitute for a tested max.
        </p>
      </motion.div>

      {/* Logging form */}
      {canEdit && <motion.div variants={fadeUp}>{formNode}</motion.div>}

      {/* KPIs */}
      <KpiGrid kpis={kpis} />

      {/* Weekly volume */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-semibold text-white mb-1">Weekly training volume</h2>
        <p className="text-xs text-readable-faint mb-3">Total volume (sets × reps × weight) per ISO week.</p>
        {weeklyVolume.length ? (
          <BarChart data={weeklyVolume} singleColor="#a78bfa" unit="lb" />
        ) : (
          <p className="text-sm text-readable-faint">Log weighted sets (reps + weight) to chart volume.</p>
        )}
      </motion.div>

      {/* Hard sets by muscle group + e1RM progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Hard sets by muscle group</h2>
          <p className="text-xs text-readable-faint mb-3">This ISO week, sets taken to RIR ≤ 3.</p>
          {groupHardSets.length ? (
            <BarChart data={groupHardSets} singleColor="#fb923c" unit="sets" />
          ) : (
            <p className="text-sm text-readable-faint">No hard sets (RIR ≤ 3) logged yet this week.</p>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Crosshair size={15} className="text-emerald-400" /> Est. 1RM progression
            </h2>
            <select
              className="rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500/40"
              value={selected}
              onChange={(e) => setMovement(e.target.value)}
            >
              {exercises.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>
          <p className="text-xs text-readable-faint mb-3">Best Epley-estimated 1RM per session for {selected || "—"}.</p>
          {e1rmTrend.length >= 2 ? (
            <TrendChart data={e1rmTrend} color="#34d399" unit="lb" markMinMax height={240} />
          ) : (
            <p className="text-sm text-readable-faint">Need at least two weighted sessions of {selected || "this movement"} to chart progression.</p>
          )}
        </motion.div>
      </div>

      {/* Insights */}
      <InsightGrid insights={insights} />

      {/* Honest caveat */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-4 flex items-center gap-2.5 text-xs text-readable-faint">
        <Info size={14} className="text-readable-faint shrink-0" />
        Estimated 1RM uses the Epley formula (weight × (1 + reps / 30)) from your logged top set. It approximates a tested max but isn&apos;t one — treat it as a trend signal.
      </motion.div>

      {/* Recent sessions */}
      <motion.div variants={fadeUp}>
        <h2 className="text-sm font-semibold text-white mb-3">Recent sessions</h2>
        <HistoryList items={historyItems} canEdit={canEdit} onDelete={onDelete} emptyText="No sets logged yet." />
      </motion.div>
    </motion.div>
  );
}
