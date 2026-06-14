"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Footprints, Info, MapPin, Flame, HeartPulse, Clock } from "lucide-react";
import AnimatedNumber from "@/components/charts/AnimatedNumber";
import BarChart from "@/components/charts/BarChart";

export type StepRow = {
  id: string;
  measured_on: string;
  steps: number;
  distance_km: number | null;
  source: string | null;
};
export type HourlyRow = { id: string; measured_on: string; hour: number; steps: number };
export type WorkoutRow = {
  id: string;
  workout_type: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_min: number | null;
  active_kcal: number | null;
  distance_km: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  steps: number | null;
};

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

function dayLabel(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function timeLabel(t: string | null) {
  if (!t) return "";
  return new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function StepsView({
  rows,
  hourly,
  workouts,
}: {
  rows: StepRow[];
  hourly: HourlyRow[];
  workouts: WorkoutRow[];
}) {
  const chrono = useMemo(() => [...rows].sort((a, b) => a.measured_on.localeCompare(b.measured_on)), [rows]);

  const dailyBars = chrono.map((r) => ({ label: dayLabel(r.measured_on), value: Number(r.steps) }));
  const total = chrono.reduce((s, r) => s + Number(r.steps), 0);
  const avg = chrono.length ? total / chrono.length : 0;
  const best = chrono.reduce((m, r) => Math.max(m, Number(r.steps)), 0);

  // Hourly rhythm with a day toggle
  const days = useMemo(
    () => Array.from(new Set(hourly.map((h) => h.measured_on))).sort(),
    [hourly],
  );
  const [activeDay, setActiveDay] = useState<string>("");
  const day = activeDay || days[0] || "";
  const hourlyBars = useMemo(() => {
    const map = new Map(hourly.filter((h) => h.measured_on === day).map((h) => [h.hour, Number(h.steps)]));
    return Array.from({ length: 24 }, (_, h) => ({
      label: h % 3 === 0 ? `${h}` : "",
      value: map.get(h) ?? 0,
    }));
  }, [hourly, day]);

  const totalWorkoutKcal = workouts.reduce((s, w) => s + Number(w.active_kcal ?? 0), 0);
  const totalWorkoutKm = workouts.reduce((s, w) => s + Number(w.distance_km ?? 0), 0);

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs text-readable-soft">
        <Info size={15} className="text-amber-400 mt-0.5 shrink-0" />
        <span>Your Health export covered <span className="text-white font-medium">June 13–14</span> in detail. Daily totals, the hour-by-hour rhythm, and individual tracked walks are shown below. Export a longer history and it&apos;ll chart here automatically.</span>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { label: "Best day", value: best, color: "#34d399" },
          { label: "Daily average", value: avg, color: "#60a5fa" },
          { label: "Total logged", value: total, color: "#a78bfa" },
        ].map((k) => (
          <div key={k.label} className="glass rounded-2xl border border-white/8 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Footprints size={15} style={{ color: k.color }} />
              <span className="text-[11px] uppercase tracking-wide text-readable-faint">{k.label}</span>
            </div>
            <div className="text-2xl font-bold text-white leading-none">
              <AnimatedNumber value={Math.round(k.value)} />
            </div>
            <div className="text-[11px] text-readable-faint mt-1.5">steps</div>
          </div>
        ))}
      </motion.div>

      {/* Daily */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Daily steps</h2>
        <BarChart data={dailyBars} singleColor="#34d399" unit="steps" />
      </motion.div>

      {/* Hourly rhythm */}
      {days.length > 0 && (
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-semibold text-white">Hour-by-hour rhythm</h2>
            <div className="flex gap-1.5">
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDay(d)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${day === d ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "text-readable-faint border-white/10 hover:bg-white/[0.05]"}`}
                >
                  {dayLabel(d)}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-readable-faint mb-3">Steps per hour ({dayLabel(day)}) — when the movement actually happened.</p>
          <BarChart data={hourlyBars} singleColor="#22d3ee" unit="steps" />
        </motion.div>
      )}

      {/* Tracked walks */}
      {workouts.length > 0 && (
        <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/8 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-white">Tracked walks</h2>
            <span className="text-xs text-readable-faint">
              {workouts.length} walks · {totalWorkoutKm.toFixed(1)} km · {Math.round(totalWorkoutKcal)} kcal
            </span>
          </div>
          <p className="text-xs text-readable-faint mb-4">GPS-tracked walks on June 13 with heart rate and calories.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...workouts]
              .sort((a, b) => (a.started_at ?? "").localeCompare(b.started_at ?? ""))
              .map((w) => (
                <div key={w.id} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                      <MapPin size={14} className="text-emerald-400" /> {w.workout_type ?? "Walk"}
                    </span>
                    <span className="text-[11px] text-readable-faint">
                      {timeLabel(w.started_at)}–{timeLabel(w.ended_at)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
                    <Stat icon={Clock} color="#60a5fa" label="Duration" value={`${w.duration_min} min`} />
                    <Stat icon={MapPin} color="#34d399" label="Distance" value={`${Number(w.distance_km).toFixed(2)} km`} />
                    <Stat icon={Flame} color="#f59e0b" label="Active" value={`${Math.round(Number(w.active_kcal))} kcal`} />
                    <Stat icon={Footprints} color="#a78bfa" label="Steps" value={`${Number(w.steps).toLocaleString()}`} />
                    <Stat icon={HeartPulse} color="#fb7185" label="Avg HR" value={`${w.avg_hr} bpm`} />
                    <Stat icon={HeartPulse} color="#f87171" label="Max HR" value={`${w.max_hr} bpm`} />
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function Stat({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={13} style={{ color }} />
      <span className="text-readable-faint">{label}</span>
      <span className="ml-auto text-white font-medium">{value}</span>
    </div>
  );
}
