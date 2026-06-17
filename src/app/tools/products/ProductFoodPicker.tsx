"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Package, Loader2, Star, Beef } from "lucide-react";
import type { FoodLibraryEntry } from "@/lib/products/types";
import type { MealType } from "@/lib/nutrition/types";
import ServingEntrySheet from "./ServingEntrySheet";

type Tab = "all" | "favorites";

// The calorie tracker's "Costco Products" food library (spec §9). Lists products
// with confirmed nutrition; picking one opens the serving-entry sheet to log it.
export default function ProductFoodPicker({
  defaultDate,
  defaultMealType,
  onLogged,
  onClose,
}: {
  defaultDate: string;
  defaultMealType?: MealType;
  onLogged: (mealId: string) => void;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<FoodLibraryEntry[] | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [highProtein, setHighProtein] = useState(false);
  const [selected, setSelected] = useState<FoodLibraryEntry | null>(null);

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
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Couldn't load your products.");
        setEntries([]);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (tab === "favorites" && !e.isFavorite) return false;
      if (highProtein && !((e.nutrition.protein_g ?? 0) >= 20)) return false;
      if (q && !`${e.name} ${e.brand ?? ""} ${e.category ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, tab, search, highProtein]);

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 w-full sm:max-w-md max-h-[82vh] flex flex-col glass rounded-t-3xl sm:rounded-2xl border border-white/10 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Your Costco products</h2>
              <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-readable-faint hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
            </div>

            <div className="flex gap-2 mb-3">
              {(["all", "favorites"] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${tab === t ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30" : "text-readable-soft border-white/10 hover:bg-white/[0.05]"}`}>
                  {t === "all" ? "All" : "Favorites"}
                </button>
              ))}
              <button onClick={() => setHighProtein((v) => !v)} className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${highProtein ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30" : "text-readable-soft border-white/10 hover:bg-white/[0.05]"}`}>
                <Beef size={13} /> High protein
              </button>
            </div>

            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-readable-faint" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" autoFocus className="w-full rounded-lg bg-white/[0.04] border border-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40" />
            </div>

            {err && <p className="text-xs text-red-300/90 mb-2">{err}</p>}

            <div className="flex-1 overflow-y-auto -mx-1 px-1">
              {entries === null ? (
                <p className="text-sm text-readable-faint flex items-center gap-2 py-6 justify-center"><Loader2 size={15} className="animate-spin" /> Loading…</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-readable-faint text-center py-6">
                  {entries.length === 0 ? "No products with nutrition yet. Scan a nutrition label on the Products page." : "No products match."}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {filtered.map((e) => (
                    <li key={e.productId}>
                      <button onClick={() => setSelected(e)} className="w-full flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-left hover:bg-white/[0.06] transition-colors">
                        <div className="w-10 h-10 rounded-md bg-white/[0.04] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                          {e.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={e.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : <Package size={16} className="text-readable-faint" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate flex items-center gap-1">
                            {e.name}
                            {e.isFavorite && <Star size={11} className="fill-amber-300 text-amber-300 shrink-0" />}
                          </p>
                          <p className="text-xs text-readable-faint truncate">
                            {e.nutrition.calories ?? "—"} cal · {e.nutrition.protein_g ?? "—"} g protein
                            {e.nutrition.serving_size_description ? ` · ${e.nutrition.serving_size_description}` : ""}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {selected && (
        <ServingEntrySheet
          productId={selected.productId}
          productName={selected.name}
          brand={selected.brand}
          nutrition={selected.nutrition}
          versionId={selected.nutrition.id}
          defaultDate={defaultDate}
          defaultMealType={defaultMealType}
          onClose={() => setSelected(null)}
          onLogged={(mealId) => { setSelected(null); onLogged(mealId); onClose(); }}
        />
      )}
    </>
  );
}
