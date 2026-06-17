"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Pencil, Save, Loader2, Flame, Beef, Info, ShieldCheck } from "lucide-react";
import { confidenceLevel, type ProposedItem, type ProposedMeal } from "@/lib/nutrition/types";
import { round } from "@/lib/nutrition/units";
import EditableItemsTable from "./EditableItemsTable";

const CONF_COLOR = { high: "#34d399", medium: "#fbbf24", low: "#f87171" };

export default function ReviewPanel({
  proposal,
  saving,
  onSave,
  onCancel,
  onEditDescription,
  onReanalyzeItem,
}: {
  proposal: ProposedMeal;
  saving: boolean;
  onSave: (items: ProposedItem[]) => void;
  onCancel: () => void;
  onEditDescription: () => void;
  onReanalyzeItem: (index: number) => Promise<ProposedItem | null>;
}) {
  const [items, setItems] = useState<ProposedItem[]>(proposal.items);

  const totals = useMemo(() => {
    const cal = round(items.reduce((s, it) => s + (it.calories ?? 0), 0), 0);
    const prot = round(items.reduce((s, it) => s + (it.proteinGrams ?? 0), 0), 1);
    const confs = items.map((i) => i.confidence);
    const overall = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : proposal.confidence;
    return { cal, prot, overall };
  }, [items, proposal.confidence]);

  const allAssumptions = useMemo(() => {
    const set = new Set<string>();
    proposal.assumptions.forEach((a) => set.add(a));
    items.forEach((it) => it.assumptions.forEach((a) => set.add(a)));
    return [...set];
  }, [items, proposal.assumptions]);

  const overallLevel = confidenceLevel(totals.overall);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl border border-cyan-500/25 p-5 bg-gradient-to-br from-cyan-500/[0.06] to-transparent"
    >
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Review before saving</h2>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
          style={{ color: CONF_COLOR[overallLevel], background: `${CONF_COLOR[overallLevel]}1a`, borderColor: `${CONF_COLOR[overallLevel]}40` }}
        >
          {overallLevel} confidence
        </span>
      </div>
      <p className="text-xs text-readable-faint mb-4">
        Estimated from your description. Adjust anything that looks off — numbers recalculate as you edit. Nothing is saved until you confirm.
      </p>

      <EditableItemsTable items={items} onChange={setItems} onReanalyzeItem={onReanalyzeItem} />

      {/* Totals */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/8">
        <div className="flex items-center gap-1.5">
          <Flame size={15} className="text-orange-400" />
          <span className="text-lg font-bold text-white">{totals.cal.toLocaleString()}</span>
          <span className="text-xs text-readable-faint">kcal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Beef size={15} className="text-emerald-400" />
          <span className="text-lg font-bold text-white">{totals.prot}</span>
          <span className="text-xs text-readable-faint">g protein</span>
        </div>
      </div>

      {allAssumptions.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Info size={13} className="text-amber-400" />
            <span className="text-[11px] font-semibold text-white uppercase tracking-wide">Assumptions</span>
          </div>
          <ul className="space-y-1">
            {allAssumptions.map((a, idx) => (
              <li key={idx} className="text-xs text-readable-soft flex gap-2">
                <span className="text-readable-faint">•</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-5">
        <button
          type="button"
          onClick={() => onSave(items)}
          disabled={saving || items.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-100 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          Confirm &amp; save meal
        </button>
        <button
          type="button"
          onClick={onEditDescription}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 text-readable-soft px-4 py-2.5 text-sm font-medium hover:bg-white/[0.05] transition-colors"
        >
          <Pencil size={14} /> Edit description
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/12 text-readable-faint px-4 py-2.5 text-sm font-medium hover:bg-white/[0.05] transition-colors"
        >
          <X size={14} /> Cancel
        </button>
        <span className="ml-auto hidden sm:flex items-center gap-1 text-[11px] text-readable-faint">
          <Save size={12} /> Confirmed foods are remembered for next time
        </span>
      </div>
    </motion.div>
  );
}
