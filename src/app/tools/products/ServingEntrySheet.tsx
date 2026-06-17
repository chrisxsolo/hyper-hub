"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, UtensilsCrossed } from "lucide-react";
import { scaleNutrition, LOG_UNIT_OPTIONS } from "@/lib/products/serving";
import type { DbCostcoProductNutritionVersion } from "@/lib/products/types";
import { MEAL_TYPES, type MealType } from "@/lib/nutrition/types";
import { MEAL_TYPE_META } from "@/lib/nutrition/db";

const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors";

// "How much did you eat?" — logs a Costco product into the calorie tracker via
// /api/nutrition/log-product. The server recomputes the snapshot; this sheet
// previews it client-side so the user sees what they're logging (spec §18).
export default function ServingEntrySheet({
  productId,
  productName,
  brand,
  nutrition,
  versionId,
  defaultDate,
  defaultMealType = "snack",
  onClose,
  onLogged,
}: {
  productId: string;
  productName: string;
  brand?: string | null;
  nutrition: DbCostcoProductNutritionVersion;
  versionId?: string | null;
  defaultDate: string;
  defaultMealType?: MealType;
  onClose: () => void;
  onLogged?: (mealId: string) => void;
}) {
  const servingGrams =
    nutrition.serving_size_unit === "g" || nutrition.serving_size_unit === "ml"
      ? nutrition.serving_size_value
      : null;

  const [amount, setAmount] = useState("1");
  const [unit, setUnit] = useState("serving");
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [date, setDate] = useState(defaultDate);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const amt = Number(amount.replace(/[^0-9.]/g, ""));
  const result = useMemo(
    () => (Number.isFinite(amt) && amt > 0 ? scaleNutrition(nutrition, amt, unit) : null),
    [nutrition, amt, unit],
  );
  const snap = result?.ok ? result.snapshot : null;

  const quick: { label: string; amount: string; unit: string }[] = [
    { label: "1 serving", amount: "1", unit: "serving" },
    { label: "½ serving", amount: "0.5", unit: "serving" },
    { label: "2 servings", amount: "2", unit: "serving" },
    ...(servingGrams ? [{ label: `${servingGrams} g`, amount: String(servingGrams), unit: "g" }] : []),
  ];

  async function log() {
    if (busy || !snap) return;
    setBusy(true);
    setErr("");
    try {
      const consumedAt = new Date(`${date}T12:00:00`).toISOString();
      const res = await fetch("/api/nutrition/log-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          versionId: versionId ?? nutrition.id,
          amount: amt,
          unit,
          mealType,
          eatenOn: date,
          consumedAt,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Couldn't log this food.");
      onLogged?.(json.id as string);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't log this food.");
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="relative z-10 w-full sm:max-w-md max-h-[92vh] overflow-y-auto glass rounded-t-3xl sm:rounded-2xl border border-white/10 p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white">How much did you eat?</h2>
              <p className="text-xs text-readable-faint truncate">
                {[brand, productName].filter(Boolean).join(" · ")}
                {nutrition.serving_size_description ? ` — serving: ${nutrition.serving_size_description}` : ""}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-readable-faint hover:text-white hover:bg-white/10 transition-colors shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* Quick amounts */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {quick.map((q) => {
              const active = amount === q.amount && unit === q.unit;
              return (
                <button
                  key={q.label}
                  onClick={() => { setAmount(q.amount); setUnit(q.unit); }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${active ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" : "border-white/10 text-readable-soft hover:bg-white/[0.06]"}`}
                >
                  {q.label}
                </button>
              );
            })}
          </div>

          {/* Custom amount */}
          <div className="flex gap-2 mb-3">
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} flex-1`} placeholder="Amount" />
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={`${inputCls} w-28`}>
              {LOG_UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Live preview */}
          {result && !result.ok ? (
            <p className="text-xs text-amber-300/90 mb-3">{result.reason}</p>
          ) : snap ? (
            <div className="grid grid-cols-4 gap-2 mb-4">
              <Stat label="Cal" value={snap.calories} />
              <Stat label="Protein" value={snap.proteinG} unit="g" />
              <Stat label="Carbs" value={snap.totalCarbohydrateG} unit="g" />
              <Stat label="Fat" value={snap.totalFatG} unit="g" />
            </div>
          ) : (
            <p className="text-xs text-readable-faint mb-3">Enter an amount to preview.</p>
          )}

          {/* Meal type */}
          <div className="flex flex-wrap gap-1.5 mb-3">
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

          <label className="flex flex-col gap-1 mb-4">
            <span className="text-[10px] uppercase tracking-wide text-readable-faint">Date</span>
            <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
          </label>

          {err && <p className="text-xs text-red-300/90 mb-2">{err}</p>}

          <button onClick={log} disabled={busy || !snap} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <UtensilsCrossed size={15} />}
            Log to tracker
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({ label, value, unit = "" }: { label: string; value: number | null; unit?: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.02] p-2 text-center">
      <div className="text-sm font-bold text-white">{value != null ? Math.round(value * 10) / 10 : "—"}<span className="text-[10px] text-readable-faint font-normal">{value != null ? unit : ""}</span></div>
      <div className="text-[9px] uppercase tracking-wide text-readable-faint">{label}</div>
    </div>
  );
}
