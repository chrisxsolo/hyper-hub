"use client";

import { useState } from "react";
import { Loader2, Check, Flame, Beef } from "lucide-react";
import { MEAL_TYPES, type MealType, type ProposedItem } from "@/lib/nutrition/types";
import { round } from "@/lib/nutrition/units";
import { dbItemToProposed, MEAL_TYPE_META, proposedItemToRow, type MealWithItems } from "@/lib/nutrition/db";
import Sheet from "./Sheet";
import EditableItemsTable from "./EditableItemsTable";

export default function EditMealSheet({
  meal,
  onClose,
  onSave,
}: {
  meal: MealWithItems | null;
  onClose: () => void;
  onSave: (mealId: string, patch: Record<string, unknown>, items: ReturnType<typeof proposedItemToRow>[]) => Promise<boolean>;
}) {
  const open = meal != null;
  return (
    <Sheet open={open} title="Edit meal" subtitle="Change items, type, date, or add a note" onClose={onClose}>
      {meal && <EditMealBody key={meal.id} meal={meal} onClose={onClose} onSave={onSave} />}
    </Sheet>
  );
}

function EditMealBody({
  meal,
  onClose,
  onSave,
}: {
  meal: MealWithItems;
  onClose: () => void;
  onSave: (mealId: string, patch: Record<string, unknown>, items: ReturnType<typeof proposedItemToRow>[]) => Promise<boolean>;
}) {
  const initialTime = (() => {
    const d = new Date(meal.consumed_at);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  })();

  const [mealType, setMealType] = useState<MealType>(meal.meal_type);
  const [date, setDate] = useState(meal.eaten_on);
  const [time, setTime] = useState(initialTime);
  const [note, setNote] = useState(meal.note ?? "");
  const [items, setItems] = useState<ProposedItem[]>(meal.items.map(dbItemToProposed));
  const [saving, setSaving] = useState(false);

  const cal = round(items.reduce((s, it) => s + (it.calories ?? 0), 0), 0);
  const prot = round(items.reduce((s, it) => s + (it.proteinGrams ?? 0), 0), 1);

  async function save() {
    setSaving(true);
    const consumedAt = new Date(`${date}T${time || "12:00"}`).toISOString();
    const ok = await onSave(
      meal.id,
      { meal_type: mealType, eaten_on: date, consumed_at: consumedAt, note: note.trim() || null },
      items.map((it, i) => proposedItemToRow(it, i)),
    );
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <div className="space-y-4">
      {/* Meal type */}
      <div className="flex flex-wrap gap-1.5">
        {MEAL_TYPES.map((mt) => {
          const m = MEAL_TYPE_META[mt];
          const active = mealType === mt;
          return (
            <button
              key={mt}
              type="button"
              onClick={() => setMealType(mt)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${active ? "text-white" : "text-readable-soft border-white/10 hover:bg-white/[0.05]"}`}
              style={active ? { background: `${m.color}26`, borderColor: `${m.color}66` } : undefined}
            >
              <span>{m.emoji}</span>
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Date / time */}
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-readable-faint">Date</span>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/40 [color-scheme:dark]" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-readable-faint">Time</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/40 [color-scheme:dark]" />
        </label>
      </div>

      {/* Items */}
      <EditableItemsTable items={items} onChange={setItems} />

      {/* Totals */}
      <div className="flex items-center gap-4 pt-3 border-t border-white/8">
        <span className="flex items-center gap-1.5 text-sm"><Flame size={14} className="text-orange-400" /><span className="font-bold text-white">{cal.toLocaleString()}</span><span className="text-readable-faint text-xs">kcal</span></span>
        <span className="flex items-center gap-1.5 text-sm"><Beef size={14} className="text-emerald-400" /><span className="font-bold text-white">{prot}</span><span className="text-readable-faint text-xs">g</span></span>
        <span className="text-[11px] text-readable-faint ml-auto">Totals recomputed on save</span>
      </div>

      {/* Note */}
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wide text-readable-faint">Note</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="optional" className="rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/40 resize-none" />
      </label>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={save}
          disabled={saving || items.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-100 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          Save changes
        </button>
        <button type="button" onClick={onClose} className="rounded-xl border border-white/12 text-readable-faint px-4 py-2.5 text-sm font-medium hover:bg-white/[0.05] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
