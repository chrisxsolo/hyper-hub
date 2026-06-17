"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, Route, Flame, HeartPulse, Gauge as GaugeIcon, Sparkles,
  TrendingUp, TrendingDown, Trophy, Wind, Zap, Mountain, Crosshair, Minus,
} from "lucide-react";
import TrendChart from "@/components/charts/TrendChart";
import BarChart from "@/components/charts/BarChart";
import {
  fadeUp, type Kpi, InsightGrid, type Insight, SectionCard, Narrative, Pill, EmptyState,
} from "@/components/health/ui";
import type { WorkoutRow } from "@/lib/health/types";
import {
  MI_PER_KM, paceMinPerMile, formatPace, metresPerBeat, hrZone, zoneEffort,
  trimp, acwr, isoWeek, linreg, mean, type Effort,
} from "@/lib/health/stats";

const REST_HR = 48; // baseline resting HR assumption (sleep data too sparse to derive)

type Run = {
  id: string;
  date: string;
  ts: number;
  km: number;
  mi: number;
  durMin: number;
  avgHr: number | null;
  maxHr: number | null;
  kcal: number;
  pace: number;        // min / mile
  mpb: number | null;  // metres per heartbeat
};

const fmtDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
const weekStartLabel = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

const EFFORT_META: Record<Effort, { label: string; color: string }> = {
  easy: { label: "Easy (Z1–2)", color: "#34d399" },
  moderate: { label: "Moderate (Z3)", color: "#fbbf24" },
  hard: { label: "Hard (Z4–5)", color: "#f87171" },
};

export default function RunningLabView({ workouts }: { workouts: WorkoutRow[] }) {
  const runs = useMemo<Run[]>(() => {
    return workouts
      .filter((w) => (w.workout_type ?? "").toLowerCase().includes("run"))
      .filter((w) => w.started_at && Number(w.distance_km) > 0.3 && Number(w.duration_min) > 0)
      .map((w) => {
        const km = Number(w.distance_km);
        const mi = km * MI_PER_KM;
        const durMin = Number(w.duration_min);
        const avgHr = w.avg_hr != null ? Number(w.avg_hr) : null;
        const maxHr = w.max_hr != null ? Number(w.max_hr) : null;
        return {
          id: w.id,
          date: w.started_at!.slice(0, 10),
          ts: new Date(w.started_at!).getTime(),
          km, mi, durMin, avgHr, maxHr,
          kcal: Number(w.active_kcal ?? 0),
          pace: paceMinPerMile(km, durMin),
          mpb: avgHr ? metresPerBeat(km, durMin, avgHr) : null,
        };
      })
      .sort((a, b) => a.ts - b.ts);
  }, [workouts]);

  // Estimated HR max from observed peaks (floored so zone math stays sane).
  const hrMaxEst = useMemo(() => {
    const maxes = runs.map((r) => r.maxHr).filter((v): v is number => v != null);
    return Math.max(188, ...(maxes.length ? maxes : [0]));
  }, [runs]);

  const [targetHr, setTargetHr] = useState(150);

  const derived = useMemo(() => {
    if (runs.length < 3) return null;

    const totalMi = runs.reduce((s, r) => s + r.mi, 0);
    const totalMin = runs.reduce((s, r) => s + r.durMin, 0);
    const totalKcal = runs.reduce((s, r) => s + r.kcal, 0);
    const overallPace = totalMin / totalMi;

    const withHr = runs.filter((r) => r.avgHr != null);
    const avgHrAll = withHr.length ? mean(withHr.map((r) => r.avgHr!)) : null;
    const avgMpb = runs.filter((r) => r.mpb != null).map((r) => r.mpb!);
    const avgEff = avgMpb.length ? mean(avgMpb) : null;

    const longest = runs.reduce((m, r) => (r.mi > m.mi ? r : m), runs[0]);
    // best pace only among "real" runs (>= 1.5 mi) to avoid sprint artefacts
    const pacers = runs.filter((r) => r.mi >= 1.5);
    const fastest = (pacers.length ? pacers : runs).reduce((m, r) => (r.pace < m.pace ? r : m));

    // weekly mileage + weekly TRIMP load
    const weeks = new Map<string, { start: string; mi: number; load: number; runs: number }>();
    for (const r of runs) {
      const { key, start } = isoWeek(r.date);
      const cur = weeks.get(key) ?? { start, mi: 0, load: 0, runs: 0 };
      cur.mi += r.mi;
      cur.runs += 1;
      if (r.avgHr != null) cur.load += trimp(r.durMin, r.avgHr, REST_HR, hrMaxEst);
      weeks.set(key, cur);
    }
    const weekRows = [...weeks.values()].sort((a, b) => a.start.localeCompare(b.start));
    const weeklyMiBars = weekRows.map((w) => ({ label: weekStartLabel(w.start), value: +w.mi.toFixed(1) }));
    const weeklyLoadBars = weekRows.map((w) => ({ label: weekStartLabel(w.start), value: Math.round(w.load) }));
    const biggestWeek = weekRows.reduce((m, w) => (w.mi > m.mi ? w : m), weekRows[0]);
    const avgWeeklyMi = mean(weekRows.map((w) => w.mi));

    // effort distribution (by HR zone) — runs + mileage
    const effortRuns: Record<Effort, number> = { easy: 0, moderate: 0, hard: 0 };
    const effortMi: Record<Effort, number> = { easy: 0, moderate: 0, hard: 0 };
    let classified = 0;
    for (const r of withHr) {
      const e = zoneEffort(hrZone(r.avgHr!, hrMaxEst));
      effortRuns[e] += 1;
      effortMi[e] += r.mi;
      classified += 1;
    }

    // ACWR (load spike monitor)
    const dailyLoad = new Map<string, number>();
    for (const r of runs) {
      if (r.avgHr == null) continue;
      dailyLoad.set(r.date, (dailyLoad.get(r.date) ?? 0) + trimp(r.durMin, r.avgHr, REST_HR, hrMaxEst));
    }
    const loadSeries = [...dailyLoad.entries()].map(([date, value]) => ({ date, value }));
    const acute = runs.length ? acwr(loadSeries, runs[runs.length - 1].date) : null;

    // aerobic-efficiency trend (regression of metres/beat over time)
    const effPts = runs.filter((r) => r.mpb != null);
    const effReg = effPts.length >= 4
      ? linreg(effPts.map((r) => ({ x: (r.ts - effPts[0].ts) / 86_400_000, y: r.mpb! })))
      : null;

    // pace trend regression (min/mi over time) — negative slope = getting faster
    const paceReg = linreg(runs.map((r) => ({ x: (r.ts - runs[0].ts) / 86_400_000, y: r.pace })));

    return {
      totalMi, totalMin, totalKcal, overallPace, avgHrAll, avgEff,
      longest, fastest, weekRows, weeklyMiBars, weeklyLoadBars, biggestWeek, avgWeeklyMi,
      effortRuns, effortMi, classified, acute, effReg, paceReg,
    };
  }, [runs, hrMaxEst]);

  // pace-over-time series (decimal min/mi)
  const paceSeries = useMemo(() => runs.map((r) => ({ date: r.date, value: +r.pace.toFixed(2) })), [runs]);
  // aerobic efficiency over time (metres / beat)
  const effSeries = useMemo(
    () => runs.filter((r) => r.mpb != null).map((r) => ({ date: r.date, value: +r.mpb!.toFixed(3) })),
    [runs],
  );

  // pace at a standardized HR (±7 bpm band) — the fitness-isolating view
  const stdHr = useMemo(() => {
    const band = runs.filter((r) => r.avgHr != null && Math.abs(r.avgHr - targetHr) <= 7);
    const series = band.map((r) => ({ date: r.date, value: +r.pace.toFixed(2) }));
    let delta: { first: number; last: number; firstDate: string; lastDate: string } | null = null;
    if (band.length >= 2) {
      // compare mean pace of first third vs last third for robustness
      const k = Math.max(1, Math.floor(band.length / 3));
      const firstAvg = mean(band.slice(0, k).map((r) => r.pace));
      const lastAvg = mean(band.slice(-k).map((r) => r.pace));
      delta = { first: firstAvg, last: lastAvg, firstDate: band[0].date, lastDate: band[band.length - 1].date };
    }
    return { band, series, delta };
  }, [runs, targetHr]);

  // pace-vs-HR scatter geometry
  const scatter = useMemo(() => {
    const pts = runs.filter((r) => r.avgHr != null);
    if (pts.length < 2) return null;
    const hrs = pts.map((r) => r.avgHr!);
    const paces = pts.map((r) => r.pace);
    const hrMin = Math.min(...hrs) - 3, hrMax = Math.max(...hrs) + 3;
    const pMin = Math.min(...paces) - 0.2, pMax = Math.max(...paces) + 0.2;
    return { pts, hrMin, hrMax, pMin, pMax };
  }, [runs]);

  if (!derived) {
    return (
      <EmptyState
        icon={Activity}
        title="Not enough runs yet"
        text="The performance lab needs at least a few logged runs with distance and duration to compute pace, aerobic efficiency, and training load."
      />
    );
  }

  const d = derived;
  const effortOrder: Effort[] = ["easy", "moderate", "hard"];
  const classifiedMi = d.effortMi.easy + d.effortMi.moderate + d.effortMi.hard;
  const easyPct = classifiedMi > 0 ? (d.effortMi.easy / classifiedMi) * 100 : 0;

  const kpis: Kpi[] = [
    { icon: Route, color: "#fb923c", label: "Total distance", value: +d.totalMi.toFixed(0), suffix: " mi", sub: `${runs.length} runs logged` },
    { icon: Activity, color: "#34d399", label: "Avg weekly", value: +d.avgWeeklyMi.toFixed(1), decimals: 1, suffix: " mi", sub: `over ${d.weekRows.length} weeks` },
    { icon: GaugeIcon, color: "#60a5fa", label: "Avg pace", value: 0, suffix: "", sub: "per mile", animate: false, prefix: "" },
    { icon: Zap, color: "#f87171", label: "Best pace", value: 0, suffix: "", sub: `${d.fastest.mi.toFixed(1)} mi on ${fmtDay(d.fastest.date)}`, animate: false },
    { icon: HeartPulse, color: "#fb7185", label: "Avg HR", value: d.avgHrAll ? +d.avgHrAll.toFixed(0) : 0, suffix: " bpm", sub: `est. HRmax ~${hrMaxEst}` },
    { icon: Wind, color: "#2dd4bf", label: "Aerobic eff.", value: d.avgEff ? +d.avgEff.toFixed(2) : 0, decimals: 2, suffix: " m/beat", sub: "distance per heartbeat" },
  ];

  // insights
  const insights: Insight[] = [];
  if (d.effReg && Math.abs(d.effReg.slope) > 1e-4) {
    const per100 = d.effReg.slope * 100;
    insights.push(
      d.effReg.slope > 0
        ? { icon: TrendingUp, color: "#34d399", title: "Aerobic engine improving", text: `Your metres-per-beat is trending up (~${per100.toFixed(2)} m/beat per 100 days, r²=${d.effReg.r2.toFixed(2)}). You're covering more ground per heartbeat — the signature of a fitter aerobic system.` }
        : { icon: TrendingDown, color: "#f59e0b", title: "Efficiency drifting down", text: `Metres-per-beat is trending slightly down (r²=${d.effReg.r2.toFixed(2)}). Could be heat, fatigue, or harder routes — worth watching, not alarming.` },
    );
  }
  if (d.paceReg.slope < -1e-4) {
    insights.push({ icon: Zap, color: "#22d3ee", title: "Getting faster overall", text: `Across all runs your pace is trending faster (~${Math.abs(d.paceReg.slope * 30 * 60).toFixed(0)} sec/mi per month). Remember routes aren't normalized, so treat as a rough signal.` });
  }
  if (d.classified > 0) {
    insights.push(
      easyPct >= 75
        ? { icon: Wind, color: "#34d399", title: "Good easy/hard balance", text: `${easyPct.toFixed(0)}% of your mileage is easy (Zone 1–2) — right in the 80/20 zone elite endurance athletes use to build a base without burning out.` }
        : { icon: Mountain, color: "#f59e0b", title: "Running a bit hot", text: `Only ${easyPct.toFixed(0)}% of mileage is truly easy. Most endurance plans aim for ~80% easy — adding slower Zone 2 volume tends to raise the ceiling faster than grinding.` },
    );
  }
  if (d.acute) {
    const r = d.acute.ratio;
    insights.push(
      r > 1.5
        ? { icon: Flame, color: "#f87171", title: "Load spiking", text: `Your acute:chronic load ratio is ${r.toFixed(2)} — this week is well above your 4-week norm. Spikes above ~1.5 are where injury risk climbs; consider an easier few days.` }
        : r < 0.8
        ? { icon: Minus, color: "#60a5fa", title: "Detraining / taper", text: `Acute:chronic load is ${r.toFixed(2)} — you're running below your recent norm. Fine for recovery or a taper; not enough to lose fitness short-term.` }
        : { icon: GaugeIcon, color: "#34d399", title: "Load in the sweet spot", text: `Acute:chronic load ratio is ${r.toFixed(2)} — comfortably inside the ~0.8–1.3 band associated with productive, lower-risk training.` },
    );
  }
  insights.push({ icon: Trophy, color: "#fb923c", title: "Biggest week", text: `Your highest-volume week started ${fmtDay(d.biggestWeek.start)} at ${d.biggestWeek.mi.toFixed(1)} mi across ${d.biggestWeek.runs} runs.` });

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="space-y-6">
      <Narrative icon={Sparkles} accent="#fb923c" title="Your running engine">
        Across <span className="text-white font-medium">{runs.length} runs</span> ({fmtDay(runs[0].date)} – {fmtDay(runs[runs.length - 1].date)}) you&apos;ve covered{" "}
        <span className="text-orange-300 font-medium">{d.totalMi.toFixed(0)} mi</span> in{" "}
        <span className="text-white font-medium">{Math.round(d.totalMin / 60)} hours</span>, averaging{" "}
        <span className="text-white font-medium">{formatPace(d.overallPace)}/mi</span>
        {d.avgHrAll != null && <> at ~{d.avgHrAll.toFixed(0)} bpm</>}. Below: pace, aerobic efficiency, training load, and how fast you run at a fixed heart rate — the cleanest read on fitness.
      </Narrative>

      {/* KPIs — pace ones rendered as formatted m:ss via custom cards below the grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          const isPace = k.label === "Avg pace" || k.label === "Best pace";
          const paceText = k.label === "Avg pace" ? `${formatPace(d.overallPace)}` : `${formatPace(d.fastest.pace)}`;
          return (
            <div key={k.label} className="glass rounded-2xl border border-white/8 p-4 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-[0.07]"><Icon size={72} /></div>
              <div className="flex items-center gap-2 mb-2"><Icon size={15} style={{ color: k.color }} /><span className="text-[11px] uppercase tracking-wide text-readable-faint">{k.label}</span></div>
              <div className="text-2xl font-bold text-white leading-none">
                {isPace ? <span>{paceText}<span className="text-sm font-normal text-readable-faint"> /mi</span></span> : `${k.value.toLocaleString(undefined, { minimumFractionDigits: k.decimals ?? 0, maximumFractionDigits: k.decimals ?? 0 })}${k.suffix ?? ""}`}
              </div>
              <div className="text-[11px] text-readable-faint mt-1.5">{k.sub}</div>
            </div>
          );
        })}
      </motion.div>

      <InsightGrid insights={insights} />

      {/* Weekly mileage */}
      <SectionCard title="Weekly mileage" subtitle="Total miles per ISO week — your training volume over time." icon={Route} iconColor="#fb923c">
        <BarChart data={d.weeklyMiBars} singleColor="#fb923c" unit="mi" decimals={1} />
      </SectionCard>

      {/* Pace + aerobic efficiency side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Pace over time" subtitle="Per-run pace (min/mi) — lower is faster. Routes aren't normalized." icon={GaugeIcon} iconColor="#60a5fa">
          <TrendChart data={paceSeries} color="#60a5fa" unit="min/mi" showAvg avgWindow={5} markMinMax height={240} />
        </SectionCard>
        <SectionCard title="Aerobic efficiency" subtitle="Metres covered per heartbeat — higher means a fitter engine." icon={Wind} iconColor="#2dd4bf">
          {effSeries.length >= 2
            ? <TrendChart data={effSeries} color="#2dd4bf" unit="m/beat" showAvg avgWindow={5} height={240} />
            : <div className="text-sm text-readable-faint py-10 text-center">Not enough HR-tagged runs.</div>}
        </SectionCard>
      </div>

      {/* Pace at a standardized HR — the fitness isolator */}
      <SectionCard
        title="Pace at a fixed heart rate"
        subtitle="The cleanest fitness signal: at the same effort (HR), are you running faster over time? Pick a target HR; runs within ±7 bpm are shown."
        icon={Crosshair}
        iconColor="#a78bfa"
        right={<Pill color="#a78bfa">{stdHr.band.length} runs near {targetHr} bpm</Pill>}
      >
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-readable-soft">Target HR: <span className="text-white font-semibold">{targetHr} bpm</span></span>
            <span className="text-[11px] text-readable-faint">band ±7 bpm</span>
          </div>
          <input type="range" min={130} max={170} value={targetHr} onChange={(e) => setTargetHr(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #a78bfa 0%, #a78bfa ${((targetHr - 130) / 40) * 100}%, rgba(255,255,255,0.1) ${((targetHr - 130) / 40) * 100}%, rgba(255,255,255,0.1) 100%)` }} />
        </div>
        {stdHr.series.length >= 2 ? (
          <>
            <TrendChart key={targetHr} data={stdHr.series} color="#a78bfa" unit="min/mi" showAvg avgWindow={3} markMinMax height={220} />
            {stdHr.delta && (
              <p className="text-xs text-readable-faint mt-3 border-l-2 border-violet-500/50 pl-3">
                At ~{targetHr} bpm, average pace went from <span className="text-white">{formatPace(stdHr.delta.first)}/mi</span> ({fmtDay(stdHr.delta.firstDate)}) to{" "}
                <span className={stdHr.delta.last < stdHr.delta.first ? "text-emerald-300" : "text-amber-300"}>{formatPace(stdHr.delta.last)}/mi</span> ({fmtDay(stdHr.delta.lastDate)}) —{" "}
                {stdHr.delta.last < stdHr.delta.first
                  ? `${Math.round((stdHr.delta.first - stdHr.delta.last) * 60)} sec/mi faster at the same heart rate. That's fitness.`
                  : "about the same or slightly slower at this effort."}
              </p>
            )}
          </>
        ) : (
          <div className="text-sm text-readable-faint py-10 text-center">Not enough runs near {targetHr} bpm — drag to a more common heart rate.</div>
        )}
      </SectionCard>

      {/* Pace vs HR scatter */}
      {scatter && (
        <SectionCard title="Pace vs heart rate" subtitle="Every run: lower-left is fast-and-easy. Points drifting toward lower-left over time means improving fitness." icon={Crosshair} iconColor="#22d3ee">
          <PaceHrScatter scatter={scatter} hrMaxEst={hrMaxEst} />
          <div className="flex flex-wrap gap-3 mt-3">
            {effortOrder.map((e) => (
              <span key={e} className="flex items-center gap-1.5 text-[11px] text-readable-soft">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: EFFORT_META[e].color }} /> {EFFORT_META[e].label}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Effort distribution + Training load */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Easy vs hard distribution" subtitle="Share of mileage by heart-rate zone. Aim ~80% easy." icon={Wind} iconColor="#34d399">
          {d.classified > 0 ? (
            <div className="space-y-3">
              <div className="flex h-4 rounded-full overflow-hidden border border-white/10">
                {effortOrder.map((e) => {
                  const pct = classifiedMi > 0 ? (d.effortMi[e] / classifiedMi) * 100 : 0;
                  return pct > 0 ? <div key={e} style={{ width: `${pct}%`, background: EFFORT_META[e].color }} title={`${EFFORT_META[e].label}: ${pct.toFixed(0)}%`} /> : null;
                })}
              </div>
              {effortOrder.map((e) => {
                const pct = classifiedMi > 0 ? (d.effortMi[e] / classifiedMi) * 100 : 0;
                return (
                  <div key={e} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: EFFORT_META[e].color }} />
                    <span className="text-readable-soft">{EFFORT_META[e].label}</span>
                    <span className="ml-auto text-white font-medium">{pct.toFixed(0)}%</span>
                    <span className="text-readable-faint w-16 text-right">{d.effortMi[e].toFixed(1)} mi</span>
                  </div>
                );
              })}
              <p className="text-[11px] text-readable-faint pt-1">Zones estimated from average HR vs an assumed HRmax of {hrMaxEst} — directional, not lab-precise.</p>
            </div>
          ) : <div className="text-sm text-readable-faint py-8 text-center">No HR data to classify zones.</div>}
        </SectionCard>

        <SectionCard title="Weekly training load" subtitle="Banister TRIMP per week (duration × HR intensity)." icon={Flame} iconColor="#f87171">
          <BarChart data={d.weeklyLoadBars} singleColor="#f87171" unit="TRIMP" />
          {d.acute && (
            <p className="text-[11px] text-readable-faint mt-3">
              Acute:chronic load ratio <span className="text-white font-medium">{d.acute.ratio.toFixed(2)}</span> · sweet spot ~0.8–1.3.
            </p>
          )}
        </SectionCard>
      </div>

      {/* Personal records */}
      <SectionCard title="Personal records" icon={Trophy} iconColor="#fbbf24">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <PrCard label="Fastest pace" value={`${formatPace(d.fastest.pace)}/mi`} sub={`${d.fastest.mi.toFixed(1)} mi · ${fmtDay(d.fastest.date)}`} color="#22d3ee" />
          <PrCard label="Longest run" value={`${d.longest.mi.toFixed(1)} mi`} sub={fmtDay(d.longest.date)} color="#fb923c" />
          <PrCard label="Biggest week" value={`${d.biggestWeek.mi.toFixed(1)} mi`} sub={`week of ${fmtDay(d.biggestWeek.start)}`} color="#34d399" />
          <PrCard label="Best efficiency" value={d.avgEff ? `${Math.max(...runs.filter((r) => r.mpb != null).map((r) => r.mpb!)).toFixed(2)} m/beat` : "—"} sub="most ground per beat" color="#2dd4bf" />
          <PrCard label="Total time" value={`${Math.round(d.totalMin / 60)} h`} sub={`${Math.round(d.totalKcal).toLocaleString()} kcal burned`} color="#a78bfa" />
          <PrCard label="Avg run" value={`${(d.totalMi / runs.length).toFixed(1)} mi`} sub={`${Math.round(d.totalMin / runs.length)} min typical`} color="#60a5fa" />
        </div>
        <p className="text-[11px] text-readable-faint mt-4 flex items-start gap-1.5">
          <Mountain size={13} className="mt-0.5 shrink-0" />
          Honest caveat: runs aren&apos;t normalized for elevation, temperature, surface, or route, and the dataset has no cadence or elevation. Compare like-for-like before reading too much into a single fast day.
        </p>
      </SectionCard>
    </motion.div>
  );
}

function PrCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
      <div className="text-[10px] uppercase tracking-wide text-readable-faint mb-1">{label}</div>
      <div className="text-base font-bold text-white leading-tight" style={{ color }}>{value}</div>
      <div className="text-[10px] text-readable-faint mt-1">{sub}</div>
    </div>
  );
}

function PaceHrScatter({
  scatter,
  hrMaxEst,
}: {
  scatter: { pts: Run[]; hrMin: number; hrMax: number; pMin: number; pMax: number };
  hrMaxEst: number;
}) {
  const W = 680, H = 280, PAD = { top: 16, right: 16, bottom: 34, left: 46 };
  const innerW = W - PAD.left - PAD.right, innerH = H - PAD.top - PAD.bottom;
  const x = (hr: number) => PAD.left + ((hr - scatter.hrMin) / (scatter.hrMax - scatter.hrMin || 1)) * innerW;
  // pace: lower (faster) at TOP
  const y = (p: number) => PAD.top + ((p - scatter.pMin) / (scatter.pMax - scatter.pMin || 1)) * innerH;

  const xTicks = 4, yTicks = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }}>
      {Array.from({ length: yTicks + 1 }, (_, k) => {
        const p = scatter.pMin + (k / yTicks) * (scatter.pMax - scatter.pMin);
        return (
          <g key={`y${k}`}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(p)} y2={y(p)} stroke="rgba(255,255,255,0.06)" />
            <text x={PAD.left - 6} y={y(p) + 3} textAnchor="end" fontSize="9" className="fill-white/40">{formatPace(p)}</text>
          </g>
        );
      })}
      {Array.from({ length: xTicks + 1 }, (_, k) => {
        const hr = scatter.hrMin + (k / xTicks) * (scatter.hrMax - scatter.hrMin);
        return <text key={`x${k}`} x={x(hr)} y={H - 16} textAnchor="middle" fontSize="9" className="fill-white/40">{Math.round(hr)}</text>;
      })}
      <text x={W / 2} y={H - 3} textAnchor="middle" fontSize="9" className="fill-white/35">avg heart rate (bpm) →</text>
      {scatter.pts.map((r, i) => {
        const e = zoneEffort(hrZone(r.avgHr!, hrMaxEst));
        const radius = 3 + Math.min(6, r.mi / 1.5);
        return (
          <motion.circle key={r.id} cx={x(r.avgHr!)} cy={y(r.pace)} r={radius}
            fill={EFFORT_META[e].color} fillOpacity={0.5} stroke={EFFORT_META[e].color} strokeWidth={1}
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.01 }}>
            <title>{`${fmtDay(r.date)} · ${r.mi.toFixed(1)} mi · ${formatPace(r.pace)}/mi · ${r.avgHr} bpm`}</title>
          </motion.circle>
        );
      })}
    </svg>
  );
}
