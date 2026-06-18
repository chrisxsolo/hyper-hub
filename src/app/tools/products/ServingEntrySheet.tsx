"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, UtensilsCrossed, AlertTriangle, Sparkles, RotateCcw } from "lucide-react";
import { scaleNutrition } from "@/lib/products/serving";
import { massToGrams, round } from "@/lib/nutrition/units";
import { FRACTION_PRESETS, validateServings } from "@/lib/nutrition/portion";
import type { DbCostcoProductNutritionVersion } from "@/lib/products/types";
import { MEAL_TYPES, type MealType, type ProposedItem } from "@/lib/nutrition/types";
import { MEAL_TYPE_META } from "@/lib/nutrition/db";

const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors";

// How much of the item the user is logging. Whole/half/fraction are expressed
// as multiples of one serving via the container's servings-per-container;
// grams/servings are direct amounts. Every mode resolves to an (amount, unit)
// pair the server's scaleNutrition() already understands.
type PortionMode = "whole" | "half" | "fraction" | "grams" | "servings";

function pickCurrent(
  versions: DbCostcoProductNutritionVersion[],
): DbCostcoProductNutritionVersion | null {
  return versions.find((v) => v.is_current) ?? versions[0] ?? null;
}

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
  // The version we log against. Starts from the prop; if the user picks "Whole
  // item" on a product whose full size we don't know (e.g. an old per-100 g
  // estimate), we estimate it, save it as a 1-serving version, and swap it in —
  // so it's instant next time.
  const [version, setVersion] = useState<DbCostcoProductNutritionVersion>(nutrition);
  const [vId, setVId] = useState<string | null>(versionId ?? nutrition.id);

  // How many servings make up the entire item/package (drives whole/half/fraction).
  const wholeServings =
    version.servings_per_container && version.servings_per_container > 0
      ? version.servings_per_container
      : null;
  // Grams logging is only meaningful when one serving has a known weight.
  const servingMassGrams =
    version.serving_size_unit != null ? massToGrams(version.serving_size_value ?? 1, version.serving_size_unit) : null;
  const canGrams = servingMassGrams != null && servingMassGrams > 0;

  // Single-unit items (a bar, a sandwich, an AI-estimated whole food) default to
  // "whole"; multi-serving tubs keep the safe "1 serving" default.
  const initialMode: PortionMode = wholeServings != null && wholeServings <= 2 ? "whole" : "servings";

  const [mode, setMode] = useState<PortionMode>(initialMode);
  const [fractionInput, setFractionInput] = useState("1");
  const [gramsInput, setGramsInput] = useState(canGrams ? String(round(servingMassGrams as number, 0)) : "");
  const [servingsInput, setServingsInput] = useState("1");
  const [confirmHigh, setConfirmHigh] = useState(false);
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [date, setDate] = useState(defaultDate);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Whole-item estimate (only when we don't already know the full size).
  const [estimating, setEstimating] = useState(false);
  const [estimateErr, setEstimateErr] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Estimate the whole item with AI and save it as a 1-serving nutrition version,
  // so "Whole item / Half / Fraction" work for foods stored only as per-100 g.
  async function estimateWholeItem() {
    if (estimating) return;
    setEstimating(true);
    setEstimateErr("");
    try {
      const res = await fetch("/api/nutrition/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: [brand, productName].filter(Boolean).join(" "),
          mealType,
          forceFresh: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Couldn't estimate the whole item.");
      const item = (json.meal?.items?.[0] as ProposedItem | undefined) ?? null;
      if (!item) throw new Error("No estimate returned — try grams instead.");
      const grams = item.gramsEstimate ?? null;
      const cal =
        item.calories ??
        (item.caloriesPer100g != null && grams != null ? (item.caloriesPer100g * grams) / 100 : null);
      const prot =
        item.proteinGrams ??
        (item.proteinPer100g != null && grams != null ? (item.proteinPer100g * grams) / 100 : null);
      if (cal == null || cal <= 0) throw new Error("The estimate had no calories — try grams instead.");
      const hasGrams = grams != null && grams > 0;

      const save = await fetch(`/api/products/${productId}/nutrition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servingSizeDescription: hasGrams ? `Whole item (~${round(grams, 0)} g)` : "Whole item",
          servingSizeValue: hasGrams ? round(grams, 0) : 1,
          servingSizeUnit: hasGrams ? "g" : "item",
          servingsPerContainer: 1,
          calories: round(cal, 0),
          proteinG: prot != null && prot > 0 ? round(prot, 1) : null,
          notes: "AI estimate — whole item",
          recognitionConfidence: { overall: item.confidence },
        }),
      });
      const sjson = await save.json().catch(() => ({}));
      if (!save.ok) throw new Error(sjson?.error || "Couldn't save the estimate.");
      const newV = pickCurrent((sjson.versions as DbCostcoProductNutritionVersion[]) ?? []);
      if (!newV) throw new Error("Saved, but couldn't load the estimate.");
      setVersion(newV);
      setVId(newV.id);
    } catch (e) {
      setEstimateErr(e instanceof Error ? e.message : "Couldn't estimate the whole item.");
    } finally {
      setEstimating(false);
    }
  }

  function pickMode(m: PortionMode) {
    setMode(m);
    setErr("");
    setConfirmHigh(false);
    // Whole-item modes need the full size — estimate it on demand the first time.
    if ((m === "whole" || m === "half" || m === "fraction") && wholeServings == null && !estimating) {
      estimateWholeItem();
    }
  }

  // Resolve the selected mode to the (amount, unit) the tracker logs.
  const resolved = useMemo<{ amount: number; unit: string } | null>(() => {
    switch (mode) {
      case "whole":
        return wholeServings != null ? { amount: wholeServings, unit: "serving" } : null;
      case "half":
        return wholeServings != null ? { amount: round(wholeServings / 2, 4), unit: "serving" } : null;
      case "fraction": {
        const f = Number(fractionInput);
        return wholeServings != null && Number.isFinite(f) && f > 0
          ? { amount: round(wholeServings * f, 4), unit: "serving" }
          : null;
      }
      case "grams": {
        const g = Number(gramsInput);
        return Number.isFinite(g) && g > 0 ? { amount: g, unit: "g" } : null;
      }
      case "servings": {
        const s = Number(servingsInput);
        return Number.isFinite(s) && s > 0 ? { amount: s, unit: "serving" } : null;
      }
    }
  }, [mode, wholeServings, fractionInput, gramsInput, servingsInput]);

  const result = useMemo(
    () => (resolved ? scaleNutrition(version, resolved.amount, resolved.unit) : null),
    [version, resolved],
  );
  const snap = result?.ok ? result.snapshot : null;

  // Guard only the free-typed servings count — presets (whole/half/fraction) are
  // deliberate choices and exempt.
  const servingsCheck =
    mode === "servings" && resolved ? validateServings(resolved.amount) : null;
  const blockedHigh = !!servingsCheck && !servingsCheck.valid && servingsCheck.blocked;
  const needsConfirm = !!servingsCheck?.warning;
  const wholeBased = mode === "whole" || mode === "half" || mode === "fraction";
  const awaitingEstimate = wholeBased && wholeServings == null; // estimating or failed
  const canLog = !!snap && !blockedHigh && !awaitingEstimate && (!needsConfirm || confirmHigh);

  // Calories for a given amount/unit, for the whole/half pill labels.
  function calsFor(amount: number, unit: string): number | null {
    const r = scaleNutrition(version, amount, unit);
    return r.ok ? r.snapshot.calories : null;
  }
  const wholeCals = wholeServings != null ? calsFor(wholeServings, "serving") : null;
  const halfCals = wholeServings != null ? calsFor(wholeServings / 2, "serving") : null;

  async function log() {
    if (busy || !snap || !resolved || !canLog) return;
    setBusy(true);
    setErr("");
    try {
      const consumedAt = new Date(`${date}T12:00:00`).toISOString();
      const res = await fetch("/api/nutrition/log-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          versionId: vId ?? version.id,
          amount: resolved.amount,
          unit: resolved.unit,
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

  const modes: { key: PortionMode; label: string; show: boolean }[] = [
    { key: "whole", label: "Whole item", show: true },
    { key: "half", label: "Half", show: true },
    { key: "fraction", label: "Fraction", show: true },
    { key: "grams", label: "Grams", show: canGrams },
    { key: "servings", label: "Servings", show: true },
  ];

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
                {version.serving_size_description ? ` — serving: ${version.serving_size_description}` : ""}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-readable-faint hover:text-white hover:bg-white/10 transition-colors shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* Portion mode */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {modes.filter((m) => m.show).map((m) => {
              const active = mode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => pickMode(m.key)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${active ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" : "border-white/10 text-readable-soft hover:bg-white/[0.06]"}`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Mode-specific input */}
          {awaitingEstimate ? (
            estimating ? (
              <p className="flex items-center gap-2 text-sm text-readable-soft mb-3 py-2">
                <Sparkles size={15} className="text-emerald-400 animate-pulse" /> Estimating the whole item…
              </p>
            ) : (
              <div className="mb-3">
                <p className="text-xs text-readable-soft mb-2">
                  We don&apos;t know this item&apos;s full size yet — estimate it once and it&apos;s saved for next time.
                </p>
                {estimateErr && <p className="text-xs text-amber-300/90 mb-2">{estimateErr}</p>}
                <button
                  onClick={estimateWholeItem}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-2 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                >
                  {estimateErr ? <RotateCcw size={14} /> : <Sparkles size={14} />}
                  {estimateErr ? "Retry estimate" : "Estimate the whole item"}
                </button>
              </div>
            )
          ) : (
            <>
              {(mode === "whole" || mode === "half") && (
                <p className="text-xs text-readable-soft mb-3">
                  Logging {mode === "whole" ? "the whole item" : "half the item"}
                  {wholeServings != null && wholeServings !== 1 && ` (${round(mode === "whole" ? wholeServings : wholeServings / 2, 2)} servings)`}
                  {(mode === "whole" ? wholeCals : halfCals) != null && ` — about ${Math.round((mode === "whole" ? wholeCals : halfCals) as number)} cal`}
                  .
                </p>
              )}

              {mode === "fraction" && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {FRACTION_PRESETS.map((f) => {
                      const active = Number(fractionInput) === f;
                      return (
                        <button
                          key={f}
                          onClick={() => { setFractionInput(String(f)); }}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${active ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" : "border-white/10 text-readable-soft hover:bg-white/[0.06]"}`}
                        >
                          {f}×
                        </button>
                      );
                    })}
                  </div>
                  <label className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-readable-faint shrink-0">Fraction of item</span>
                    <input inputMode="decimal" value={fractionInput} onChange={(e) => setFractionInput(e.target.value)} className={`${inputCls} w-24`} placeholder="0.5" />
                  </label>
                </div>
              )}

              {mode === "grams" && (
                <label className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] uppercase tracking-wide text-readable-faint shrink-0">Grams</span>
                  <input inputMode="decimal" value={gramsInput} onChange={(e) => setGramsInput(e.target.value)} className={`${inputCls} flex-1`} placeholder="e.g. 150" />
                  <span className="text-sm text-readable-faint">g</span>
                </label>
              )}

              {mode === "servings" && (
                <label className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-wide text-readable-faint shrink-0">Servings</span>
                  <input
                    inputMode="decimal"
                    value={servingsInput}
                    onChange={(e) => { setServingsInput(e.target.value); setConfirmHigh(false); setErr(""); }}
                    className={`${inputCls} flex-1 ${blockedHigh ? "border-red-500/50" : needsConfirm ? "border-amber-400/50" : ""}`}
                    placeholder="1"
                  />
                </label>
              )}
            </>
          )}

          {/* Serving guard — warn (confirm) or block */}
          {blockedHigh && (
            <p className="flex items-start gap-1.5 text-xs text-red-300/90 mb-3">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {servingsCheck?.message}
            </p>
          )}
          {needsConfirm && !blockedHigh && (
            <div className="mb-3 rounded-lg border border-amber-400/30 bg-amber-400/[0.07] px-3 py-2">
              <p className="flex items-start gap-1.5 text-xs text-amber-200/90">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {servingsCheck?.warning}
              </p>
              <label className="mt-1.5 flex items-center gap-2 cursor-pointer select-none text-xs text-amber-100/90">
                <input type="checkbox" checked={confirmHigh} onChange={(e) => setConfirmHigh(e.target.checked)} className="accent-amber-400" />
                Yes, I really ate this much
              </label>
            </div>
          )}

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
          ) : !awaitingEstimate ? (
            <p className="text-xs text-readable-faint mb-3">Choose how much to preview.</p>
          ) : null}

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

          <button onClick={log} disabled={busy || !canLog} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40">
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
