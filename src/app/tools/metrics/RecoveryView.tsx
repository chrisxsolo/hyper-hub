"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  HeartPulse, Activity, Sparkles, TrendingUp, TrendingDown, Minus,
  Wind, Footprints, ShieldCheck, AlertTriangle, Gauge as GaugeIcon,
} from "lucide-react";
import TrendChart from "@/components/charts/TrendChart";
import BarChart from "@/components/charts/BarChart";
import {
  fadeUp, type Kpi, KpiGrid, InsightGrid, type Insight, SectionCard, Narrative,
  Pill, ConfidenceBadge, EmptyState,
} from "@/components/health/ui";
import type { VitalsRow } from "@/lib/health/types";
import {
  analyzeDeviation, baseline, mean, median, linreg, isoToMs, DAY_MS,
  type DeviationReport,
} from "@/lib/health/stats";

const monthLabel = (ym: string) => new Date(ym + "-01T00:00:00").toLocaleDateString(undefined, { month: "short" });

type Field = "resting_hr" | "hrv_ms" | "cardio_recovery" | "walking_hr_avg";

function series(rows: VitalsRow[], key: Field) {
  return rows
    .filter((r) => r[key] != null)
    .map((r) => ({ date: r.measured_on, value: Number(r[key]) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// OLS slope per 30 days over a {date,value} series.
function trendPerMonth(s: { date: string; value: number }[]) {
  if (s.length < 4) return 0;
  const t0 = isoToMs(s[0].date);
  return linreg(s.map((p) => ({ x: (isoToMs(p.date) - t0) / DAY_MS, y: p.value }))).slope * 30;
}

export default function RecoveryView({ vitals }: { vitals: VitalsRow[] }) {
  const data = useMemo(() => {
    const rhr = series(vitals, "resting_hr");
    const hrv = series(vitals, "hrv_ms");
    const recov = series(vitals, "cardio_recovery");
    const walk = series(vitals, "walking_hr_avg");
    if (rhr.length < 4 && hrv.length < 4) return null;

    const rhrReport = analyzeDeviation(rhr);
    const hrvReport = analyzeDeviation(hrv);

    const monthly = new Map<string, number[]>();
    for (const p of rhr) {
      const m = p.date.slice(0, 7);
      (monthly.get(m) ?? monthly.set(m, []).get(m)!).push(p.value);
    }
    const monthlyRhr = [...monthly.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([m, vs]) => ({ label: monthLabel(m), value: +median(vs).toFixed(1) }));

    return {
      rhr, hrv, recov, walk, rhrReport, hrvReport, monthlyRhr,
      rhrTrend: trendPerMonth(rhr),
      hrvTrend: trendPerMonth(hrv),
      recovTrend: trendPerMonth(recov),
    };
  }, [vitals]);

  if (!data) {
    return (
      <EmptyState
        icon={HeartPulse}
        title="No recovery data yet"
        text="Import daily resting heart rate and HRV (e.g. from Apple Health) to unlock recovery baselines, trends, and deviation signals."
      />
    );
  }

  const { rhr, hrv, recov, walk, rhrReport, hrvReport, monthlyRhr } = data;
  const latest = (s: { value: number }[]) => (s.length ? s[s.length - 1].value : null);
  const rhrNow = latest(rhr);
  const hrvNow = latest(hrv);
  const recovNow = latest(recov);
  const walkNow = latest(walk);

  const rhr28 = baseline(rhr.slice(-28).map((p) => p.value));
  const hrv28 = baseline(hrv.slice(-28).map((p) => p.value));

  const kpis: Kpi[] = [
    { icon: HeartPulse, color: "#fb7185", label: "Resting HR", value: rhrNow ?? 0, suffix: " bpm",
      sub: `28-day normal ${rhr28.lo.toFixed(0)}–${rhr28.hi.toFixed(0)}` },
    { icon: Activity, color: "#34d399", label: "HRV", value: hrvNow ?? 0, suffix: " ms",
      sub: `28-day normal ${hrv28.lo.toFixed(0)}–${hrv28.hi.toFixed(0)}` },
    { icon: HeartPulse, color: "#f472b6", label: "Avg resting HR", value: +mean(rhr.slice(-28).map((p) => p.value)).toFixed(0), suffix: " bpm",
      sub: "last 28 days" },
    { icon: Activity, color: "#2dd4bf", label: "Avg HRV", value: +mean(hrv.slice(-28).map((p) => p.value)).toFixed(0), suffix: " ms",
      sub: "last 28 days · day-to-day noisy" },
    { icon: Wind, color: "#22d3ee", label: "Cardio recovery", value: recovNow ?? 0, decimals: 1, suffix: " bpm",
      sub: recov.length ? "1-min post-exercise drop" : "no data" },
    { icon: Footprints, color: "#a78bfa", label: "Walking HR", value: walkNow ?? 0, decimals: 1, suffix: " bpm",
      sub: "avg while walking" },
  ];

  const insights: Insight[] = [];
  if (Math.abs(data.rhrTrend) > 0.05) {
    insights.push(
      data.rhrTrend < 0
        ? { icon: TrendingDown, color: "#34d399", title: "Resting HR drifting down", text: `Your resting heart rate is trending ~${Math.abs(data.rhrTrend).toFixed(1)} bpm lower per month — a classic sign of improving aerobic fitness and recovery. Lower resting HR generally means a stronger, more efficient heart.` }
        : { icon: TrendingUp, color: "#f59e0b", title: "Resting HR creeping up", text: `Resting HR is trending ~${data.rhrTrend.toFixed(1)} bpm higher per month. Sustained rises can reflect accumulated fatigue, poor sleep, stress, or illness — worth watching alongside HRV.` },
    );
  }
  if (Math.abs(data.hrvTrend) > 0.5) {
    insights.push(
      data.hrvTrend > 0
        ? { icon: TrendingUp, color: "#34d399", title: "HRV trending up", text: `Heart-rate variability is trending ~${data.hrvTrend.toFixed(0)} ms higher per month. Higher HRV usually signals better parasympathetic (recovery) tone — though HRV is famously noisy day to day, so the trend matters more than any single reading.` }
        : { icon: TrendingDown, color: "#f59e0b", title: "HRV trending down", text: `HRV is trending ~${Math.abs(data.hrvTrend).toFixed(0)} ms lower per month. A falling baseline can indicate accumulated stress or under-recovery — but read the trend, not the daily spikes.` },
    );
  }
  if (recov.length >= 4 && Math.abs(data.recovTrend) > 0.05) {
    insights.push(
      data.recovTrend > 0
        ? { icon: Wind, color: "#22d3ee", title: "Faster cardio recovery", text: `Your heart is dropping ~${data.recovTrend.toFixed(1)} more bpm in the minute after exercise each month — quicker HR recovery is one of the cleanest markers of rising cardiovascular fitness.` }
        : { icon: Minus, color: "#60a5fa", title: "Cardio recovery steady", text: `Post-exercise HR recovery is roughly flat lately (${data.recovTrend.toFixed(1)} bpm/month).` },
    );
  }
  if (rhrReport) {
    insights.push(
      rhrReport.sustained
        ? { icon: AlertTriangle, color: "#f87171", title: "Resting HR deviating", text: `Today's resting HR (${rhrReport.current.toFixed(0)} bpm) sits ${rhrReport.z.toFixed(1)}σ from your 28-day baseline and has held for ${rhrReport.consecutive} days. An elevated resting HR can flag illness, alcohol, or under-recovery.` }
        : { icon: ShieldCheck, color: "#34d399", title: "Resting HR in range", text: `Resting HR is sitting inside your personal normal band — no sustained deviation. The baseline below uses a 28-day median ± MAD so single odd nights don't trip a false flag.` },
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="space-y-6">
      <Narrative icon={Sparkles} accent="#fb7185" title="Recovery read">
        <span className="text-white font-medium">{rhr.length} days</span> of resting heart rate and{" "}
        <span className="text-white font-medium">{hrv.length} days</span> of HRV ({rhr[0]?.date} – {rhr[rhr.length - 1]?.date}).{" "}
        {rhrNow != null && <>Resting HR is <span className="text-rose-300 font-medium">{rhrNow} bpm</span> </>}
        {hrvNow != null && <>and HRV <span className="text-emerald-300 font-medium">{hrvNow} ms</span> today. </>}
        Resting HR and HRV are the two best daily windows into how recovered your body is — trending down (HR) and up (HRV) is the direction you want.
      </Narrative>

      {/* Today vs baseline signal cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rhrReport && <VitalSignal label="Resting HR" unit="bpm" report={rhrReport} goodDown icon={HeartPulse} />}
        {hrvReport && <VitalSignal label="HRV" unit="ms" report={hrvReport} goodDown={false} icon={Activity} />}
      </motion.div>

      <KpiGrid kpis={kpis} />

      <InsightGrid insights={insights} heading="What recovery is telling you" />

      <SectionCard title="Resting heart rate" subtitle="Daily resting HR with a 7-day average. Lower generally means fitter and better recovered." icon={HeartPulse} iconColor="#fb7185">
        <TrendChart data={rhr.map((p) => ({ date: p.date, value: p.value }))} color="#fb7185" unit="bpm" showAvg avgWindow={7} markMinMax height={260} />
      </SectionCard>

      <SectionCard title="Heart-rate variability" subtitle="Daily HRV with a 7-day average. Higher is better, but it's very noisy night to night — trust the trend line, not the spikes." icon={Activity} iconColor="#34d399">
        <TrendChart data={hrv.map((p) => ({ date: p.date, value: p.value }))} color="#34d399" unit="ms" showAvg avgWindow={7} height={260} />
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Monthly resting HR" subtitle="Median resting HR by month." icon={GaugeIcon} iconColor="#f472b6">
          <BarChart data={monthlyRhr} singleColor="#fb7185" unit="bpm" decimals={0} />
        </SectionCard>
        <SectionCard title="Walking heart rate" subtitle="Average HR while walking — a rough cardio-efficiency proxy." icon={Footprints} iconColor="#a78bfa">
          {walk.length >= 2
            ? <TrendChart data={walk.map((p) => ({ date: p.date, value: p.value }))} color="#a78bfa" unit="bpm" showAvg avgWindow={7} height={240} />
            : <div className="text-sm text-readable-faint py-10 text-center">No walking-HR data.</div>}
        </SectionCard>
      </div>

      {recov.length >= 2 && (
        <SectionCard title="Cardio recovery" subtitle="How many bpm your heart drops in the first minute after exercise — higher means a fitter, faster-recovering heart." icon={Wind} iconColor="#22d3ee">
          <TrendChart data={recov.map((p) => ({ date: p.date, value: p.value }))} color="#22d3ee" unit="bpm" showAvg avgWindow={7} markMinMax height={240} />
        </SectionCard>
      )}

      <p className="text-[11px] text-readable-faint flex items-start gap-1.5">
        <HeartPulse size={13} className="mt-0.5 shrink-0" />
        Apple Health daily values. HRV (SDNN) swings widely day to day with sleep, alcohol, and measurement timing — the baselines here deliberately use a robust 28-day median so one bad night never reads as a trend.
      </p>
    </motion.div>
  );
}

const LEVEL_COLOR: Record<string, string> = { normal: "#64748b", mild: "#60a5fa", moderate: "#f59e0b", high: "#f87171" };

function VitalSignal({
  label, unit, report, goodDown, icon: Icon,
}: {
  label: string;
  unit: string;
  report: DeviationReport;
  goodDown: boolean;
  icon: React.ElementType;
}) {
  const color = LEVEL_COLOR[report.level];
  const bad = (goodDown && report.direction === "up") || (!goodDown && report.direction === "down");
  const statusColor = report.sustained ? (bad ? "#f87171" : "#34d399") : "#64748b";
  const StatusIcon = report.sustained ? AlertTriangle : ShieldCheck;
  return (
    <div className="glass rounded-2xl border p-4" style={{ borderColor: report.sustained ? `${statusColor}40` : "rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-white"><Icon size={15} style={{ color }} /> {label}</span>
        <StatusIcon size={15} style={{ color: statusColor }} />
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold text-white tabular-nums">{report.current.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        <span className="text-xs text-readable-faint">{unit}</span>
        <span className="ml-auto text-[11px] text-readable-faint">normal {report.baseline.lo.toFixed(0)}–{report.baseline.hi.toFixed(0)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Pill color={color}>{report.level} · {report.z >= 0 ? "+" : ""}{report.z.toFixed(1)}σ</Pill>
        {report.sustained && <Pill color={statusColor}>{report.consecutive}-day {report.direction}</Pill>}
        <ConfidenceBadge level={report.confidence} />
      </div>
    </div>
  );
}
