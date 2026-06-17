"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2, Package, Plus, Sparkles, Bookmark, ChevronLeft, Check } from "lucide-react";
import { foodLibraryToProposed, savedFoodToProposed } from "@/lib/nutrition/helpers";
import { scaleNutrition } from "@/lib/products/serving";
import type { FoodLibraryEntry } from "@/lib/products/types";
import type { MealType, ProposedItem, SavedFood } from "@/lib/nutrition/types";

const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors";

type Tab = "library" | "saved" | "ai";
const MASS_UNITS = ["serving", "g", "oz", "lb"];

// Source picker for the meal planner: add foods from the Costco food library,
// your saved foods, or a free-text AI estimate. Each add emits one-or-more
// ProposedItems to the planner via `onAdd`; the sheet stays open so you can
// compose a full meal, then "Done".
export default function PlanAddSheet({
  savedFoods,
  mealType,
  onAdd,
  onClose,
}: {
  savedFoods: SavedFood[];
  mealType: MealType;
  onAdd: (items: ProposedItem[]) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("library");
  const [entries, setEntries] = useState<FoodLibraryEntry[] | null>(null);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");
  const [addedCount, setAddedCount] = useState(0);

  const [libSel, setLibSel] = useState<FoodLibraryEntry | null>(null);
  const [libAmt, setLibAmt] = useState("1");
  const [libUnit, setLibUnit] = useState("serving");

  const [savedSel, setSavedSel] = useState<SavedFood | null>(null);
  const [savedAmt, setSavedAmt] = useState("100");
  const [savedUnit, setSavedUnit] = useState("g");

  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/nutrition/products");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Couldn't load your products.");
        setEntries((json.items as FoodLibraryEntry[]) ?? []);
      } catch {
        setEntries([]);
      }
    })();
  }, []);

  const filteredLib = useMemo(() => {
    if (!entries) return [];
    const q = search.trim().toLowerCase();
    return q
      ? entries.filter((e) => `${e.name} ${e.brand ?? ""}`.toLowerCase().includes(q))
      : entries;
  }, [entries, search]);

  const filteredSaved = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? savedFoods.filter((f) => `${f.name} ${f.brand ?? ""}`.toLowerCase().includes(q))
      : savedFoods;
  }, [savedFoods, search]);

  function flashAdded(n: number) {
    setAddedCount((c) => c + n);
    setErr("");
  }

  // Library add ----------------------------------------------------------------
  const libPreview = useMemo(() => {
    if (!libSel) return null;
    const amt = Number(libAmt);
    if (!Number.isFinite(amt) || amt <= 0) return null;
    return scaleNutrition(libSel.nutrition, amt, libUnit);
  }, [libSel, libAmt, libUnit]);

  function addLibrary() {
    if (!libSel) return;
    const item = foodLibraryToProposed(libSel, Number(libAmt), libUnit);
    if (!item) {
      setErr(`Can't measure ${libSel.name} by "${libUnit}".`);
      return;
    }
    onAdd([item]);
    flashAdded(1);
    setLibSel(null);
    setLibAmt("1");
    setLibUnit("serving");
  }

  // Saved add ------------------------------------------------------------------
  const savedPreview = useMemo(() => {
    if (!savedSel) return null;
    const amt = Number(savedAmt);
    if (!Number.isFinite(amt) || amt <= 0) return null;
    return savedFoodToProposed(savedSel, amt, savedSel.basis === "per_100g" ? savedUnit : "serving");
  }, [savedSel, savedAmt, savedUnit]);

  function selectSaved(f: SavedFood) {
    setSavedSel(f);
    if (f.basis === "per_100g") {
      setSavedAmt("100");
      setSavedUnit("g");
    } else {
      setSavedAmt("1");
      setSavedUnit("serving");
    }
  }
  function addSaved() {
    if (!savedSel) return;
    const item = savedFoodToProposed(
      savedSel,
      Number(savedAmt),
      savedSel.basis === "per_100g" ? savedUnit : "serving",
    );
    onAdd([item]);
    flashAdded(1);
    setSavedSel(null);
  }

  // AI add ---------------------------------------------------------------------
  async function addAi() {
    const text = aiText.trim();
    if (!text || aiBusy) return;
    setAiBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/nutrition/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mealType }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Couldn't estimate that.");
      const items = (json.meal?.items as ProposedItem[]) ?? [];
      if (!items.length) throw new Error("No foods found in that text.");
      onAdd(items);
      flashAdded(items.length);
      setAiText("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't estimate that.");
    } finally {
      setAiBusy(false);
    }
  }

  const showSearch = (tab === "library" && !libSel) || (tab === "saved" && !savedSel);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[58] flex items-end sm:items-center justify-center p-0 sm:p-4"
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
          className="relative z-10 w-full sm:max-w-md max-h-[85vh] flex flex-col glass rounded-t-3xl sm:rounded-2xl border border-white/10 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Plus size={16} className="text-emerald-400" /> Add a food
              {addedCount > 0 && (
                <span className="text-[11px] font-medium text-emerald-300/90">· {addedCount} added</span>
              )}
            </h2>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-readable-faint hover:text-white hover:bg-white/10 transition-colors">
              <X size={16} />
            </button>
          </div>

          {!libSel && !savedSel && (
            <div className="flex gap-2 mb-3">
              {([
                { k: "library", label: "Costco", icon: Package },
                { k: "saved", label: "Saved", icon: Bookmark },
                { k: "ai", label: "AI / text", icon: Sparkles },
              ] as { k: Tab; label: string; icon: React.ElementType }[]).map(({ k, label, icon: Icon }) => (
                <button
                  key={k}
                  onClick={() => { setTab(k); setErr(""); }}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${tab === k ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30" : "text-readable-soft border-white/10 hover:bg-white/[0.05]"}`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          )}

          {showSearch && (
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-readable-faint" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search foods" className="w-full rounded-lg bg-white/[0.04] border border-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40" />
            </div>
          )}

          {err && <p className="text-xs text-amber-300/90 mb-2">{err}</p>}

          <div className="flex-1 overflow-y-auto -mx-1 px-1">
            {/* Library list / detail */}
            {tab === "library" && !libSel && (
              entries === null ? (
                <Loading />
              ) : filteredLib.length === 0 ? (
                <Empty text={entries.length === 0 ? "No Costco products with nutrition yet." : "No products match."} />
              ) : (
                <ul className="space-y-1.5">
                  {filteredLib.map((e) => (
                    <li key={e.productId}>
                      <button onClick={() => { setLibSel(e); setLibUnit("serving"); setLibAmt("1"); }} className="w-full flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-left hover:bg-white/[0.06] transition-colors">
                        <div className="w-9 h-9 rounded-md bg-white/[0.04] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                          {e.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={e.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : <Package size={15} className="text-readable-faint" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{e.name}</p>
                          <p className="text-xs text-readable-faint truncate">
                            {e.nutrition.calories ?? "—"} cal · {e.nutrition.protein_g ?? "—"} g protein
                            {e.nutrition.serving_size_description ? ` · ${e.nutrition.serving_size_description}` : ""}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            )}
            {tab === "library" && libSel && (
              <Detail
                name={libSel.name}
                brand={libSel.brand}
                onBack={() => setLibSel(null)}
                amount={libAmt}
                onAmount={setLibAmt}
                unit={libUnit}
                onUnit={setLibUnit}
                units={["serving", "g", "oz", "lb", "ml", "fl oz", "item"]}
                cal={libPreview?.ok ? libPreview.snapshot.calories : null}
                prot={libPreview?.ok ? libPreview.snapshot.proteinG : null}
                warn={libPreview && !libPreview.ok ? libPreview.reason : null}
                onAdd={addLibrary}
                disabled={!libPreview?.ok}
              />
            )}

            {/* Saved list / detail */}
            {tab === "saved" && !savedSel && (
              filteredSaved.length === 0 ? (
                <Empty text={savedFoods.length === 0 ? "No saved foods yet — log a few meals first." : "No foods match."} />
              ) : (
                <ul className="space-y-1.5">
                  {filteredSaved.map((f) => (
                    <li key={f.id}>
                      <button onClick={() => selectSaved(f)} className="w-full flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-left hover:bg-white/[0.06] transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{f.name}{f.brand ? <span className="text-readable-faint"> · {f.brand}</span> : null}</p>
                          <p className="text-xs text-readable-faint truncate">
                            {f.basis === "per_100g"
                              ? `${f.calories_per_100g ?? "—"} cal · ${f.protein_per_100g ?? "—"} g protein / 100 g`
                              : `${f.serving_calories ?? "—"} cal · ${f.serving_protein_g ?? "—"} g protein / ${f.serving_label ?? "serving"}`}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            )}
            {tab === "saved" && savedSel && (
              <Detail
                name={savedSel.name}
                brand={savedSel.brand}
                onBack={() => setSavedSel(null)}
                amount={savedAmt}
                onAmount={setSavedAmt}
                unit={savedSel.basis === "per_100g" ? savedUnit : "serving"}
                onUnit={setSavedUnit}
                units={savedSel.basis === "per_100g" ? MASS_UNITS.filter((u) => u !== "serving") : ["serving"]}
                cal={savedPreview?.calories ?? null}
                prot={savedPreview?.proteinGrams ?? null}
                warn={null}
                onAdd={addSaved}
                disabled={!savedPreview}
              />
            )}

            {/* AI tab */}
            {tab === "ai" && (
              <div>
                <p className="text-xs text-readable-soft mb-2">Describe a food or mini-meal — it&apos;s estimated and added to your plan.</p>
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") addAi(); }}
                  rows={3}
                  placeholder="e.g. 200 g grilled salmon and a cup of quinoa"
                  className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 resize-none"
                />
                <button
                  onClick={addAi}
                  disabled={aiBusy || !aiText.trim()}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
                >
                  {aiBusy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  Estimate &amp; add
                </button>
              </div>
            )}
          </div>

          <button onClick={onClose} className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/12 text-readable-soft px-4 py-2.5 text-sm font-medium hover:bg-white/[0.05] transition-colors">
            <Check size={15} /> Done
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Loading() {
  return <p className="text-sm text-readable-faint flex items-center gap-2 py-6 justify-center"><Loader2 size={15} className="animate-spin" /> Loading…</p>;
}
function Empty({ text }: { text: string }) {
  return <p className="text-sm text-readable-faint text-center py-6">{text}</p>;
}

function Detail({
  name, brand, onBack, amount, onAmount, unit, onUnit, units, cal, prot, warn, onAdd, disabled,
}: {
  name: string;
  brand: string | null;
  onBack: () => void;
  amount: string;
  onAmount: (v: string) => void;
  unit: string;
  onUnit: (v: string) => void;
  units: string[];
  cal: number | null;
  prot: number | null;
  warn: string | null;
  onAdd: () => void;
  disabled: boolean;
}) {
  const multiUnit = units.length > 1;
  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-readable-faint hover:text-white mb-2">
        <ChevronLeft size={14} /> Back
      </button>
      <p className="text-sm text-white mb-3">{name}{brand ? <span className="text-readable-faint"> · {brand}</span> : null}</p>
      <div className="flex gap-2 mb-3">
        <input inputMode="decimal" value={amount} onChange={(e) => onAmount(e.target.value)} className={`${inputCls} flex-1`} placeholder="Amount" />
        {multiUnit ? (
          <select value={unit} onChange={(e) => onUnit(e.target.value)} className={`${inputCls} w-28 [color-scheme:dark]`}>
            {units.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        ) : (
          <span className="inline-flex items-center px-3 rounded-lg border border-white/10 text-sm text-readable-soft">{unit}</span>
        )}
      </div>
      {warn ? (
        <p className="text-xs text-amber-300/90 mb-3">{warn}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg border border-white/8 bg-white/[0.02] p-2 text-center">
            <div className="text-sm font-bold text-white">{cal != null ? Math.round(cal) : "—"}</div>
            <div className="text-[9px] uppercase tracking-wide text-readable-faint">cal</div>
          </div>
          <div className="rounded-lg border border-white/8 bg-white/[0.02] p-2 text-center">
            <div className="text-sm font-bold text-white">{prot != null ? Math.round(prot * 10) / 10 : "—"}<span className="text-[10px] text-readable-faint font-normal">g</span></div>
            <div className="text-[9px] uppercase tracking-wide text-readable-faint">protein</div>
          </div>
        </div>
      )}
      <button onClick={onAdd} disabled={disabled} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40">
        <Plus size={15} /> Add to plan
      </button>
    </div>
  );
}
