"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, MotionConfig } from "framer-motion";
import {
  ArrowLeft, ChevronLeft, ChevronRight, LogOut, Lock, Settings2,
  Flame, Beef, UtensilsCrossed, Target, CalendarDays, LineChart as LineIcon,
  CalendarRange, CheckCircle2, X, RotateCcw, AlertTriangle, Pencil,
  ScanLine, FlaskConical,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ProgressRing from "@/components/charts/ProgressRing";
import BarChart from "@/components/charts/BarChart";
import TrendChart from "@/components/charts/TrendChart";
import MealLogger, { DRAFT_KEY } from "./MealLogger";
import ProductFoodPicker from "../products/ProductFoodPicker";
import ScanFoodFlow from "./ScanFoodFlow";
import PlanTab from "./PlanTab";
import ReviewPanel from "./ReviewPanel";
import MealTimeline from "./MealTimeline";
import EditMealSheet from "./EditMealSheet";
import Sheet from "./Sheet";
import SettingsBody from "./SettingsSheet";
import {
  addDays, dbItemToProposed, fmtDayLabel, todayInTz, proposedItemToRow,
  type DbItem, type DbMeal, type MealWithItems,
} from "@/lib/nutrition/db";
import { round } from "@/lib/nutrition/units";
import { blankProposedItem, targetsOnDate } from "@/lib/nutrition/helpers";
import type {
  AliasRow, MealTemplate, MealType, NutritionSettings, ProposedItem, ProposedMeal,
  SavedFood, TargetHistoryRow,
} from "@/lib/nutrition/types";

type Tab = "today" | "plan" | "trends" | "calendar";
type PendingInput = { text: string; mealType: MealType; date: string; time: string };

const DEFAULT_CAL_TARGET = 2200;
const DEFAULT_PROTEIN_TARGET = 160;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HISTORY_DAYS = 200;

const uuid = () => {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random()}`; }
};

export default function NutritionClient({ email, canEdit }: { email: string | null; canEdit: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [meals, setMeals] = useState<MealWithItems[]>([]);
  const [settings, setSettings] = useState<NutritionSettings | null>(null);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [aliases, setAliases] = useState<AliasRow[]>([]);
  const [savedFoods, setSavedFoods] = useState<SavedFood[]>([]);
  const [targetHistory, setTargetHistory] = useState<TargetHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [flash, setFlash] = useState("");
  const [undo, setUndo] = useState<{ id: string } | null>(null);

  const tz = settings?.timezone ?? "America/Los_Angeles";
  const [tab, setTab] = useState<Tab>("today");
  const [selectedDate, setSelectedDate] = useState(() => todayInTz("America/Los_Angeles"));
  const [calMonth, setCalMonth] = useState(() => todayInTz("America/Los_Angeles").slice(0, 7));

  const [pending, setPending] = useState<PendingInput | null>(null);
  const [proposal, setProposal] = useState<ProposedMeal | null>(null);
  const [proposalToken, setProposalToken] = useState<string>("");
  const [replacingMealId, setReplacingMealId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeFailed, setAnalyzeFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyMealId, setBusyMealId] = useState<string | null>(null);
  const [editing, setEditing] = useState<MealWithItems | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [foodPickerOpen, setFoodPickerOpen] = useState(false);
  const [scanFoodOpen, setScanFoodOpen] = useState(false);

  // ── Load (server-side date-range query; excludes soft-deleted) ───────────────
  const load = useCallback(async () => {
    const cutoff = addDays(todayInTz("America/Los_Angeles"), -HISTORY_DAYS);
    const [mRes, iRes, sRes, tRes, aRes, fRes, thRes] = await Promise.all([
      supabase.from("nutrition_meals").select("*").is("deleted_at", null).gte("eaten_on", cutoff).order("consumed_at"),
      supabase.from("nutrition_meal_items").select("*").order("position"),
      supabase.from("nutrition_settings").select("*").limit(1).maybeSingle(),
      supabase.from("nutrition_meal_templates").select("*").order("name"),
      supabase.from("nutrition_aliases").select("*"),
      supabase.from("nutrition_foods").select("id,name,brand,preparation_state,basis,calories_per_100g,protein_per_100g,serving_calories,serving_protein_g,serving_label,source_type,verified,times_logged").order("times_logged", { ascending: false }),
      supabase.from("nutrition_target_history").select("*").order("effective_on"),
    ]);
    if (mRes.error) setErr(mRes.error.message);
    const byMeal = new Map<string, DbItem[]>();
    for (const it of (iRes.data ?? []) as DbItem[]) {
      const arr = byMeal.get(it.meal_id) ?? [];
      arr.push(it);
      byMeal.set(it.meal_id, arr);
    }
    setMeals(((mRes.data ?? []) as DbMeal[]).map((m) => ({ ...m, assumptions: (m.assumptions as string[] | null) ?? [], items: byMeal.get(m.id) ?? [] })));
    setSettings((sRes.data as NutritionSettings | null) ?? null);
    setTemplates((tRes.data as MealTemplate[]) ?? []);
    setAliases((aRes.data as AliasRow[]) ?? []);
    setSavedFoods((fRes.data as SavedFood[]) ?? []);
    setTargetHistory((thRes.data as TargetHistoryRow[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!flash) return; const t = setTimeout(() => setFlash(""), 3000); return () => clearTimeout(t); }, [flash]);
  useEffect(() => { if (!undo) return; const t = setTimeout(() => setUndo(null), 6000); return () => clearTimeout(t); }, [undo]);

  const calTarget = settings?.calorie_target ?? DEFAULT_CAL_TARGET;
  const proteinTarget = settings?.protein_target_g ?? DEFAULT_PROTEIN_TARGET;
  const weekStart = settings?.week_start ?? 0;
  const showRemaining = settings?.show_remaining ?? true;
  const showRollingAvg = settings?.show_rolling_avg ?? true;

  async function signOut() { await supabase.auth.signOut(); router.refresh(); }

  // Generic API helper for mutations (typed errors + request IDs from server).
  const api = useCallback(async (path: string, method: string, body?: unknown) => {
    try {
      const res = await fetch(path, {
        method,
        headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error || `Request failed (${res.status}).`); return { ok: false, data }; }
      return { ok: true, data };
    } catch {
      setErr("Network error — please retry.");
      return { ok: false, data: {} as Record<string, unknown> };
    }
  }, []);

  // ── Derived day stats ─────────────────────────────────────────────────────────
  const dayMeals = useMemo(() => meals.filter((m) => m.eaten_on === selectedDate), [meals, selectedDate]);
  const daySummary = useMemo(() => ({
    cal: round(dayMeals.reduce((s, m) => s + Number(m.total_calories), 0), 0),
    prot: round(dayMeals.reduce((s, m) => s + Number(m.total_protein_g), 0), 0),
    count: dayMeals.length,
  }), [dayMeals]);

  const calByDay = useMemo(() => {
    const m = new Map<string, { cal: number; prot: number }>();
    for (const meal of meals) {
      const prev = m.get(meal.eaten_on) ?? { cal: 0, prot: 0 };
      prev.cal += Number(meal.total_calories);
      prev.prot += Number(meal.total_protein_g);
      m.set(meal.eaten_on, prev);
    }
    return m;
  }, [meals]);

  // Target in effect on the selected day (from history).
  const dayTarget = useMemo(
    () => targetsOnDate(targetHistory, selectedDate, { calorie: calTarget, protein: proteinTarget }),
    [targetHistory, selectedDate, calTarget, proteinTarget],
  );

  // ── Analyze ──────────────────────────────────────────────────────────────────
  async function analyze(input: PendingInput, replacing: string | null = null) {
    setErr(""); setAnalyzeFailed(false); setAnalyzing(true); setPending(input); setReplacingMealId(replacing);
    const consumedAt = input.time
      ? new Date(`${input.date}T${input.time}`).toISOString()
      : new Date(`${input.date}T12:00:00`).toISOString();
    const res = await api("/api/nutrition/analyze", "POST", { text: input.text, mealType: input.mealType, consumedAt });
    setAnalyzing(false);
    if (res.ok && res.data.meal) {
      setProposal(res.data.meal as ProposedMeal);
      setProposalToken(uuid());
    } else {
      setAnalyzeFailed(true);
    }
  }

  function startManualEntry() {
    setErr(""); setAnalyzeFailed(false);
    setProposal({
      mealType: pending?.mealType ?? "other",
      consumedAt: null,
      originalText: pending?.text ?? "",
      items: [blankProposedItem()],
      totalCalories: 0,
      totalProteinGrams: 0,
      assumptions: ["Entered manually."],
      confidence: 1,
    });
    setProposalToken(uuid());
  }

  async function reanalyzeItem(index: number): Promise<ProposedItem | null> {
    if (!proposal) return null;
    const it = proposal.items[index];
    const phrase = it.originalPhrase || `${it.quantity ?? ""} ${it.unit} ${it.name}`.trim();
    const res = await api("/api/nutrition/analyze", "POST", { text: phrase, mealType: proposal.mealType, forceFresh: true });
    if (res.ok && res.data.meal?.items?.length) return res.data.meal.items[0] as ProposedItem;
    return null;
  }

  // ── Save (create) ──────────────────────────────────────────────────────────────
  async function saveMeal(items: ProposedItem[]) {
    if (!pending || !proposal || items.length === 0) return;
    setSaving(true); setErr("");
    const consumedAt = pending.time
      ? new Date(`${pending.date}T${pending.time}`).toISOString()
      : new Date(`${pending.date}T12:00:00`).toISOString();
    const res = await api("/api/nutrition/meals", "POST", {
      meal: {
        meal_type: pending.mealType,
        consumed_at: consumedAt,
        eaten_on: pending.date,
        original_text: pending.text,
        confidence: round(items.reduce((s, it) => s + it.confidence, 0) / items.length, 2),
        assumptions: proposal.assumptions,
        client_token: proposalToken || uuid(),
      },
      items: items.map((it, i) => proposedItemToRow(it, i)),
    });
    if (!res.ok) { setSaving(false); return; }
    if (replacingMealId) await api(`/api/nutrition/meals/${replacingMealId}`, "DELETE");
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setProposal(null); setPending(null); setReplacingMealId(null);
    setSelectedDate(pending.date); setSaving(false); setFlash("Meal saved.");
    await load();
  }

  // ── Edit / delete / duplicate / template ────────────────────────────────────────
  async function saveEdit(mealId: string, patch: Record<string, unknown>, items: ReturnType<typeof proposedItemToRow>[]) {
    const res = await api(`/api/nutrition/meals/${mealId}`, "PATCH", { patch, items });
    if (res.ok) { setFlash("Meal updated."); await load(); }
    return res.ok;
  }

  async function deleteMeal(mealId: string) {
    setBusyMealId(mealId);
    // Optimistic removal; offer undo.
    setMeals((prev) => prev.filter((m) => m.id !== mealId));
    const res = await api(`/api/nutrition/meals/${mealId}`, "DELETE");
    setBusyMealId(null);
    if (res.ok) setUndo({ id: mealId });
    else await load();
  }
  async function restoreMeal(mealId: string) {
    const res = await api(`/api/nutrition/meals/${mealId}/restore`, "POST");
    setUndo(null);
    if (res.ok) { setFlash("Meal restored."); await load(); }
  }

  async function duplicateOrCopy(meal: MealWithItems, date: string | null, asNow: boolean) {
    setBusyMealId(meal.id);
    const res = await api(`/api/nutrition/meals/${meal.id}/duplicate`, "POST", { eatenOn: date, asNow });
    setBusyMealId(null);
    if (res.ok) { setFlash(asNow ? "Meal duplicated." : `Copied to ${fmtDayLabel(date!)}.`); await load(); }
  }

  function recalculate(meal: MealWithItems) {
    setTab("today"); setSelectedDate(meal.eaten_on);
    analyze({ text: meal.original_text, mealType: meal.meal_type, date: meal.eaten_on, time: "" }, meal.id);
  }

  async function saveTemplate(meal: MealWithItems, name: string) {
    const res = await api("/api/nutrition/templates", "POST", {
      name, meal_type: meal.meal_type, items: meal.items.map(dbItemToProposed),
    });
    if (res.ok) { setFlash(`Saved "${name}" — add an alias in Targets to load it by phrase.`); await load(); }
  }

  // ── Settings / saved-item management ────────────────────────────────────────────
  async function saveSettings(patch: Record<string, unknown>) {
    setSaving(true);
    const res = await api("/api/nutrition/settings", "PATCH", patch);
    setSaving(false);
    if (res.ok) { setFlash("Settings saved."); setShowSettings(false); await load(); }
  }
  async function changePassword(pw: string): Promise<boolean> {
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setErr(error.message); return false; }
    setFlash("Password updated.");
    return true;
  }
  async function deleteFood(id: string) { const r = await api(`/api/nutrition/foods/${id}`, "DELETE"); if (r.ok) await load(); }
  async function deleteTemplate(id: string) { const r = await api(`/api/nutrition/templates/${id}`, "DELETE"); if (r.ok) await load(); }
  async function createAlias(phrase: string, templateId: string) { const r = await api("/api/nutrition/aliases", "POST", { phrase, template_id: templateId }); if (r.ok) { setFlash("Alias added."); await load(); } }
  async function deleteAlias(id: string) { const r = await api(`/api/nutrition/aliases/${id}`, "DELETE"); if (r.ok) await load(); }

  // ── Week / month / trend data ─────────────────────────────────────────────────
  const weekBars = useMemo(() => {
    const out: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(selectedDate, -i);
      const day = Number(d.split("-")[2]);
      const wd = new Date(`${d}T12:00:00`).getDay();
      out.push({ label: `${WEEKDAYS[wd]} ${day}`, value: round(calByDay.get(d)?.cal ?? 0, 0) });
    }
    return out;
  }, [selectedDate, calByDay]);

  const calTrend = useMemo(() => {
    const out: { date: string; value: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(selectedDate, -i);
      const cal = calByDay.get(d)?.cal;
      if (cal != null) out.push({ date: d, value: round(cal, 0) });
    }
    return out;
  }, [selectedDate, calByDay]);

  const proteinTrend = useMemo(() => {
    const out: { date: string; value: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(selectedDate, -i);
      const prot = calByDay.get(d)?.prot;
      if (prot != null) out.push({ date: d, value: round(prot, 0) });
    }
    return out;
  }, [selectedDate, calByDay]);

  const loggedDays = useMemo(() => calByDay.size, [calByDay]);
  const avg7 = useMemo(() => { const v = weekBars.map((b) => b.value).filter((x) => x > 0); return v.length ? round(v.reduce((a, b) => a + b, 0) / v.length, 0) : 0; }, [weekBars]);
  const avg30Cal = useMemo(() => { const v = calTrend.map((p) => p.value); return v.length ? round(v.reduce((a, b) => a + b, 0) / v.length, 0) : 0; }, [calTrend]);
  const avg30Prot = useMemo(() => { const v = proteinTrend.map((p) => p.value); return v.length ? round(v.reduce((a, b) => a + b, 0) / v.length, 0) : 0; }, [proteinTrend]);

  const today = todayInTz(tz);
  const isToday = selectedDate === today;
  const remainingCal = dayTarget.calorie - daySummary.cal;
  const remainingProt = dayTarget.protein - daySummary.prot;
  const progressPct = dayTarget.calorie > 0 ? Math.round((daySummary.cal / dayTarget.calorie) * 100) : 0;

  return (
    <MotionConfig reducedMotion="user">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Back + account */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex items-center justify-between mb-8">
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-readable-soft hover:text-readable-strong transition-colors">
          <ArrowLeft size={14} /> Back to Tools
        </Link>
        <div className="flex items-center gap-3">
          {canEdit && (
            <button onClick={() => setShowSettings(true)} className="inline-flex items-center gap-1.5 text-xs text-readable-faint hover:text-readable-strong transition-colors">
              <Settings2 size={13} /> Settings
            </button>
          )}
          {email ? (
            <button onClick={signOut} className="inline-flex items-center gap-1.5 text-xs text-readable-faint hover:text-readable-strong transition-colors">
              <LogOut size={13} /> {email}
            </button>
          ) : (
            <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-readable-faint hover:text-readable-strong transition-colors">
              <Lock size={12} /> Sign in to log
            </Link>
          )}
        </div>
      </motion.div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-6 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
          <UtensilsCrossed size={20} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Nutrition Tracker</h1>
          <p className="text-sm text-readable-soft mt-0.5">Log meals naturally. Track calories and protein accurately.</p>
        </div>
      </motion.div>

      {/* Flash / error */}
      {flash && (
        <div className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={14} /> {flash}
        </div>
      )}
      {err && (
        <div className="mb-4 rounded-lg border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-200 flex items-start gap-2">
          <X size={14} className="mt-0.5 shrink-0" /><span>{err}</span>
        </div>
      )}

      {/* Day navigator */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1">
          <button onClick={() => setSelectedDate((d) => addDays(d, -1))} className="p-1.5 rounded-lg text-readable-faint hover:text-white hover:bg-white/[0.05] transition-colors" aria-label="Previous day"><ChevronLeft size={18} /></button>
          <input type="date" value={selectedDate} onChange={(e) => e.target.value && setSelectedDate(e.target.value)} className="bg-transparent text-sm font-semibold text-white px-2 py-1 rounded-lg hover:bg-white/[0.04] focus:outline-none [color-scheme:dark]" />
          <button onClick={() => setSelectedDate((d) => addDays(d, 1))} className="p-1.5 rounded-lg text-readable-faint hover:text-white hover:bg-white/[0.05] transition-colors" aria-label="Next day"><ChevronRight size={18} /></button>
          {!isToday && <button onClick={() => setSelectedDate(today)} className="ml-1 text-xs px-2 py-1 rounded-lg border border-white/10 text-readable-soft hover:bg-white/[0.05] transition-colors">Today</button>}
        </div>
        <span className="text-xs text-readable-faint hidden sm:block">{fmtDayLabel(selectedDate)}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { key: "today", label: "Today", icon: CalendarDays },
          { key: "plan", label: "Plan", icon: FlaskConical },
          { key: "trends", label: "Trends", icon: LineIcon },
          { key: "calendar", label: "Calendar", icon: CalendarRange },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${tab === key ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30" : "text-readable-soft border-white/10 hover:bg-white/[0.05]"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : tab === "today" ? (
        <div className="space-y-6">
          {/* Summary */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl border border-white/8 p-5">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex items-center gap-6">
                <ProgressRing value={daySummary.cal} target={dayTarget.calorie} label="Calories" unit="kcal" color="#fb923c" />
                <ProgressRing value={daySummary.prot} target={dayTarget.protein} label="Protein" unit="g" color="#34d399" size={132} stroke={11} />
              </div>
              <div className="grid grid-cols-2 gap-3 flex-1 w-full">
                {showRemaining ? (
                  <>
                    <MiniStat icon={Flame} color="#fb923c" label={remainingCal >= 0 ? "Remaining" : "Above target"} value={Math.abs(remainingCal)} suffix=" kcal" />
                    <MiniStat icon={Beef} color="#34d399" label={remainingProt >= 0 ? "Protein left" : "Protein over"} value={Math.abs(remainingProt)} suffix=" g" />
                  </>
                ) : (
                  <>
                    <MiniStat icon={Flame} color="#fb923c" label="Calories" value={daySummary.cal} suffix=" kcal" />
                    <MiniStat icon={Beef} color="#34d399" label="Protein" value={daySummary.prot} suffix=" g" />
                  </>
                )}
                <MiniStat icon={UtensilsCrossed} color="#60a5fa" label="Meals logged" value={daySummary.count} />
                <MiniStat icon={Target} color="#a78bfa" label="Of calorie goal" value={progressPct} suffix="%" />
              </div>
            </div>
            <div className="mt-5">
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: remainingCal >= 0 ? "#fb923c" : "#fbbf24" }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, progressPct)}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
              </div>
              {!dayTarget.historical && (
                <p className="text-[10px] text-readable-faint mt-1.5">Compared against your current target.</p>
              )}
            </div>
          </motion.div>

          {/* Logger / Review (owner) */}
          {canEdit && (
            proposal ? (
              <ReviewPanel
                proposal={proposal}
                saving={saving}
                onSave={saveMeal}
                onCancel={() => { setProposal(null); setReplacingMealId(null); }}
                onEditDescription={() => { setProposal(null); setReplacingMealId(null); }}
                onReanalyzeItem={reanalyzeItem}
              />
            ) : (
              <>
                <MealLogger defaultDate={selectedDate} busy={analyzing} onAnalyze={(input) => analyze(input)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => setScanFoodOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 text-readable-soft px-4 py-2.5 text-sm hover:bg-white/[0.05] transition-colors"
                  >
                    <ScanLine size={15} className="text-emerald-400" /> Scan a food to log
                  </button>
                  <button
                    onClick={() => setFoodPickerOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 text-readable-soft px-4 py-2.5 text-sm hover:bg-white/[0.05] transition-colors"
                  >
                    <UtensilsCrossed size={15} className="text-emerald-400" /> Log from your Costco products
                  </button>
                </div>
                {analyzeFailed && pending && (
                  <div className="glass rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-readable-soft">We couldn&apos;t fully analyze that meal. Your text is saved — you can retry or enter the items manually.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => analyze(pending, replacingMealId)} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-100 px-3 py-1.5 text-sm hover:bg-amber-500/25 transition-colors">
                        <RotateCcw size={13} /> Retry
                      </button>
                      <button onClick={startManualEntry} className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 text-readable-soft px-3 py-1.5 text-sm hover:bg-white/[0.05] transition-colors">
                        <Pencil size={13} /> Enter manually
                      </button>
                    </div>
                  </div>
                )}
              </>
            )
          )}

          {/* Timeline */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <CalendarDays size={15} className="text-emerald-400" /> {fmtDayLabel(selectedDate)}
            </h2>
            <MealTimeline
              meals={dayMeals}
              canEdit={canEdit}
              busyId={busyMealId}
              onEdit={setEditing}
              onDelete={deleteMeal}
              onDuplicate={(m) => duplicateOrCopy(m, m.eaten_on, true)}
              onCopyToDay={(m, date) => duplicateOrCopy(m, date, false)}
              onRecalculate={recalculate}
              onSaveTemplate={saveTemplate}
            />
          </div>
        </div>
      ) : tab === "plan" ? (
        <PlanTab
          savedFoods={savedFoods}
          targetHistory={targetHistory}
          calTarget={calTarget}
          proteinTarget={proteinTarget}
          selectedDate={selectedDate}
          api={api}
          onSaved={() => { setFlash("Plan saved & logged."); load(); }}
        />
      ) : tab === "trends" ? (
        <TrendsView
          weekBars={weekBars} calTrend={calTrend} proteinTrend={proteinTrend}
          calTarget={calTarget} proteinTarget={proteinTarget}
          avg7={avg7} avg30Cal={avg30Cal} avg30Prot={avg30Prot} loggedDays={loggedDays}
          showRollingAvg={showRollingAvg}
        />
      ) : (
        <CalendarView
          month={calMonth} setMonth={setCalMonth} calByDay={calByDay}
          targetHistory={targetHistory} calTarget={calTarget} proteinTarget={proteinTarget}
          weekStart={weekStart} today={today}
          onPickDay={(d) => { setSelectedDate(d); setTab("today"); }}
        />
      )}

      {/* Log a Costco product (food library → serving entry) */}
      {foodPickerOpen && (
        <ProductFoodPicker
          defaultDate={selectedDate}
          onLogged={() => { setSelectedDate(selectedDate); setFlash("Logged from your products."); load(); }}
          onClose={() => setFoodPickerOpen(false)}
        />
      )}

      {/* Scan a food → estimate/read nutrition → weigh grams → log */}
      {scanFoodOpen && (
        <ScanFoodFlow
          defaultDate={selectedDate}
          onClose={() => setScanFoodOpen(false)}
          onLogged={() => { setSelectedDate(selectedDate); setFlash("Scanned and logged."); load(); }}
          onCatalogChanged={load}
        />
      )}

      {/* Edit sheet */}
      <EditMealSheet meal={editing} onClose={() => setEditing(null)} onSave={saveEdit} />

      {/* Settings sheet */}
      <Sheet open={showSettings} title="Settings" subtitle="Targets, units, saved foods & meals, export" onClose={() => setShowSettings(false)}>
        <SettingsBody
          settings={settings} savedFoods={savedFoods} templates={templates} aliases={aliases} saving={saving}
          onSaveSettings={saveSettings} onDeleteFood={deleteFood} onDeleteTemplate={deleteTemplate}
          onCreateAlias={createAlias} onDeleteAlias={deleteAlias} onChangePassword={changePassword}
        />
      </Sheet>

      {/* Undo toast */}
      {undo && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] glass border border-white/12 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-xl shadow-black/40">
          <span className="text-sm text-readable-soft">Meal deleted.</span>
          <button onClick={() => restoreMeal(undo.id)} className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300 hover:text-emerald-200">
            <RotateCcw size={13} /> Undo
          </button>
        </motion.div>
      )}
    </div>
    </MotionConfig>
  );
}

// ── Small components ────────────────────────────────────────────────────────────
function MiniStat({ icon: Icon, color, label, value, suffix = "" }: { icon: React.ElementType; color: string; label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={13} style={{ color }} />
        <span className="text-[10px] uppercase tracking-wide text-readable-faint">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{Math.round(value).toLocaleString()}<span className="text-xs text-readable-faint font-normal">{suffix}</span></div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-[168px] h-[168px] rounded-full bg-white/[0.05]" />
            <div className="w-[132px] h-[132px] rounded-full bg-white/[0.05]" />
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1 w-full">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-[68px] rounded-xl bg-white/[0.04]" />)}
          </div>
        </div>
      </div>
      <div className="glass rounded-2xl border border-white/8 p-5 h-40 bg-white/[0.02]" />
      {[0, 1].map((i) => <div key={i} className="glass rounded-2xl border border-white/8 h-16 bg-white/[0.02]" />)}
    </div>
  );
}

function TrendsView({
  weekBars, calTrend, proteinTrend, calTarget, proteinTarget, avg7, avg30Cal, avg30Prot, loggedDays, showRollingAvg,
}: {
  weekBars: { label: string; value: number }[];
  calTrend: { date: string; value: number }[];
  proteinTrend: { date: string; value: number }[];
  calTarget: number; proteinTarget: number;
  avg7: number; avg30Cal: number; avg30Prot: number; loggedDays: number; showRollingAvg: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {showRollingAvg && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat icon={Flame} color="#fb923c" label="7-day avg cal" value={avg7} suffix=" kcal" />
          <MiniStat icon={Flame} color="#f59e0b" label="30-day avg cal" value={avg30Cal} suffix=" kcal" />
          <MiniStat icon={Beef} color="#34d399" label="30-day avg protein" value={avg30Prot} suffix=" g" />
          <MiniStat icon={CalendarDays} color="#60a5fa" label="Days logged" value={loggedDays} />
        </div>
      )}
      <div className="glass rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2"><Flame size={15} className="text-orange-400" /> Last 7 days — calories</h2>
        <p className="text-xs text-readable-faint mb-3">Daily totals leading up to the selected day.</p>
        <BarChart data={weekBars} singleColor="#fb923c" unit="kcal" />
      </div>
      <div className="glass rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2"><LineIcon size={15} className="text-orange-400" /> Calorie trend (30 days)</h2>
        <p className="text-xs text-readable-faint mb-3">Logged days only, vs your current target.</p>
        {calTrend.length >= 2 ? <TrendChart data={calTrend} color="#fb923c" unit="kcal" goal={calTarget} showAvg={showRollingAvg} avgWindow={7} /> : <p className="text-sm text-readable-faint">Log a few more days to see a trend.</p>}
      </div>
      <div className="glass rounded-2xl border border-white/8 p-5">
        <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2"><Beef size={15} className="text-emerald-400" /> Protein trend (30 days)</h2>
        <p className="text-xs text-readable-faint mb-3">Logged days only, vs your current target.</p>
        {proteinTrend.length >= 2 ? <TrendChart data={proteinTrend} color="#34d399" unit="g" goal={proteinTarget} showAvg={showRollingAvg} avgWindow={7} /> : <p className="text-sm text-readable-faint">Log a few more days to see a trend.</p>}
      </div>
    </motion.div>
  );
}

function CalendarView({
  month, setMonth, calByDay, targetHistory, calTarget, proteinTarget, weekStart, today, onPickDay,
}: {
  month: string;
  setMonth: (m: string) => void;
  calByDay: Map<string, { cal: number; prot: number }>;
  targetHistory: TargetHistoryRow[];
  calTarget: number; proteinTarget: number; weekStart: number; today: string;
  onPickDay: (d: string) => void;
}) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const startWeekday = (first.getDay() - weekStart + 7) % 7;
  const monthLabel = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const headers = Array.from({ length: 7 }, (_, i) => WEEKDAYS[(i + weekStart) % 7]);

  function shiftMonth(delta: number) {
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const cells: ({ date: string; day: number; cal: number } | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${month}-${String(d).padStart(2, "0")}`;
    cells.push({ date, day: d, cal: round(calByDay.get(date)?.cal ?? 0, 0) });
  }

  function cellStyle(cal: number, date: string) {
    if (cal <= 0) return { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" };
    const tgt = targetsOnDate(targetHistory, date, { calorie: calTarget, protein: proteinTarget }).calorie || calTarget;
    const ratio = Math.min(1.3, cal / tgt);
    const intensity = 0.1 + Math.min(0.45, ratio * 0.35);
    const color = ratio > 1.05 ? "251,191,36" : "52,211,153";
    return { background: `rgba(${color},${intensity})`, border: `1px solid rgba(${color},0.4)` };
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl border border-white/8 p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg text-readable-faint hover:text-white hover:bg-white/[0.05]" aria-label="Previous month"><ChevronLeft size={18} /></button>
        <h2 className="text-sm font-semibold text-white">{monthLabel}</h2>
        <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg text-readable-faint hover:text-white hover:bg-white/[0.05]" aria-label="Next month"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {headers.map((w) => <div key={w} className="text-center text-[10px] uppercase tracking-wide text-readable-faint">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) =>
          cell ? (
            <button key={i} onClick={() => onPickDay(cell.date)} className="aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition-transform hover:scale-105" style={cellStyle(cell.cal, cell.date)} title={cell.cal > 0 ? `${cell.cal.toLocaleString()} kcal` : "No meals logged"}>
              <span className={`text-[11px] ${cell.date === today ? "text-white font-bold" : "text-readable-soft"}`}>{cell.day}</span>
              {cell.cal > 0 && <span className="text-[9px] text-white/80 font-medium leading-tight">{Math.round(cell.cal / 100) / 10}k</span>}
            </button>
          ) : <div key={i} />,
        )}
      </div>
      <div className="flex items-center gap-4 mt-4 text-[11px] text-readable-faint">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: "rgba(52,211,153,0.35)" }} /> Near target</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: "rgba(251,191,36,0.4)" }} /> Above target</span>
      </div>
    </motion.div>
  );
}
