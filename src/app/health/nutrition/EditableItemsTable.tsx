"use client";

import { Trash2, RefreshCw, BadgeCheck, Loader2, Plus, AlertCircle } from "lucide-react";
import { useState } from "react";
import { SOURCE_LABELS, type ProposedItem, type SourceType } from "@/lib/nutrition/types";
import { round, UNIT_OPTIONS } from "@/lib/nutrition/units";
import { blankProposedItem } from "@/lib/nutrition/helpers";

export const SOURCE_COLOR: Record<SourceType, string> = {
  personal: "#34d399",
  official_restaurant: "#22d3ee",
  usda: "#60a5fa",
  manufacturer: "#a78bfa",
  nutrition_database: "#818cf8",
  ai_estimate: "#fbbf24",
  manual: "#94a3b8",
};

const numInput =
  "w-full rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1.5 text-sm text-white text-right focus:outline-none focus:border-cyan-500/40 transition-colors";
const txtInput =
  "w-full rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500/40 transition-colors";

// Editable, responsive item table. On mobile each row stacks into a card; no
// horizontal overflow. Quantity edits recompute calories/protein from the
// per-unit anchor; editing a number directly re-anchors and marks it manual.
export default function EditableItemsTable({
  items,
  onChange,
  onReanalyzeItem,
  allowAdd = true,
}: {
  items: ProposedItem[];
  onChange: (items: ProposedItem[]) => void;
  onReanalyzeItem?: (index: number) => Promise<ProposedItem | null>;
  allowAdd?: boolean;
}) {
  const [reloading, setReloading] = useState<number | null>(null);

  function update(i: number, patch: Partial<ProposedItem>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function setQuantity(i: number, q: number) {
    const it = items[i];
    const patch: Partial<ProposedItem> = { quantity: q };
    if (it.perUnitCalories != null) patch.calories = round(it.perUnitCalories * q, 0);
    if (it.perUnitProtein != null) patch.proteinGrams = round(it.perUnitProtein * q, 1);
    update(i, patch);
  }
  function setCalories(i: number, c: number) {
    const it = items[i];
    update(i, {
      calories: c,
      perUnitCalories: it.quantity ? c / it.quantity : it.perUnitCalories,
      sourceType: "manual",
      verified: true,
    });
  }
  function setProtein(i: number, p: number) {
    const it = items[i];
    update(i, {
      proteinGrams: p,
      perUnitProtein: it.quantity ? p / it.quantity : it.perUnitProtein,
      sourceType: "manual",
      verified: true,
    });
  }
  async function reanalyze(i: number) {
    if (!onReanalyzeItem) return;
    setReloading(i);
    const fresh = await onReanalyzeItem(i);
    setReloading(null);
    if (fresh) update(i, fresh);
  }

  return (
    <div>
      <div className="hidden md:grid grid-cols-[1.7fr_1.4fr_0.9fr_0.9fr_auto] gap-2 px-1 pb-2 text-[10px] uppercase tracking-wide text-readable-faint">
        <span>Food</span>
        <span>Amount</span>
        <span className="text-right">Calories</span>
        <span className="text-right">Protein</span>
        <span></span>
      </div>

      <div className="space-y-2">
        {items.map((it, i) => {
          const color = SOURCE_COLOR[it.sourceType];
          const isRange = it.quantity == null && it.quantityMin != null;
          const lowConf = it.confidence < 0.45;
          return (
            <div
              key={i}
              className="rounded-xl border border-white/8 bg-white/[0.02] p-3 md:p-2 md:px-3 grid grid-cols-1 md:grid-cols-[1.7fr_1.4fr_0.9fr_0.9fr_auto] gap-2 md:items-center"
            >
              <div className="min-w-0">
                <input value={it.name} onChange={(e) => update(i, { name: e.target.value })} className={txtInput} placeholder="Food name" />
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {it.brand && <span className="text-[10px] text-readable-faint">{it.brand}</span>}
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full border font-medium"
                    style={{ color, background: `${color}14`, borderColor: `${color}33` }}
                    title={it.sourceName ?? SOURCE_LABELS[it.sourceType]}
                  >
                    {SOURCE_LABELS[it.sourceType]}
                  </span>
                  {it.preparationState && <span className="text-[10px] text-readable-faint italic">{it.preparationState}</span>}
                </div>
                {(isRange || lowConf) && (
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-300/90">
                    <AlertCircle size={11} />
                    {isRange
                      ? `Portion needs confirmation (${it.quantityMin}–${it.quantityMax} ${it.unit} — using midpoint)`
                      : "Low-confidence estimate. Review before saving."}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="any"
                  value={it.quantity ?? ""}
                  onChange={(e) => setQuantity(i, Number(e.target.value))}
                  placeholder={it.quantityMin != null ? `${it.quantityMin}–${it.quantityMax}` : "—"}
                  className={`${numInput} w-20 text-left`}
                />
                <select
                  value={it.unit}
                  onChange={(e) => update(i, { unit: e.target.value })}
                  className="rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500/40 min-w-0 flex-1 [color-scheme:dark]"
                >
                  {[it.unit, ...UNIT_OPTIONS.filter((u) => u !== it.unit)].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 md:block">
                <span className="md:hidden text-[10px] uppercase tracking-wide text-readable-faint w-16">Calories</span>
                <input type="number" step="any" value={it.calories ?? ""} onChange={(e) => setCalories(i, Number(e.target.value))} className={numInput} />
              </div>
              <div className="flex items-center gap-1 md:block">
                <span className="md:hidden text-[10px] uppercase tracking-wide text-readable-faint w-16">Protein g</span>
                <input type="number" step="any" value={it.proteinGrams ?? ""} onChange={(e) => setProtein(i, Number(e.target.value))} className={numInput} />
              </div>

              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => update(i, { verified: !it.verified })}
                  title={it.verified ? "Verified" : "Mark verified"}
                  className={`p-1.5 rounded-lg transition-colors ${it.verified ? "text-emerald-400" : "text-readable-faint hover:text-emerald-400"}`}
                >
                  <BadgeCheck size={15} />
                </button>
                {onReanalyzeItem && (
                  <button
                    type="button"
                    onClick={() => reanalyze(i)}
                    disabled={reloading === i}
                    title="Re-run nutrition lookup"
                    className="p-1.5 rounded-lg text-readable-faint hover:text-cyan-300 transition-colors disabled:opacity-50"
                  >
                    {reloading === i ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                  title="Remove item"
                  className="p-1.5 rounded-lg text-readable-faint hover:text-rose-400 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {allowAdd && (
        <button
          type="button"
          onClick={() => onChange([...items, blankProposedItem()])}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-readable-soft hover:text-white border border-dashed border-white/15 hover:border-white/30 rounded-lg px-3 py-2 transition-colors"
        >
          <Plus size={13} /> Add item manually
        </button>
      )}
    </div>
  );
}
