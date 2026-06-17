"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FlaskConical, Plus, Loader2, Check, CheckCircle2, Bookmark, UtensilsCrossed, Trash2,
} from "lucide-react";
import ProgressRing from "@/components/charts/ProgressRing";
import EditableItemsTable from "./EditableItemsTable";
import PlanAddSheet from "./PlanAddSheet";
import { mealTotals } from "@/lib/nutrition/calc";
import { targetsOnDate } from "@/lib/nutrition/helpers";
import { proposedItemToRow, MEAL_TYPE_META } from "@/lib/nutrition/db";
import {
  MEAL_TYPES, type MealType, type ProposedItem, type SavedFood, type TargetHistoryRow,
} from "@/lib/nutrition/types";

const uuid = () => {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random()}`; }
};

const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors";

type ApiResult = { ok: boolean; data: Record<string, unknown> };
type ApiFn = (path: string, method: string, body?: unknown) => Promise<ApiResult>;

// Meal planner / experiment sandbox. Compose a meal from your Costco products,
// saved foods, or AI text; totals recompute live against the day's goals. When
// it meets your protein + calorie goals, save it as a reusable template and (by
// default) log it to a chosen day.
export default function PlanTab({
  savedFoods,
  targetHistory,
  calTarget,
  proteinTarget,
  selectedDate,
  api,
  onSaved,
}: {
  savedFoods: SavedFood[];
  targetHistory: TargetHistoryRow[];
  calTarget: number;
  proteinTarget: number;
  selectedDate: string;
  api: ApiFn;
  onSaved: () => void;
}) {
  const [items, setItems] = useState<ProposedItem[]>([]);
  const [planDate, setPlanDate] = useState(selectedDate);
  const [mealType, setMealType] = useState<MealType>("dinner");
  const [templateName, setTemplateName] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => mealTotals(items), [items]);
  const target = useMemo(
    () => targetsOnDate(targetHistory, planDate, { calorie: calTarget, protein: proteinTarget }),
    [targetHistory, planDate, calTarget, proteinTarget],
  );

  const has = items.length > 0;
  const calOk = has && totals.calories <= target.calorie;
  const proteinOk = has && totals.proteinGrams >= target.protein;
  const meetsGoals = calOk && proteinOk;
  const calLeft = target.calorie - totals.calories;
  const protLeft = target.protein - totals.proteinGrams;

  async function submit(alsoLog: boolean) {
    if (!has || saving) return;
    setSaving(true);
    const name = templateName.trim() || `Planned ${MEAL_TYPE_META[mealType].label.toLowerCase()}`;
    const tRes = await api("/api/nutrition/templates", "POST", { name, meal_type: mealType, items });
    let ok = tRes.ok;
    if (alsoLog && tRes.ok) {
      const consumedAt = new Date(`${planDate}T12:00:00`).toISOString();
      const mRes = await api("/api/nutrition/meals", "POST", {
        meal: {
          meal_type: mealType,
          consumed_at: consumedAt,
          eaten_on: planDate,
          original_text: name,
          confidence: 1,
          assumptions: ["Planned meal."],
          client_token: uuid(),
        },
        items: items.map((it, i) => proposedItemToRow(it, i)),
      });
      ok = mRes.ok;
    }
    setSaving(false);
    if (ok) { setItems([]); setTemplateName(""); onSaved(); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Intro */}
      <div className="glass rounded-2xl border border-violet-500/20 p-5 bg-gradient-to-br from-violet-500/[0.06] to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical size={16} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-white">Plan a meal</h2>
          <span className="text-xs text-readable-faint">— experiment, then make it real</span>
        </div>
        <p className="text-xs text-readable-soft">
          Add foods and watch the totals move against your goals. When it hits your protein and calorie
          targets, save it as a reusable meal and log it to a day.
        </p>
      </div>

      {/* Goals */}
      <div className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-6">
            <ProgressRing value={totals.calories} target={target.calorie} label="Calories" unit="kcal" color="#fb923c" size={132} stroke={11} />
            <ProgressRing value={totals.proteinGrams} target={target.protein} label="Protein" unit="g" color="#34d399" size={132} stroke={11} />
          </div>
          <div className="flex-1 w-full space-y-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${meetsGoals ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30" : "text-readable-soft border-white/10"}`}>
              {meetsGoals ? <CheckCircle2 size={14} /> : <FlaskConical size={14} />}
              {meetsGoals ? "Meets your goals" : has ? "Keep adjusting" : "Add foods to begin"}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <GoalLine
                ok={calOk}
                label="Calories"
                text={!has ? "—" : calLeft >= 0 ? `${Math.round(calLeft)} kcal under` : `${Math.round(-calLeft)} kcal over`}
              />
              <GoalLine
                ok={proteinOk}
                label="Protein"
                text={!has ? "—" : protLeft > 0 ? `${Math.round(protLeft)} g to go` : `target met`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <UtensilsCrossed size={15} className="text-violet-400" /> Foods in this meal
          </h3>
          {has && (
            <button onClick={() => setItems([])} className="inline-flex items-center gap-1 text-xs text-readable-faint hover:text-rose-300 transition-colors">
              <Trash2 size={13} /> Clear
            </button>
          )}
        </div>

        {has ? (
          <EditableItemsTable items={items} onChange={setItems} />
        ) : (
          <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-readable-faint">No foods yet. Add some to start building your meal.</p>
          </div>
        )}

        <button
          onClick={() => setAddOpen(true)}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 text-readable-soft px-4 py-2.5 text-sm hover:bg-white/[0.05] transition-colors"
        >
          <Plus size={15} className="text-violet-400" /> Add a food
        </button>
      </div>

      {/* Save controls */}
      <div className="glass rounded-2xl border border-white/8 p-5 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {MEAL_TYPES.map((mt) => {
            const meta = MEAL_TYPE_META[mt];
            const active = mealType === mt;
            return (
              <button
                key={mt}
                onClick={() => setMealType(mt)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${active ? "text-white" : "text-readable-soft border-white/10 hover:bg-white/[0.05]"}`}
                style={active ? { background: `${meta.color}26`, borderColor: `${meta.color}66` } : undefined}
              >
                <span>{meta.emoji}</span> {meta.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <span className="text-[10px] uppercase tracking-wide text-readable-faint">Meal name</span>
            <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder={`Planned ${MEAL_TYPE_META[mealType].label.toLowerCase()}`} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-readable-faint">Log to</span>
            <input type="date" value={planDate} onChange={(e) => e.target.value && setPlanDate(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => submit(true)}
            disabled={!has || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-100 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Save &amp; log this meal
          </button>
          <button
            onClick={() => submit(false)}
            disabled={!has || saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 text-readable-soft px-4 py-2.5 text-sm font-medium hover:bg-white/[0.05] transition-colors disabled:opacity-50"
          >
            <Bookmark size={14} /> Save as template only
          </button>
        </div>
        <p className="text-[11px] text-readable-faint">
          Saving creates a reusable meal. Add an alias to it under Settings → Targets to load it by phrase later.
        </p>
      </div>

      {addOpen && (
        <PlanAddSheet
          savedFoods={savedFoods}
          mealType={mealType}
          onAdd={(newItems) => setItems((prev) => [...prev, ...newItems])}
          onClose={() => setAddOpen(false)}
        />
      )}
    </motion.div>
  );
}

function GoalLine({ ok, label, text }: { ok: boolean; label: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {ok ? <CheckCircle2 size={12} className="text-emerald-400" /> : <span className="w-3 h-3 rounded-full border border-white/20" />}
        <span className="text-[10px] uppercase tracking-wide text-readable-faint">{label}</span>
      </div>
      <div className="text-sm font-semibold text-white">{text}</div>
    </div>
  );
}
