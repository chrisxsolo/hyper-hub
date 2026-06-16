"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Apple, Beef, Flame, Utensils, Store, Target, Salad, Scale,
  TrendingUp, TrendingDown, Minus, CheckCircle2, CalendarDays, Sparkles,
} from "lucide-react";
import TrendChart from "@/components/charts/TrendChart";
import BarChart from "@/components/charts/BarChart";
import {
  AddCard, Field, HistoryList, SectionCard, Narrative, KpiGrid, InsightGrid,
  EmptyState, inputCls, fadeUp, type Kpi, type Insight,
} from "@/components/health/ui";
import { mean, median, isoWeek } from "@/lib/health/stats";
import type { NutritionRow } from "@/lib/health/types";

const fmtDay = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function NutritionView({
  rows,
  canEdit,
  saving,
  onAdd,
  onDelete,
  bodyWeightLbs,
}: {
  rows: NutritionRow[];
  canEdit: boolean;
  saving: boolean;
  onAdd: (p: Record<string, unknown>) => Promise<boolean>;
  onDelete: (id: string) => void;
  bodyWeightLbs: number | null;
}) {
  const bodyWeightKg = bodyWeightLbs != null ? bodyWeightLbs / 2.20462 : null;

  // ── Form state ──────────────────────────────────────────────────────────────
  const [eatenOn, setEatenOn] = useState(new Date().toISOString().slice(0, 10));
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [meals, setMeals] = useState("");
  const [restaurant, setRestaurant] = useState(false);
  const [planned, setPlanned] = useState(false);
  const [hunger, setHunger] = useState("");
  const [fullness, setFullness] = useState("");
  const [note, setNote] = useState("");

  // Protein target slider (g/kg)
  const [proteinTarget, setProteinTarget] = useState(1.6);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onAdd({
      eaten_on: eatenOn,
      calories: calories ? Number(calories) : null,
      protein_g: protein ? Number(protein) : null,
      carbs_g: carbs ? Number(carbs) : null,
      fat_g: fat ? Number(fat) : null,
      fiber_g: fiber ? Number(fiber) : null,
      meals: meals ? Number(meals) : null,
      restaurant: restaurant ? true : null,
      hunger: hunger ? Number(hunger) : null,
      fullness: fullness ? Number(fullness) : null,
      planned: planned ? true : null,
      note: note.trim() ? note.trim() : null,
    });
    if (ok) {
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setFiber("");
      setMeals("");
      setRestaurant(false);
      setPlanned(false);
      setHunger("");
      setFullness("");
      setNote("");
    }
  }

  const chrono = useMemo(
    () => [...rows].sort((a, b) => a.eaten_on.localeCompare(b.eaten_on)),
    [rows],
  );

  // ── Derived analytics ─────────────────────────────────────────────────────────
  const derived = useMemo(() => {
    if (!chrono.length) return null;

    const last7 = chrono.slice(-7);
    const cals7 = last7.map((r) => r.calories).filter((v): v is number => v != null).map(Number);
    const prot7 = last7.map((r) => r.protein_g).filter((v): v is number => v != null).map(Number);
    const avgCals7 = cals7.length ? mean(cals7) : null;
    const avgProt7 = prot7.length ? mean(prot7) : null;
    const proteinPerKg =
      avgProt7 != null && bodyWeightKg != null ? avgProt7 / bodyWeightKg : null;

    // Restaurant frequency: % of all logged days flagged as restaurant=true.
    const restaurantDays = chrono.filter((r) => r.restaurant === true).length;
    const restaurantPct = (restaurantDays / chrono.length) * 100;

    // Weekly average calories by ISO week.
    const weekBuckets = new Map<string, { label: string; vals: number[] }>();
    for (const r of chrono) {
      if (r.calories == null) continue;
      const { key, start } = isoWeek(r.eaten_on);
      const b = weekBuckets.get(key) ?? { label: fmtDay(start), vals: [] };
      b.vals.push(Number(r.calories));
      weekBuckets.set(key, b);
    }
    const weeklyBars = [...weekBuckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, b]) => ({ label: b.label, value: Math.round(mean(b.vals)) }));

    // Protein/kg daily trend (only when we have a body weight).
    const proteinPerKgTrend =
      bodyWeightKg != null
        ? chrono
            .filter((r) => r.protein_g != null)
            .map((r) => ({ date: r.eaten_on, value: +(Number(r.protein_g) / bodyWeightKg).toFixed(2) }))
        : [];

    // % of days meeting the protein target.
    const daysMeetingTarget = proteinPerKgTrend.filter((p) => p.value >= proteinTarget).length;
    const targetPct = proteinPerKgTrend.length
      ? (daysMeetingTarget / proteinPerKgTrend.length) * 100
      : null;

    // Whole-record medians for narrative honesty.
    const allCals = chrono.map((r) => r.calories).filter((v): v is number => v != null).map(Number);
    const allProt = chrono.map((r) => r.protein_g).filter((v): v is number => v != null).map(Number);
    const medCals = allCals.length ? median(allCals) : null;
    const medProt = allProt.length ? median(allProt) : null;

    // Planned vs restaurant adherence.
    const plannedDays = chrono.filter((r) => r.planned === true).length;
    const plannedPct = (plannedDays / chrono.length) * 100;

    return {
      avgCals7,
      avgProt7,
      proteinPerKg,
      restaurantPct,
      restaurantDays,
      weeklyBars,
      proteinPerKgTrend,
      targetPct,
      daysMeetingTarget,
      medCals,
      medProt,
      plannedPct,
      plannedDays,
      days: chrono.length,
      loggedCals: allCals.length,
    };
  }, [chrono, bodyWeightKg, proteinTarget]);

  // ── History items ─────────────────────────────────────────────────────────────
  const historyItems = useMemo(
    () =>
      rows.map((r) => {
        const cal = r.calories != null ? `${Math.round(Number(r.calories))} kcal` : "—";
        const prot = r.protein_g != null ? ` · ${Math.round(Number(r.protein_g))}g P` : "";
        const mealsTxt = r.meals != null ? `${Number(r.meals)} meals` : undefined;
        return { id: r.id, date: r.eaten_on, primary: `${cal}${prot}`, secondary: mealsTxt };
      }),
    [rows],
  );

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (!derived) {
    return (
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className="space-y-6"
      >
        <motion.div variants={fadeUp}>
          <EmptyState
            icon={Salad}
            title="No nutrition logged yet"
            text="This is a lightweight daily tracker — not a Cronometer clone. Log calories, protein, and a couple of context flags per day and the trends, protein-per-kg, and restaurant frequency will appear here."
          />
        </motion.div>
        {canEdit && (
          <NutritionForm
            eatenOn={eatenOn} setEatenOn={setEatenOn}
            calories={calories} setCalories={setCalories}
            protein={protein} setProtein={setProtein}
            carbs={carbs} setCarbs={setCarbs}
            fat={fat} setFat={setFat}
            fiber={fiber} setFiber={setFiber}
            meals={meals} setMeals={setMeals}
            restaurant={restaurant} setRestaurant={setRestaurant}
            planned={planned} setPlanned={setPlanned}
            hunger={hunger} setHunger={setHunger}
            fullness={fullness} setFullness={setFullness}
            note={note} setNote={setNote}
            saving={saving} onSubmit={submit}
          />
        )}
      </motion.div>
    );
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────────
  const kpis: Kpi[] = [
    {
      icon: Flame,
      color: "#fb923c",
      label: "7-day avg calories",
      value: derived.avgCals7 ?? 0,
      suffix: " kcal",
      sub: derived.avgCals7 != null ? "trailing week" : "no calories logged",
    },
    {
      icon: Beef,
      color: "#34d399",
      label: "7-day avg protein",
      value: derived.avgProt7 ?? 0,
      suffix: " g",
      sub: derived.avgProt7 != null ? "trailing week" : "no protein logged",
    },
    {
      icon: Scale,
      color: "#a78bfa",
      label: "Protein per kg",
      value: derived.proteinPerKg ?? 0,
      decimals: 1,
      suffix: " g/kg",
      sub: derived.proteinPerKg != null ? "vs body weight" : "—",
      animate: derived.proteinPerKg != null,
    },
    {
      icon: Store,
      color: "#f59e0b",
      label: "Restaurant days",
      value: derived.restaurantPct,
      decimals: 0,
      suffix: "%",
      sub: `${derived.restaurantDays} of ${derived.days} days`,
    },
  ];

  // ── Insights ──────────────────────────────────────────────────────────────────
  const insights: Insight[] = [];

  if (derived.targetPct != null) {
    insights.push(
      derived.targetPct >= 70
        ? {
            icon: CheckCircle2,
            color: "#34d399",
            title: "Hitting your protein target",
            text: `You cleared ${proteinTarget.toFixed(1)} g/kg on ${derived.daysMeetingTarget} of ${derived.proteinPerKgTrend.length} logged days (${derived.targetPct.toFixed(0)}%). Solid for holding muscle.`,
          }
        : {
            icon: Target,
            color: "#f59e0b",
            title: "Protein is the gap",
            text: `Only ${derived.targetPct.toFixed(0)}% of logged days reached ${proteinTarget.toFixed(1)} g/kg. Nudging a protein source into one more meal would move this fast.`,
          },
    );
  } else {
    insights.push({
      icon: Scale,
      color: "#a78bfa",
      title: "Add a body weight for g/kg",
      text: "Protein-per-kg needs a current body weight. Log one in Weight to unlock the per-kg trend and target tracking.",
    });
  }

  if (derived.restaurantPct >= 40) {
    insights.push({
      icon: Store,
      color: "#fb923c",
      title: "Eating out a lot",
      text: `${derived.restaurantPct.toFixed(0)}% of logged days included a restaurant meal — the hardest days to estimate calories accurately. Treat those numbers as rough.`,
    });
  } else {
    insights.push({
      icon: Utensils,
      color: "#60a5fa",
      title: "Mostly home-cooked",
      text: `Restaurant meals on just ${derived.restaurantPct.toFixed(0)}% of days, which makes your calorie estimates more trustworthy than typical food logs.`,
    });
  }

  insights.push({
    icon: planned ? CheckCircle2 : CalendarDays,
    color: "#22d3ee",
    title: "Planned eating",
    text: `${derived.plannedPct.toFixed(0)}% of logged days were marked as planned (${derived.plannedDays} of ${derived.days}). Planning ahead is one of the few habits that reliably predicts adherence.`,
  });

  if (derived.medCals != null && derived.avgCals7 != null) {
    const delta = derived.avgCals7 - derived.medCals;
    const Icon = delta > 120 ? TrendingUp : delta < -120 ? TrendingDown : Minus;
    const color = delta > 120 ? "#f87171" : delta < -120 ? "#34d399" : "#60a5fa";
    insights.push({
      icon: Icon,
      color,
      title: "This week vs your baseline",
      text:
        delta > 120
          ? `Your last-7-day average (~${Math.round(derived.avgCals7).toLocaleString()} kcal) is running above your median day (~${Math.round(derived.medCals).toLocaleString()}). Worth a look if the goal is a deficit.`
          : delta < -120
          ? `The last week (~${Math.round(derived.avgCals7).toLocaleString()} kcal) sits below your median day (~${Math.round(derived.medCals).toLocaleString()}) — leaning into a deficit.`
          : `Last week (~${Math.round(derived.avgCals7).toLocaleString()} kcal) is right on your usual median (~${Math.round(derived.medCals).toLocaleString()}). Steady intake.`,
    });
  }

  const dateRange = `${fmtDay(chrono[0].eaten_on)} – ${fmtDay(chrono[chrono.length - 1].eaten_on)}`;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-6"
    >
      {/* Narrative */}
      <Narrative icon={Sparkles} accent="#fb923c" title="Your nutrition snapshot">
        Across <span className="text-white font-medium">{derived.days} logged days</span> ({dateRange})
        {derived.avgCals7 != null && (
          <>
            {" "}your recent intake averages{" "}
            <span className="text-orange-300 font-medium">{Math.round(derived.avgCals7).toLocaleString()} kcal/day</span>
          </>
        )}
        {derived.avgProt7 != null && (
          <>
            {" "}with about{" "}
            <span className="text-emerald-300 font-medium">{Math.round(derived.avgProt7)}g protein</span>
            {derived.proteinPerKg != null && (
              <> (<span className="text-white font-medium">{derived.proteinPerKg.toFixed(1)} g/kg</span>)</>
            )}
          </>
        )}
        . This is a directional log, not a lab — the value is in the trend, not any single day.
      </Narrative>

      <KpiGrid kpis={kpis} />

      {/* Weekly average calories */}
      <SectionCard
        title="Weekly average calories"
        subtitle="Mean daily intake per ISO week."
        icon={Flame}
        iconColor="#fb923c"
      >
        {derived.weeklyBars.length ? (
          <BarChart data={derived.weeklyBars} singleColor="#fb923c" unit="kcal" />
        ) : (
          <p className="text-sm text-readable-faint">No calorie entries yet to chart.</p>
        )}
      </SectionCard>

      {/* Protein per kg trend + target slider */}
      <SectionCard
        title="Protein per kg"
        subtitle="Daily protein relative to body weight, with a 7-day average."
        icon={Beef}
        iconColor="#34d399"
        right={
          derived.targetPct != null ? (
            <span className="text-xs text-readable-faint">
              {derived.targetPct.toFixed(0)}% of days ≥ target
            </span>
          ) : undefined
        }
      >
        {bodyWeightKg == null ? (
          <p className="text-sm text-readable-faint">
            Log a body weight to see protein-per-kg over time.
          </p>
        ) : derived.proteinPerKgTrend.length ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <Target size={14} className="text-emerald-400 shrink-0" />
              <span className="text-xs text-readable-faint shrink-0">Target</span>
              <input
                type="range"
                min={0.8}
                max={2.4}
                step={0.1}
                value={proteinTarget}
                onChange={(e) => setProteinTarget(Number(e.target.value))}
                className="flex-1 accent-emerald-400"
                aria-label="Protein target g/kg"
              />
              <span className="text-xs font-mono text-white w-16 text-right shrink-0">
                {proteinTarget.toFixed(1)} g/kg
              </span>
            </div>
            <TrendChart
              data={derived.proteinPerKgTrend}
              color="#34d399"
              unit="g/kg"
              showAvg
              avgWindow={7}
              goal={proteinTarget}
            />
          </>
        ) : (
          <p className="text-sm text-readable-faint">No protein entries yet to chart.</p>
        )}
      </SectionCard>

      {/* Honest calories-vs-weight note */}
      <Narrative icon={Scale} accent="#60a5fa" title="Calories vs weight — the honest version">
        A food log is an estimate, not a measurement — portion sizes, restaurant meals, and untracked
        days all add error. Use these numbers to spot the <span className="text-white font-medium">direction</span> of
        your intake over weeks and compare it against the weight trend on the Weight tab. Don&apos;t read
        a single day, and don&apos;t expect the scale to follow calories one-for-one — water, sodium, and
        timing move it far more day to day.
      </Narrative>

      <InsightGrid insights={insights} />

      {canEdit && (
        <NutritionForm
          eatenOn={eatenOn} setEatenOn={setEatenOn}
          calories={calories} setCalories={setCalories}
          protein={protein} setProtein={setProtein}
          carbs={carbs} setCarbs={setCarbs}
          fat={fat} setFat={setFat}
          fiber={fiber} setFiber={setFiber}
          meals={meals} setMeals={setMeals}
          restaurant={restaurant} setRestaurant={setRestaurant}
          planned={planned} setPlanned={setPlanned}
          hunger={hunger} setHunger={setHunger}
          fullness={fullness} setFullness={setFullness}
          note={note} setNote={setNote}
          saving={saving} onSubmit={submit}
        />
      )}

      {/* History */}
      <motion.div variants={fadeUp}>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Apple size={15} className="text-rose-400" /> Daily log
        </h2>
        <HistoryList
          items={historyItems}
          canEdit={canEdit}
          onDelete={onDelete}
          emptyText="No entries yet."
        />
      </motion.div>
    </motion.div>
  );
}

// ── Form (shared between empty + populated states) ─────────────────────────────

function NutritionForm({
  eatenOn, setEatenOn,
  calories, setCalories,
  protein, setProtein,
  carbs, setCarbs,
  fat, setFat,
  fiber, setFiber,
  meals, setMeals,
  restaurant, setRestaurant,
  planned, setPlanned,
  hunger, setHunger,
  fullness, setFullness,
  note, setNote,
  saving, onSubmit,
}: {
  eatenOn: string; setEatenOn: (v: string) => void;
  calories: string; setCalories: (v: string) => void;
  protein: string; setProtein: (v: string) => void;
  carbs: string; setCarbs: (v: string) => void;
  fat: string; setFat: (v: string) => void;
  fiber: string; setFiber: (v: string) => void;
  meals: string; setMeals: (v: string) => void;
  restaurant: boolean; setRestaurant: (v: boolean) => void;
  planned: boolean; setPlanned: (v: boolean) => void;
  hunger: string; setHunger: (v: string) => void;
  fullness: string; setFullness: (v: string) => void;
  note: string; setNote: (v: string) => void;
  saving: boolean; onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <motion.div variants={fadeUp}>
      <AddCard onSubmit={onSubmit} saving={saving} submitLabel="Log day">
        <Field label="Date">
          <input type="date" value={eatenOn} onChange={(e) => setEatenOn(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Calories">
          <input type="number" step="any" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="2100" className={inputCls} />
        </Field>
        <Field label="Protein (g)">
          <input type="number" step="any" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="160" className={inputCls} />
        </Field>
        <Field label="Carbs (g)">
          <input type="number" step="any" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="210" className={inputCls} />
        </Field>
        <Field label="Fat (g)">
          <input type="number" step="any" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="70" className={inputCls} />
        </Field>
        <Field label="Fiber (g)">
          <input type="number" step="any" value={fiber} onChange={(e) => setFiber(e.target.value)} placeholder="30" className={inputCls} />
        </Field>
        <Field label="Meals">
          <input type="number" step="1" value={meals} onChange={(e) => setMeals(e.target.value)} placeholder="3" className={inputCls} />
        </Field>
        <Field label="Hunger (1-5)">
          <select value={hunger} onChange={(e) => setHunger(e.target.value)} className={inputCls}>
            <option value="">—</option>
            <option value="1">1 · stuffed</option>
            <option value="2">2</option>
            <option value="3">3 · neutral</option>
            <option value="4">4</option>
            <option value="5">5 · ravenous</option>
          </select>
        </Field>
        <Field label="Fullness (1-5)">
          <select value={fullness} onChange={(e) => setFullness(e.target.value)} className={inputCls}>
            <option value="">—</option>
            <option value="1">1 · empty</option>
            <option value="2">2</option>
            <option value="3">3 · satisfied</option>
            <option value="4">4</option>
            <option value="5">5 · over-full</option>
          </select>
        </Field>
        <Field label="Restaurant">
          <label className="flex items-center gap-2 h-[38px] px-1 text-sm text-readable-soft cursor-pointer">
            <input
              type="checkbox"
              checked={restaurant}
              onChange={(e) => setRestaurant(e.target.checked)}
              className="accent-amber-400 w-4 h-4"
            />
            Ate out
          </label>
        </Field>
        <Field label="Planned">
          <label className="flex items-center gap-2 h-[38px] px-1 text-sm text-readable-soft cursor-pointer">
            <input
              type="checkbox"
              checked={planned}
              onChange={(e) => setPlanned(e.target.checked)}
              className="accent-cyan-400 w-4 h-4"
            />
            On plan
          </label>
        </Field>
        <Field label="Note">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" className={inputCls} />
        </Field>
      </AddCard>
    </motion.div>
  );
}
