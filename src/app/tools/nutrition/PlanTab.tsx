"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FlaskConical, Plus, Loader2, Check, CheckCircle2, Bookmark, ChevronDown, ChevronUp,
  UtensilsCrossed, Trash2,
} from "lucide-react";
import ProgressRing from "@/components/charts/ProgressRing";
import EditableItemsTable from "./EditableItemsTable";
import PlanAddSheet from "./PlanAddSheet";
import { mealTotals } from "@/lib/nutrition/calc";
import { proposedItemToRow, MEAL_TYPE_META } from "@/lib/nutrition/db";
import {
  MEAL_TYPES, type MealType, type ProposedItem, type SavedFood,
} from "@/lib/nutrition/types";

const uuid = () => {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random()}`; }
};

const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-400/40 transition-colors";

type ApiResult = { ok: boolean; data: Record<string, unknown> };
type ApiFn = (path: string, method: string, body?: unknown) => Promise<ApiResult>;

// "Plan the rest of your day": an experiment sandbox layered on top of the foods
// already logged for the selected day. Tentatively add foods and watch the
// projected day total (eaten + planned) move against your goals — how much more
// can you really eat? When happy, log it to the day (and/or save it as a
// reusable template). Collapsed by default so the Today view stays clean.
export default function PlanTab({
  savedFoods,
  day,
  dayLabel,
  isToday,
  baselineCal,
  baselineProt,
  baselineCount,
  target,
  api,
  onSaved,
}: {
  savedFoods: SavedFood[];
  day: string;
  dayLabel: string;
  isToday: boolean;
  baselineCal: number;
  baselineProt: number;
  baselineCount: number;
  target: { calorie: number; protein: number };
  api: ApiFn;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ProposedItem[]>([]);
  const [mealType, setMealType] = useState<MealType>("dinner");
  const [templateName, setTemplateName] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const planned = useMemo(() => mealTotals(items), [items]);
  const has = items.length > 0;

  const projCal = baselineCal + planned.calories;
  const projProt = baselineProt + planned.proteinGrams;
  const calLeft = target.calorie - projCal;
  const protLeft = target.protein - projProt;
  const calOk = projCal <= target.calorie;
  const proteinOk = projProt >= target.protein;
  const meetsGoals = calOk && proteinOk;
  const whenLabel = isToday ? "today" : dayLabel;

  async function submit(alsoLog: boolean) {
    if (!has || saving) return;
    setSaving(true);
    const name = templateName.trim() || `Planned ${MEAL_TYPE_META[mealType].label.toLowerCase()}`;
    const tRes = await api("/api/nutrition/templates", "POST", { name, meal_type: mealType, items });
    let ok = tRes.ok;
    if (alsoLog && tRes.ok) {
      const consumedAt = new Date(`${day}T12:00:00`).toISOString();
      const mRes = await api("/api/nutrition/meals", "POST", {
        meal: {
          meal_type: mealType,
          consumed_at: consumedAt,
          eaten_on: day,
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

  // ── Collapsed: a single inviting toggle ──────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-transparent px-4 py-3 text-left hover:from-violet-500/[0.1] transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
          <FlaskConical size={16} className="text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Plan the rest of your day</p>
          <p className="text-xs text-readable-faint">
            Add foods on top of {whenLabel}&apos;s {Math.round(baselineCal)} kcal to see what still fits.
          </p>
        </div>
        <ChevronDown size={18} className="text-readable-faint shrink-0" />
      </button>
    );
  }

  // ── Expanded panel ───────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-violet-500/20 p-5 bg-gradient-to-br from-violet-500/[0.05] to-transparent space-y-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical size={16} className="text-violet-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">Plan the rest of your day</h2>
            <p className="text-xs text-readable-faint">
              On top of the {Math.round(baselineCal)} kcal · {Math.round(baselineProt)} g you&apos;ve logged{" "}
              {isToday ? "today" : `for ${dayLabel}`}
              {baselineCount > 0 ? ` (${baselineCount} ${baselineCount === 1 ? "meal" : "meals"})` : ""}.
            </p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Collapse" className="p-1.5 rounded-md text-readable-faint hover:text-white hover:bg-white/10 transition-colors shrink-0">
          <ChevronUp size={16} />
        </button>
      </div>

      {/* Projected day */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="flex items-center gap-6">
          <ProgressRing
            value={projCal} target={target.calorie} label="Calories" unit="kcal" color="#fb923c"
            size={132} stroke={11} sublabel={has ? `+${Math.round(planned.calories)} planned` : undefined}
          />
          <ProgressRing
            value={projProt} target={target.protein} label="Protein" unit="g" color="#34d399"
            size={132} stroke={11} sublabel={has ? `+${Math.round(planned.proteinGrams)} planned` : undefined}
          />
        </div>
        <div className="flex-1 w-full space-y-3">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${meetsGoals ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30" : "text-readable-soft border-white/10"}`}>
            {meetsGoals ? <CheckCircle2 size={14} /> : <FlaskConical size={14} />}
            {meetsGoals ? "This hits your goals" : has ? "Keep adjusting" : "Add foods to experiment"}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <GoalLine
              ok={calOk}
              label="Calories"
              text={calLeft >= 0 ? `${Math.round(calLeft)} kcal left` : `${Math.round(-calLeft)} kcal over`}
            />
            <GoalLine
              ok={proteinOk}
              label="Protein"
              text={protLeft > 0 ? `${Math.round(protLeft)} g to go` : "target met"}
            />
          </div>
        </div>
      </div>

      {/* What-if foods */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wide flex items-center gap-2">
            <UtensilsCrossed size={14} className="text-violet-400" /> What if I added…
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
          <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.02] p-6 text-center">
            <p className="text-sm text-readable-faint">Add a food to see how it fits into your day.</p>
          </div>
        )}

        <button
          onClick={() => setAddOpen(true)}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 text-readable-soft px-4 py-2.5 text-sm hover:bg-white/[0.05] transition-colors"
        >
          <Plus size={15} className="text-violet-400" /> Add a food
        </button>
      </div>

      {/* Commit it */}
      {has && (
        <div className="pt-4 border-t border-white/8 space-y-4">
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

          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-readable-faint">Meal name (optional)</span>
            <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder={`Planned ${MEAL_TYPE_META[mealType].label.toLowerCase()}`} className={inputCls} />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => submit(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-100 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Log to {isToday ? "today" : dayLabel}
            </button>
            <button
              onClick={() => submit(false)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 text-readable-soft px-4 py-2.5 text-sm font-medium hover:bg-white/[0.05] transition-colors disabled:opacity-50"
            >
              <Bookmark size={14} /> Save as meal only
            </button>
          </div>
          <p className="text-[11px] text-readable-faint">
            Logging adds these foods to {isToday ? "today" : dayLabel} as one meal and saves it for reuse.
          </p>
        </div>
      )}

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
