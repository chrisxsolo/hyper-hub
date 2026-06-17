"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Package, Loader2 } from "lucide-react";
import type { ProductOverview } from "@/lib/products/types";

// A searchable picker for choosing an existing product — used when attaching a
// nutrition label to a product from the list or the grocery page. Self-contained
// (fetches /api/products).
export default function ProductPicker({
  title = "Choose a product",
  subtitle,
  onPick,
  onClose,
}: {
  title?: string;
  subtitle?: string;
  onPick: (product: ProductOverview) => void;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<ProductOverview[] | null>(null);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/products");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Couldn't load products.");
        setProducts((json.products as ProductOverview[]) ?? []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Couldn't load products.");
        setProducts([]);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p.name} ${p.brand ?? ""} ${p.variant ?? ""}`.toLowerCase().includes(q),
    );
  }, [products, search]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="relative z-10 w-full sm:max-w-md max-h-[80vh] flex flex-col glass rounded-t-3xl sm:rounded-2xl border border-white/10 p-5"
        >
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-readable-faint hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
          </div>
          {subtitle && <p className="text-xs text-readable-faint mb-3">{subtitle}</p>}

          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-readable-faint" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" autoFocus className="w-full rounded-lg bg-white/[0.04] border border-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40" />
          </div>

          {err && <p className="text-xs text-red-300/90 mb-2">{err}</p>}

          <div className="flex-1 overflow-y-auto -mx-1 px-1">
            {products === null ? (
              <p className="text-sm text-readable-faint flex items-center gap-2 py-6 justify-center"><Loader2 size={15} className="animate-spin" /> Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-readable-faint text-center py-6">
                {products.length === 0 ? "No products yet — scan a product first." : "No products match."}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {filtered.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => onPick(p)} className="w-full flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-left hover:bg-white/[0.06] transition-colors">
                      <div className="w-10 h-10 rounded-md bg-white/[0.04] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : <Package size={16} className="text-readable-faint" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{p.name}</p>
                        <p className="text-xs text-readable-faint truncate">
                          {[p.brand, p.variant].filter(Boolean).join(" · ") || "—"}
                          {p.has_nutrition ? " · has nutrition" : ""}
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
  );
}
