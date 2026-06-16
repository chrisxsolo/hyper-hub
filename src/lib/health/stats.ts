// Robust statistics & health-domain math.
//
// Design goals (per the HyperHub spec):
//  • Median / MAD based so a single abnormal day can't corrupt a baseline.
//  • Persistence-gated deviations — one weird reading is never an "alert".
//  • Honest about data confidence — every estimate carries an n.
//
// Pure, dependency-free, framework-agnostic. Safe to import in client code.

export const DAY_MS = 86_400_000;

// ── Basic descriptive statistics ────────────────────────────────────────────

export function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

export function sum(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0);
}

/** Linear-interpolated quantile (q in [0,1]). */
export function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return NaN;
  if (xs.length === 1) return xs[0];
  const sorted = [...xs].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * Math.min(1, Math.max(0, q));
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function median(xs: number[]): number {
  return quantile(xs, 0.5);
}

/** Sample standard deviation (n-1). */
export function stdev(xs: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1);
  return Math.sqrt(v);
}

/** Raw median absolute deviation about the median. */
export function mad(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const m = median(xs);
  return median(xs.map((x) => Math.abs(x - m)));
}

/**
 * MAD scaled by 1.4826 so that, for normal data, it estimates σ.
 * Falls back to the sample stdev when MAD collapses to 0 (e.g. many tied
 * values), so a deviation score is still defined.
 */
export function madStd(xs: number[]): number {
  const raw = mad(xs) * 1.4826;
  if (raw > 1e-9) return raw;
  const sd = stdev(xs);
  return sd > 1e-9 ? sd : 0;
}

/** Robust z-score: (value − center) / scale. Returns 0 when scale is 0. */
export function robustZ(value: number, center: number, scale: number): number {
  if (!Number.isFinite(scale) || scale <= 1e-9) return 0;
  return (value - center) / scale;
}

// ── Smoothing ───────────────────────────────────────────────────────────────

/** Trailing simple moving average; null until `window` points are available. */
export function movingAverage(xs: number[], window: number): (number | null)[] {
  return xs.map((_, i) => {
    if (i < window - 1) return null;
    let s = 0;
    for (let k = i - window + 1; k <= i; k++) s += xs[k];
    return s / window;
  });
}

/** Exponentially weighted moving average. alpha in (0,1]; higher = more reactive. */
export function ewma(xs: number[], alpha: number): number[] {
  const out: number[] = [];
  let prev = NaN;
  for (const x of xs) {
    prev = Number.isFinite(prev) ? alpha * x + (1 - alpha) * prev : x;
    out.push(prev);
  }
  return out;
}

// ── Regression & correlation ─────────────────────────────────────────────────

export type Reg = { slope: number; intercept: number; r: number; r2: number; n: number };

/** Ordinary least-squares fit of y on x. */
export function linreg(pts: { x: number; y: number }[]): Reg {
  const n = pts.length;
  if (n < 2) return { slope: 0, intercept: n ? pts[0].y : 0, r: 0, r2: 0, n };
  const mx = mean(pts.map((p) => p.x));
  const my = mean(pts.map((p) => p.y));
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of pts) {
    const dx = p.x - mx, dy = p.y - my;
    sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  const r = sxx === 0 || syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
  return { slope, intercept, r, r2: r * r, n };
}

/** Pearson correlation of two equal-length series. */
export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const pts = Array.from({ length: n }, (_, i) => ({ x: xs[i], y: ys[i] }));
  return linreg(pts).r;
}

/**
 * Pearson correlation of `ys` lagged by `lag` days behind `xs`.
 * Positive lag: y(t) vs x(t − lag) — i.e. does x predict y `lag` days later.
 * Series are aligned by ISO date string; only overlapping dates are used.
 */
export function laggedCorrelation(
  a: { date: string; value: number }[],
  b: { date: string; value: number }[],
  lagDays: number,
): { r: number; n: number } {
  const bMap = new Map(b.map((p) => [p.date, p.value]));
  const xs: number[] = [];
  const ys: number[] = [];
  for (const p of a) {
    const shifted = isoAddDays(p.date, lagDays);
    const yv = bMap.get(shifted);
    if (yv != null) { xs.push(p.value); ys.push(yv); }
  }
  return { r: pearson(xs, ys), n: xs.length };
}

/** Qualitative strength label for an absolute correlation coefficient. */
export function correlationStrength(r: number): string {
  const a = Math.abs(r);
  if (a < 0.1) return "no";
  if (a < 0.3) return "weak";
  if (a < 0.5) return "moderate";
  if (a < 0.7) return "strong";
  return "very strong";
}

// ── Rolling baseline & deviation engine ──────────────────────────────────────

export type Baseline = {
  center: number;      // rolling median
  scale: number;       // rolling MAD→σ
  lo: number;          // center − k·scale (normal-range floor)
  hi: number;          // center + k·scale (normal-range ceiling)
  n: number;           // points in the window
};

/**
 * Robust baseline from a window of values: median ± k·(scaled MAD).
 * k = 2 ≈ a ~95% "personal normal range" under normality.
 */
export function baseline(values: number[], k = 2): Baseline {
  const center = median(values);
  const scale = madStd(values);
  return { center, scale, lo: center - k * scale, hi: center + k * scale, n: values.length };
}

export type DeviationLevel = "normal" | "mild" | "moderate" | "high";

/** Map a robust z-score to a deviation level using |z| thresholds 1 / 2 / 3. */
export function deviationLevel(z: number): DeviationLevel {
  const a = Math.abs(z);
  if (a >= 3) return "high";
  if (a >= 2) return "moderate";
  if (a >= 1) return "mild";
  return "normal";
}

export type Confidence = "low" | "medium" | "high";

/** Data-confidence label from sample size and coverage fraction (0–1). */
export function confidence(n: number, coverage: number): Confidence {
  if (n >= 20 && coverage >= 0.7) return "high";
  if (n >= 8 && coverage >= 0.4) return "medium";
  return "low";
}

export type DeviationReport = {
  current: number;
  baseline: Baseline;
  z: number;
  pctChange: number;          // vs baseline center, in %
  level: DeviationLevel;
  direction: "up" | "down" | "flat";
  consecutive: number;        // recent points beyond ±1σ in the current direction
  sustained: boolean;         // passes the persistence gate
  confidence: Confidence;
  trendPerWeek: number;       // OLS slope over the window, per 7 days
};

/**
 * Full deviation analysis for a daily-ish series.
 *
 * Robust baseline is computed from the trailing `window` points *excluding the
 * most recent reading*, so "current" is measured against its own history. An
 * alert is only "sustained" when at least `minConsecutive` of the most recent
 * readings deviate past ±1σ in the same direction — the spec's explicit guard
 * against a "digital hypochondria vending machine".
 */
export function analyzeDeviation(
  series: { date: string; value: number }[],
  opts: { window?: number; minConsecutive?: number; alertZ?: number } = {},
): DeviationReport | null {
  const { window = 28, minConsecutive = 2, alertZ = 2 } = opts;
  if (series.length < 4) return null;
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const values = sorted.map((p) => p.value);
  const current = values[values.length - 1];

  const hist = values.slice(Math.max(0, values.length - 1 - window), values.length - 1);
  if (hist.length < 3) return null;
  const base = baseline(hist);

  const z = robustZ(current, base.center, base.scale);
  const pctChange = base.center !== 0 ? ((current - base.center) / Math.abs(base.center)) * 100 : 0;
  const level = deviationLevel(z);
  const direction = z > 0.3 ? "up" : z < -0.3 ? "down" : "flat";

  // Count consecutive recent readings beyond ±1σ in the same sign as current.
  let consecutive = 0;
  const sign = Math.sign(current - base.center);
  for (let i = values.length - 1; i >= 0; i--) {
    const zi = robustZ(values[i], base.center, base.scale);
    if (Math.sign(values[i] - base.center) === sign && Math.abs(zi) >= 1) consecutive++;
    else break;
  }

  const sustained = Math.abs(z) >= alertZ && consecutive >= minConsecutive;

  // Trend over the window via OLS on day-index.
  const recent = sorted.slice(Math.max(0, sorted.length - window));
  const t0 = isoToMs(recent[0].date);
  const reg = linreg(recent.map((p) => ({ x: (isoToMs(p.date) - t0) / DAY_MS, y: p.value })));

  const coverage = windowCoverage(sorted, window);
  return {
    current,
    baseline: base,
    z,
    pctChange,
    level,
    direction,
    consecutive,
    sustained,
    confidence: confidence(hist.length, coverage),
    trendPerWeek: reg.slope * 7,
  };
}

/** Fraction of the last `window` calendar days that actually have a reading. */
export function windowCoverage(series: { date: string }[], window: number): number {
  if (series.length === 0) return 0;
  const last = isoToMs(series[series.length - 1].date);
  const start = last - (window - 1) * DAY_MS;
  const days = new Set(series.map((p) => p.date).filter((d) => isoToMs(d) >= start));
  return Math.min(1, days.size / window);
}

// ── Date helpers (UTC-safe, ISO yyyy-mm-dd) ──────────────────────────────────

export function isoToMs(iso: string): number {
  return new Date(iso.slice(0, 10) + "T00:00:00Z").getTime();
}

export function isoAddDays(iso: string, days: number): string {
  return new Date(isoToMs(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((isoToMs(b) - isoToMs(a)) / DAY_MS);
}

/** Monday-anchored ISO week key, e.g. "2026-W07", plus the week-start date. */
export function isoWeek(iso: string): { key: string; start: string } {
  const d = new Date(isoToMs(iso));
  const day = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  const monday = new Date(d.getTime() - day * DAY_MS);
  // ISO week number
  const thursday = new Date(monday.getTime() + 3 * DAY_MS);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((thursday.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return {
    key: `${thursday.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`,
    start: monday.toISOString().slice(0, 10),
  };
}

// ── Running-domain math ──────────────────────────────────────────────────────

export const KM_PER_MILE = 1.609344;
export const MI_PER_KM = 1 / KM_PER_MILE;

/** Pace in minutes per mile. */
export function paceMinPerMile(distanceKm: number, durationMin: number): number {
  const miles = distanceKm * MI_PER_KM;
  if (miles <= 0) return NaN;
  return durationMin / miles;
}

/** Format decimal minutes as m:ss. */
export function formatPace(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return s === 60 ? `${m + 1}:00` : `${m}:${String(s).padStart(2, "0")}`;
}

/** Speed in metres per minute. */
export function speedMPerMin(distanceKm: number, durationMin: number): number {
  if (durationMin <= 0) return NaN;
  return (distanceKm * 1000) / durationMin;
}

/**
 * Aerobic efficiency as metres travelled per heartbeat:
 *   distance(m) / (avgHr · durationMin).
 * Higher is better — more ground covered per cardiac beat. A clean, intuitive
 * proxy for the spec's `running_speed / average_heart_rate`.
 */
export function metresPerBeat(distanceKm: number, durationMin: number, avgHr: number): number {
  if (avgHr <= 0 || durationMin <= 0) return NaN;
  return (distanceKm * 1000) / (avgHr * durationMin);
}

/** Friel "efficiency factor": speed(m/min) per bpm. */
export function efficiencyFactor(distanceKm: number, durationMin: number, avgHr: number): number {
  if (avgHr <= 0) return NaN;
  return speedMPerMin(distanceKm, durationMin) / avgHr;
}

export type HrZone = 1 | 2 | 3 | 4 | 5;
export type Effort = "easy" | "moderate" | "hard";

/** Classify an average HR into a zone given an estimated HR max (%HRmax bands). */
export function hrZone(avgHr: number, hrMax: number): HrZone {
  const pct = avgHr / hrMax;
  if (pct < 0.6) return 1;
  if (pct < 0.7) return 2;
  if (pct < 0.8) return 3;
  if (pct < 0.9) return 4;
  return 5;
}

export function zoneEffort(zone: HrZone): Effort {
  if (zone <= 2) return "easy";
  if (zone === 3) return "moderate";
  return "hard";
}

/**
 * Banister TRIMP (training impulse) for one session.
 * HRr = (avgHr − restHr)/(hrMax − restHr); weighted by the male coefficient
 * 0.64·e^(1.92·HRr). Returns 0 when inputs are degenerate.
 */
export function trimp(durationMin: number, avgHr: number, restHr: number, hrMax: number): number {
  const denom = hrMax - restHr;
  if (denom <= 0 || durationMin <= 0 || avgHr <= 0) return 0;
  const hrr = Math.min(1, Math.max(0, (avgHr - restHr) / denom));
  return durationMin * hrr * 0.64 * Math.exp(1.92 * hrr);
}

/**
 * Acute-to-chronic workload ratio: last-7-day load vs the 28-day daily average
 * scaled to a week. ~0.8–1.3 is the commonly cited "sweet spot"; >1.5 flags a
 * spike in load worth easing off. Returns null when there isn't enough history.
 */
export function acwr(
  dailyLoad: { date: string; value: number }[],
  asOf: string,
): { ratio: number; acute: number; chronic: number } | null {
  if (dailyLoad.length === 0) return null;
  const end = isoToMs(asOf);
  const acuteStart = end - 6 * DAY_MS;
  const chronicStart = end - 27 * DAY_MS;
  let acute = 0, chronic = 0;
  for (const d of dailyLoad) {
    const t = isoToMs(d.date);
    if (t > end) continue;
    if (t >= acuteStart) acute += d.value;
    if (t >= chronicStart) chronic += d.value;
  }
  const chronicWeekly = (chronic / 28) * 7;
  if (chronicWeekly <= 1e-9) return null;
  return { ratio: acute / chronicWeekly, acute, chronic: chronicWeekly };
}

/** Epley estimated one-rep max. Honest visualisation only, not a true 1RM. */
export function epley1RM(weightLbs: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightLbs;
  return weightLbs * (1 + reps / 30);
}
