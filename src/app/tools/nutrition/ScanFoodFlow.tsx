"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ArrowRight, RotateCcw, ScanLine, Sparkles } from "lucide-react";
import MultiPhotoScanner from "../products/MultiPhotoScanner";
import ServingEntrySheet from "../products/ServingEntrySheet";
import { round } from "@/lib/nutrition/units";
import type { MealType, ProposedItem } from "@/lib/nutrition/types";
import type { DbCostcoProductNutritionVersion, ProductOverview } from "@/lib/products/types";

const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors";

type Phase = "scan" | "estimate" | "serving";

function pickCurrent(
  versions: DbCostcoProductNutritionVersion[],
): DbCostcoProductNutritionVersion | null {
  return versions.find((v) => v.is_current) ?? versions[0] ?? null;
}

// One-shot "scan a food → weigh grams → log a meal" flow, launched from the
// tracker. Snaps photos via the product scanner (which also saves the product +
// price to the Costco catalog). If the product has a nutrition label we go
// straight to the grams-entry sheet; if it's a label-less whole food (a fresh
// steak) we AI-estimate its per-100g nutrition, let the user adjust it, save it
// as the product's nutrition version, then weigh + log it the same way.
export default function ScanFoodFlow({
  defaultDate,
  defaultMealType = "snack",
  onClose,
  onLogged,
  onCatalogChanged,
}: {
  defaultDate: string;
  defaultMealType?: MealType;
  onClose: () => void;
  onLogged: (mealId: string) => void;
  onCatalogChanged?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("scan");
  const [product, setProduct] = useState<ProductOverview | null>(null);
  const [version, setVersion] = useState<DbCostcoProductNutritionVersion | null>(null);
  const [estItem, setEstItem] = useState<ProposedItem | null>(null);
  // Whole-item estimate (Claude already returns totals for the whole portion).
  const [wholeCal, setWholeCal] = useState("");
  const [wholeProt, setWholeProt] = useState("");
  const [wholeGrams, setWholeGrams] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // The scanner calls onClose() immediately after onSaved(); this guards that
  // self-close so it advances the flow instead of tearing it down.
  const savedRef = useRef(false);

  async function handleSaved(p: ProductOverview) {
    savedRef.current = true;
    setProduct(p);
    setErr("");
    onCatalogChanged?.();
    if (p.has_nutrition && p.nutrition_version_id) {
      setPhase("serving");
      setBusy(true);
      try {
        const res = await fetch(`/api/products/${p.id}/nutrition`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Couldn't load nutrition.");
        const v = pickCurrent((json.versions as DbCostcoProductNutritionVersion[]) ?? []);
        if (!v) throw new Error("No saved nutrition found for this product.");
        setVersion(v);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Couldn't load nutrition.");
      } finally {
        setBusy(false);
      }
    } else {
      setPhase("estimate");
      await runEstimate(p);
    }
  }

  async function runEstimate(p: ProductOverview) {
    setBusy(true);
    setErr("");
    setEstItem(null);
    try {
      const res = await fetch("/api/nutrition/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: p.name, mealType: defaultMealType, forceFresh: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Couldn't estimate nutrition.");
      const item = (json.meal?.items?.[0] as ProposedItem | undefined) ?? null;
      if (!item) throw new Error("No estimate returned — enter the numbers below.");
      setEstItem(item);
      const grams = item.gramsEstimate ?? null;
      // Whole-item totals: prefer Claude's portion totals, else scale per-100g by grams.
      const cal =
        item.calories ??
        (item.caloriesPer100g != null && grams != null ? (item.caloriesPer100g * grams) / 100 : null);
      const prot =
        item.proteinGrams ??
        (item.proteinPer100g != null && grams != null ? (item.proteinPer100g * grams) / 100 : null);
      setWholeCal(cal != null ? String(round(cal, 0)) : "");
      setWholeProt(prot != null ? String(round(prot, 1)) : "");
      setWholeGrams(grams != null ? String(round(grams, 0)) : "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't estimate nutrition.");
    } finally {
      setBusy(false);
    }
  }

  async function saveVersionThenServe() {
    if (!product || busy) return;
    const cal = Number(wholeCal);
    const prot = Number(wholeProt);
    const grams = Number(wholeGrams);
    if (!Number.isFinite(cal) || cal <= 0) {
      setErr("Enter the calories for the whole item (or retry the estimate).");
      return;
    }
    // Save the estimate as the whole item (1 serving). With a known weight the
    // serving is gram-based so the serving sheet can also offer Grams; otherwise
    // it's a single countable item. servings_per_container = 1 makes the serving
    // sheet default to "Whole item".
    const hasGrams = Number.isFinite(grams) && grams > 0;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/products/${product.id}/nutrition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servingSizeDescription: hasGrams ? `Whole item (~${round(grams, 0)} g)` : "Whole item",
          servingSizeValue: hasGrams ? round(grams, 0) : 1,
          servingSizeUnit: hasGrams ? "g" : "item",
          servingsPerContainer: 1,
          calories: round(cal, 0),
          proteinG: Number.isFinite(prot) && prot > 0 ? round(prot, 1) : null,
          notes: "AI estimate — whole item; adjust if needed",
          recognitionConfidence: estItem ? { overall: estItem.confidence } : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Couldn't save the estimate.");
      const v = pickCurrent((json.versions as DbCostcoProductNutritionVersion[]) ?? []);
      if (!v) throw new Error("Saved, but couldn't load the new nutrition.");
      setVersion(v);
      onCatalogChanged?.();
      setPhase("serving");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save the estimate.");
    } finally {
      setBusy(false);
    }
  }

  // ── Phase: scan ────────────────────────────────────────────────────────────
  if (phase === "scan") {
    return (
      <MultiPhotoScanner
        autoScan
        requirePrice={false}
        onSaved={handleSaved}
        onClose={() => {
          if (savedRef.current) return; // ignore the scanner's post-save self-close
          onClose();
        }}
      />
    );
  }

  // ── Phase: serving (grams entry) ─────────────────────────────────────────────
  if (phase === "serving" && version && product) {
    return (
      <ServingEntrySheet
        productId={product.id}
        productName={product.name}
        brand={product.brand}
        nutrition={version}
        versionId={version.id}
        defaultDate={defaultDate}
        defaultMealType={defaultMealType}
        onClose={onClose}
        onLogged={onLogged}
      />
    );
  }

  // ── Phase: estimate (and the brief "loading version" state) ──────────────────
  const loadingVersion = phase === "serving" && !version;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="relative z-10 w-full sm:max-w-md max-h-[92vh] overflow-y-auto glass rounded-t-3xl sm:rounded-2xl border border-white/10 p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <ScanLine size={16} className="text-emerald-400" />
                {loadingVersion ? "Loading nutrition…" : "Estimate nutrition"}
              </h2>
              <p className="text-xs text-readable-faint truncate">
                {[product?.brand, product?.name].filter(Boolean).join(" · ") || "Scanned food"}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-readable-faint hover:text-white hover:bg-white/10 transition-colors shrink-0">
              <X size={16} />
            </button>
          </div>

          {loadingVersion ? (
            <p className="text-sm text-readable-faint flex items-center gap-2 py-8 justify-center">
              <Loader2 size={15} className="animate-spin" /> Loading…
            </p>
          ) : busy && !estItem ? (
            <p className="text-sm text-readable-faint flex items-center gap-2 py-8 justify-center">
              <Sparkles size={15} className="text-emerald-400 animate-pulse" /> Estimating the whole item…
            </p>
          ) : (
            <>
              <p className="text-xs text-readable-soft mb-3">
                No nutrition label was found, so here&apos;s an estimate for the{" "}
                <span className="text-white font-medium">whole item</span>. Adjust if needed — you can log all of it, half,
                or a custom amount next.
              </p>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wide text-readable-faint">Calories</span>
                  <input inputMode="decimal" value={wholeCal} onChange={(e) => setWholeCal(e.target.value)} className={inputCls} placeholder="0" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wide text-readable-faint">Protein g</span>
                  <input inputMode="decimal" value={wholeProt} onChange={(e) => setWholeProt(e.target.value)} className={inputCls} placeholder="0" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wide text-readable-faint">Weight g</span>
                  <input inputMode="decimal" value={wholeGrams} onChange={(e) => setWholeGrams(e.target.value)} className={inputCls} placeholder="opt." />
                </label>
              </div>

              {estItem?.sourceName && (
                <p className="text-[11px] text-readable-faint mb-2">Source: {estItem.sourceName}</p>
              )}
              {estItem && estItem.assumptions.length > 0 && (
                <ul className="mb-3 space-y-1">
                  {estItem.assumptions.map((a, i) => (
                    <li key={i} className="text-[11px] text-readable-faint flex gap-1.5">
                      <span>•</span>
                      {a}
                    </li>
                  ))}
                </ul>
              )}

              {err && <p className="text-xs text-amber-300/90 mb-2">{err}</p>}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={saveVersionThenServe}
                  disabled={busy}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                  Looks good — choose amount
                </button>
                {product && (
                  <button
                    onClick={() => runEstimate(product)}
                    disabled={busy}
                    title="Re-run the estimate"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 text-readable-soft px-3 py-2.5 text-sm hover:bg-white/[0.05] transition-colors disabled:opacity-40"
                  >
                    <RotateCcw size={14} /> Retry
                  </button>
                )}
              </div>
            </>
          )}

          {loadingVersion && err && <p className="text-xs text-amber-300/90 mt-3">{err}</p>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
