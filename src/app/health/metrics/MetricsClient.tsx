"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Scale,
  Footprints,
  Moon,
  FlaskConical,
  Activity,
  Dumbbell,
  UtensilsCrossed,
  Microscope,
  Database,
  Radar,
  HeartPulse,
  Plus,
  LogOut,
  Loader2,
  Trash2,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LineChart, { type ChartPoint } from "@/components/LineChart";
import WeightLossView, { type WeightRow } from "./WeightLossView";
import StepsView, { type StepRow, type WorkoutRow } from "./StepsView";
import BloodView, { type BloodRow } from "./BloodView";
import OverviewView from "./OverviewView";
import RunningLabView from "./RunningLabView";
import RecoveryView from "./RecoveryView";
import StrengthView from "./StrengthView";
import NutritionView from "./NutritionView";
import DataQualityView from "./DataQualityView";
import CorrelationLabView from "./CorrelationLabView";
import type { StrengthRow, NutritionRow, ExperimentRow, VitalsRow } from "@/lib/health/types";

// ── Row types ────────────────────────────────────────────────────────────────
type SleepRow = {
  id: string;
  measured_on: string;
  total_hours: number;
  deep_hours: number | null;
  rem_hours: number | null;
  resting_hr: number | null;
  hrv_ms: number | null;
  sleep_score: number | null;
  note: string | null;
};
type Tab =
  | "overview" | "weight" | "steps" | "running" | "strength" | "nutrition"
  | "recovery" | "sleep" | "blood" | "lab" | "data";

const today = () => new Date().toISOString().slice(0, 10);

const tabs: { key: Tab; label: string; icon: React.ElementType; color: string }[] = [
  { key: "overview", label: "Overview", icon: Radar, color: "#22d3ee" },
  { key: "weight", label: "Weight", icon: Scale, color: "#60a5fa" },
  { key: "steps", label: "Steps", icon: Footprints, color: "#34d399" },
  { key: "running", label: "Running", icon: Activity, color: "#fb923c" },
  { key: "strength", label: "Strength", icon: Dumbbell, color: "#f472b6" },
  { key: "nutrition", label: "Nutrition", icon: UtensilsCrossed, color: "#2dd4bf" },
  { key: "recovery", label: "Recovery", icon: HeartPulse, color: "#fb7185" },
  { key: "sleep", label: "Sleep", icon: Moon, color: "#a78bfa" },
  { key: "blood", label: "Blood", icon: FlaskConical, color: "#22d3ee" },
  { key: "lab", label: "Lab", icon: Microscope, color: "#818cf8" },
  { key: "data", label: "Data", icon: Database, color: "#94a3b8" },
];

// ── Small form primitives ──────────────────────────────────────────────────────
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-readable-faint">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/40 transition-colors w-full";

export default function MetricsClient({
  email,
  canEdit,
}: {
  email: string | null;
  canEdit: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  const [weight, setWeight] = useState<WeightRow[]>([]);
  const [steps, setSteps] = useState<StepRow[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [sleep, setSleep] = useState<SleepRow[]>([]);
  const [blood, setBlood] = useState<BloodRow[]>([]);
  const [strength, setStrength] = useState<StrengthRow[]>([]);
  const [nutrition, setNutrition] = useState<NutritionRow[]>([]);
  const [experiments, setExperiments] = useState<ExperimentRow[]>([]);
  const [vitals, setVitals] = useState<VitalsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [w, st, wk, s, b, str, nut, exp, vit] = await Promise.all([
      supabase.from("health_weight").select("*").order("measured_on"),
      supabase.from("health_steps").select("*").order("measured_on"),
      supabase.from("health_workouts").select("*").order("started_at"),
      supabase.from("health_sleep").select("*").order("measured_on"),
      supabase.from("health_blood_markers").select("*").order("drawn_on"),
      supabase.from("health_strength_sets").select("*").order("performed_on"),
      supabase.from("health_nutrition").select("*").order("eaten_on"),
      supabase.from("health_experiments").select("*").order("started_on"),
      supabase.from("health_vitals").select("*").order("measured_on"),
    ]);
    if (w.data) setWeight(w.data as WeightRow[]);
    if (st.data) setSteps(st.data as StepRow[]);
    if (wk.data) setWorkouts(wk.data as WorkoutRow[]);
    if (s.data) setSleep(s.data as SleepRow[]);
    if (b.data) setBlood(b.data as BloodRow[]);
    if (str.data) setStrength(str.data as StrengthRow[]);
    if (nut.data) setNutrition(nut.data as NutritionRow[]);
    if (exp.data) setExperiments(exp.data as ExperimentRow[]);
    if (vit.data) setVitals(vit.data as VitalsRow[]);
    const firstErr = w.error || st.error || s.error || b.error || str.error || nut.error || exp.error || vit.error;
    if (firstErr) setErr(firstErr.message);
    setLoading(false);
  }, [supabase]);

  // Most recent body weight — feeds protein-per-kg and relative-strength math.
  const bodyWeightLbs = useMemo(() => {
    if (!weight.length) return null;
    const sorted = [...weight].sort((a, b) =>
      (a.measured_at ?? a.measured_on).localeCompare(b.measured_at ?? b.measured_on),
    );
    return Number(sorted[sorted.length - 1].weight_lbs);
  }, [weight]);

  useEffect(() => {
    load();
  }, [load]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function insert(table: string, payload: Record<string, unknown>) {
    setSaving(true);
    setErr("");
    const { error } = await supabase.from(table).insert(payload);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return false;
    }
    await load();
    return true;
  }

  async function remove(table: string, id: string) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) setErr(error.message);
    else await load();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* Back + account */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-10"
      >
        <Link
          href="/health"
          className="inline-flex items-center gap-1.5 text-sm text-readable-soft hover:text-readable-strong transition-colors"
        >
          <ArrowLeft size={14} /> Back to Health
        </Link>
        {email ? (
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 text-xs text-readable-faint hover:text-readable-strong transition-colors"
          >
            <LogOut size={13} /> {email}
          </button>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-readable-faint hover:text-readable-strong transition-colors"
          >
            <Lock size={12} /> Sign in to edit
          </Link>
        )}
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white tracking-tight">My Metrics</h1>
        <p className="text-sm text-readable-soft mt-1">
          A personal health lab — baselines, running performance, lifting, nutrition,
          blood, and the relationships between them.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              tab === key
                ? "bg-cyan-500/15 text-cyan-200 border-cyan-500/30"
                : "text-readable-soft border-white/10 hover:bg-white/[0.05]"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
          {err}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-readable-faint py-16 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading your data…
        </div>
      ) : (
        <>
          {tab === "overview" && (
            <OverviewView
              weight={weight}
              steps={steps}
              workouts={workouts}
              sleep={sleep}
              blood={blood}
              strength={strength}
              nutrition={nutrition}
              vitals={vitals}
            />
          )}
          {tab === "weight" && <WeightLossView rows={weight} />}
          {tab === "steps" && <StepsView rows={steps} workouts={workouts} weight={weight} />}
          {tab === "running" && <RunningLabView workouts={workouts} />}
          {tab === "recovery" && <RecoveryView vitals={vitals} />}
          {tab === "strength" && (
            <StrengthView
              rows={strength}
              canEdit={canEdit}
              saving={saving}
              onAdd={(p) => insert("health_strength_sets", p)}
              onDelete={(id) => remove("health_strength_sets", id)}
              bodyWeightLbs={bodyWeightLbs}
            />
          )}
          {tab === "nutrition" && (
            <NutritionView
              rows={nutrition}
              canEdit={canEdit}
              saving={saving}
              onAdd={(p) => insert("health_nutrition", p)}
              onDelete={(id) => remove("health_nutrition", id)}
              bodyWeightLbs={bodyWeightLbs}
            />
          )}
          {tab === "lab" && (
            <CorrelationLabView
              weight={weight}
              steps={steps}
              workouts={workouts}
              sleep={sleep}
              vitals={vitals}
              experiments={experiments}
              canEdit={canEdit}
              saving={saving}
              onAddExperiment={(p) => insert("health_experiments", p)}
              onDeleteExperiment={(id) => remove("health_experiments", id)}
            />
          )}
          {tab === "data" && (
            <DataQualityView
              weight={weight}
              steps={steps}
              sleep={sleep}
              blood={blood}
              workouts={workouts}
              strength={strength}
              nutrition={nutrition}
              vitals={vitals}
            />
          )}
          {tab === "sleep" && (
            <SleepTab
              rows={sleep}
              saving={saving}
              canEdit={canEdit}
              onAdd={(p) => insert("health_sleep", p)}
              onDelete={(id) => remove("health_sleep", id)}
            />
          )}
          {tab === "blood" && (
            <BloodTab
              rows={blood}
              saving={saving}
              canEdit={canEdit}
              onAdd={(p) => insert("health_blood_markers", p)}
              onDelete={(id) => remove("health_blood_markers", id)}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Sleep ──────────────────────────────────────────────────────────────────────
function SleepTab({
  rows,
  saving,
  canEdit,
  onAdd,
  onDelete,
}: {
  rows: SleepRow[];
  saving: boolean;
  canEdit: boolean;
  onAdd: (p: Record<string, unknown>) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [date, setDate] = useState(today());
  const [total, setTotal] = useState("");
  const [deep, setDeep] = useState("");
  const [rem, setRem] = useState("");
  const [rhr, setRhr] = useState("");
  const [hrv, setHrv] = useState("");
  const [score, setScore] = useState("");

  const points: ChartPoint[] = rows.map((r) => ({
    date: r.measured_on,
    value: Number(r.total_hours),
  }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!total) return;
    const ok = await onAdd({
      measured_on: date,
      total_hours: Number(total),
      deep_hours: deep ? Number(deep) : null,
      rem_hours: rem ? Number(rem) : null,
      resting_hr: rhr ? Number(rhr) : null,
      hrv_ms: hrv ? Number(hrv) : null,
      sleep_score: score ? Number(score) : null,
    });
    if (ok) {
      setTotal("");
      setDeep("");
      setRem("");
      setRhr("");
      setHrv("");
      setScore("");
    }
  }

  return (
    <div className="space-y-6">
      <ChartCard title="Total sleep" unit="hrs" color="#a78bfa">
        <LineChart data={points} color="#a78bfa" unit="hrs" />
      </ChartCard>

      {canEdit && (
      <AddCard onSubmit={submit} saving={saving}>
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Total (hrs)">
          <input type="number" step="0.1" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="7.5" className={inputCls} />
        </Field>
        <Field label="Deep (hrs)">
          <input type="number" step="0.1" value={deep} onChange={(e) => setDeep(e.target.value)} placeholder="1.2" className={inputCls} />
        </Field>
        <Field label="REM (hrs)">
          <input type="number" step="0.1" value={rem} onChange={(e) => setRem(e.target.value)} placeholder="1.6" className={inputCls} />
        </Field>
        <Field label="Resting HR">
          <input type="number" value={rhr} onChange={(e) => setRhr(e.target.value)} placeholder="54" className={inputCls} />
        </Field>
        <Field label="HRV (ms)">
          <input type="number" value={hrv} onChange={(e) => setHrv(e.target.value)} placeholder="65" className={inputCls} />
        </Field>
        <Field label="Sleep score">
          <input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="88" className={inputCls} />
        </Field>
      </AddCard>
      )}

      <HistoryList
        canEdit={canEdit}
        items={rows.map((r) => ({
          id: r.id,
          date: r.measured_on,
          primary: `${r.total_hours} hrs`,
          secondary: [
            r.sleep_score != null ? `score ${r.sleep_score}` : "",
            r.resting_hr != null ? `${r.resting_hr} bpm` : "",
          ]
            .filter(Boolean)
            .join(" · "),
        }))}
        onDelete={onDelete}
      />
    </div>
  );
}

// ── Blood ──────────────────────────────────────────────────────────────────────
function BloodTab({
  rows,
  saving,
  canEdit,
  onAdd,
  onDelete,
}: {
  rows: BloodRow[];
  saving: boolean;
  canEdit: boolean;
  onAdd: (p: Record<string, unknown>) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const markers = useMemo(
    () => Array.from(new Set(rows.map((r) => r.marker))).sort(),
    [rows],
  );

  const [date, setDate] = useState(today());
  const [marker, setMarker] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [low, setLow] = useState("");
  const [high, setHigh] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!marker || !value) return;
    const ok = await onAdd({
      drawn_on: date,
      marker: marker.trim(),
      value: Number(value),
      unit: unit || null,
      ref_low: low ? Number(low) : null,
      ref_high: high ? Number(high) : null,
    });
    if (ok) {
      setValue("");
    }
  }

  return (
    <div className="space-y-6">
      <BloodView rows={rows} canEdit={canEdit} onDelete={onDelete} />

      {canEdit && (
      <AddCard onSubmit={submit} saving={saving}>
        <Field label="Date drawn">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Marker">
          <input list="known-markers" value={marker} onChange={(e) => setMarker(e.target.value)} placeholder="LDL" className={inputCls} />
          <datalist id="known-markers">
            {markers.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Field>
        <Field label="Value">
          <input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} placeholder="95" className={inputCls} />
        </Field>
        <Field label="Unit">
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="mg/dL" className={inputCls} />
        </Field>
        <Field label="Ref low (optional)">
          <input type="number" step="any" value={low} onChange={(e) => setLow(e.target.value)} placeholder="0" className={inputCls} />
        </Field>
        <Field label="Ref high (optional)">
          <input type="number" step="any" value={high} onChange={(e) => setHigh(e.target.value)} placeholder="100" className={inputCls} />
        </Field>
      </AddCard>
      )}
    </div>
  );
}

// ── Shared UI ──────────────────────────────────────────────────────────────────
function ChartCard({
  title,
  unit,
  color,
  children,
}: {
  title: string;
  unit?: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl border border-white/8 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {unit && <span className="text-xs text-readable-faint">({unit})</span>}
      </div>
      {children}
    </div>
  );
}

function AddCard({
  onSubmit,
  saving,
  children,
}: {
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="glass rounded-2xl border border-white/8 p-5"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">{children}</div>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 px-4 py-2 text-sm font-medium hover:bg-cyan-500/25 transition-colors disabled:opacity-60"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Add entry
      </button>
    </form>
  );
}

function HistoryList({
  items,
  canEdit,
  onDelete,
}: {
  items: { id: string; date: string; primary: string; secondary: string }[];
  canEdit: boolean;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) return null;
  const ordered = [...items].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="glass rounded-2xl border border-white/8 divide-y divide-white/5 overflow-hidden">
      {ordered.map((it) => (
        <div key={it.id} className="flex items-center gap-3 px-5 py-3 text-sm">
          <span className="text-readable-faint w-24 shrink-0 font-mono text-xs">
            {it.date}
          </span>
          <span className="text-white font-medium">{it.primary}</span>
          {it.secondary && (
            <span className="text-readable-faint text-xs">{it.secondary}</span>
          )}
          {canEdit && (
            <button
              onClick={() => onDelete(it.id)}
              className="ml-auto text-readable-faint hover:text-red-400 transition-colors"
              aria-label="Delete entry"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
