"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, LogOut, Lock, Star, Trash2, ScanLine, Search, Package,
  ListPlus, Check, Loader2, ChevronDown, History,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatUnitPrice } from "@/lib/products/units";
import { PRODUCT_CATEGORIES, type ProductOverview, type PriceHistoryEntry } from "@/lib/products/types";
import ProductScanner from "./ProductScanner";

const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors";

function sizeSummary(p: ProductOverview): string | null {
  if (p.total_weight != null) return `${p.total_weight} ${p.weight_unit ?? "lb"}`;
  if (p.package_count != null) return `${p.package_count} ct`;
  if (p.package_size != null) return `${p.package_size} ${p.package_unit ?? ""}`.trim();
  return null;
}

export default function ProductsClient({
  email,
  canEdit,
  initialProducts,
}: {
  email: string | null;
  canEdit: boolean;
  initialProducts: ProductOverview[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [products, setProducts] = useState<ProductOverview[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [cat, setCat] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [err, setErr] = useState("");

  async function signOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  function upsert(p: ProductOverview) {
    setProducts((prev) => {
      const i = prev.findIndex((x) => x.id === p.id);
      if (i === -1) return [p, ...prev];
      const next = [...prev];
      next[i] = p;
      return next;
    });
  }

  async function toggleFav(p: ProductOverview) {
    const next = !p.is_favorite;
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_favorite: next } : x)));
    try {
      await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      });
    } catch {
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_favorite: !next } : x)));
    }
  }

  async function remove(id: string) {
    const prev = products;
    setProducts((p) => p.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setProducts(prev);
      setErr("Couldn't delete that product.");
    }
  }

  const filtered = products.filter((p) => {
    if (favOnly && !p.is_favorite) return false;
    if (cat && (p.category ?? "") !== cat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const hay = `${p.name} ${p.brand ?? ""} ${p.variant ?? ""} ${p.category ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const categories = useMemo(() => {
    const present = new Set(products.map((p) => p.category).filter(Boolean) as string[]);
    return PRODUCT_CATEGORIES.filter((c) => present.has(c));
  }, [products]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Back + account */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex items-center justify-between mb-8">
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-readable-soft hover:text-readable-strong transition-colors">
          <ArrowLeft size={14} /> Back to Tools
        </Link>
        {email ? (
          <button onClick={signOut} className="inline-flex items-center gap-1.5 text-xs text-readable-faint hover:text-readable-strong transition-colors">
            <LogOut size={13} /> Sign out
          </button>
        ) : (
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-readable-faint hover:text-readable-strong transition-colors">
            <Lock size={13} /> Sign in
          </Link>
        )}
      </motion.div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
            <Package size={20} className="text-rose-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">My Costco Products</h1>
            <p className="text-sm text-readable-soft">
              {canEdit
                ? products.length
                  ? `${products.length} product${products.length === 1 ? "" : "s"} tracked`
                  : "Scan your first product to start the database"
                : "A personal product & price database"}
            </p>
          </div>
        </div>
      </motion.div>

      {!canEdit ? (
        <div className="glass rounded-2xl border border-white/10 p-10 text-center">
          <Lock size={28} className="text-readable-faint mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">This database is private</h2>
          <p className="text-sm text-readable-soft mb-6 max-w-sm mx-auto">Sign in to scan products and view your price history.</p>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 px-4 py-2 text-sm font-medium hover:bg-rose-500/25 transition-colors">
            <Lock size={14} /> Sign in
          </Link>
        </div>
      ) : (
        <>
          {/* Scan CTA */}
          <button
            onClick={() => setScanOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/15 border border-emerald-500/30 text-emerald-200 px-4 py-3.5 text-sm font-semibold hover:from-emerald-500/30 hover:to-teal-500/25 transition-colors mb-6"
          >
            <ScanLine size={18} /> Scan Product or Price
          </button>

          {/* Filters */}
          {products.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 mb-5">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-readable-faint" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className={`${inputCls} w-full pl-9`} />
              </div>
              <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} sm:w-40`}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                onClick={() => setFavOnly((v) => !v)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  favOnly ? "border-amber-400/40 bg-amber-400/10 text-amber-300" : "border-white/10 text-readable-soft hover:bg-white/[0.06]"
                }`}
              >
                <Star size={14} className={favOnly ? "fill-amber-300" : ""} /> Favorites
              </button>
            </div>
          )}

          {err && <p className="text-xs text-red-300/90 mb-3">{err}</p>}

          {/* Empty state */}
          {products.length === 0 && (
            <div className="glass rounded-2xl border border-white/10 p-10 text-center">
              <Package size={26} className="text-rose-400/70 mx-auto mb-3" />
              <p className="text-sm text-readable-soft">No products yet. Tap <span className="text-emerald-300">Scan Product or Price</span> to capture your first one.</p>
            </div>
          )}

          {products.length > 0 && filtered.length === 0 && (
            <p className="text-sm text-readable-faint text-center py-8">No products match your filters.</p>
          )}

          {/* Product cards */}
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onToggleFav={() => toggleFav(p)} onRemove={() => remove(p.id)} />
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}

      {scanOpen && <ProductScanner onClose={() => setScanOpen(false)} onSaved={upsert} />}
    </div>
  );
}

function ProductCard({
  product: p,
  onToggleFav,
  onRemove,
}: {
  product: ProductOverview;
  onToggleFav: () => void;
  onRemove: () => void;
}) {
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<PriceHistoryEntry[] | null>(null);
  const [loadingHist, setLoadingHist] = useState(false);

  const unit = formatUnitPrice(p.last_unit_price, p.last_unit_type);
  const size = sizeSummary(p);

  async function addToList() {
    if (adding || added) return;
    setAdding(true);
    try {
      const res = await fetch("/api/grocery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: p.name, category: p.category ?? null }),
      });
      if (!res.ok) throw new Error();
      setAdded(true);
    } catch {
      /* ignore */
    } finally {
      setAdding(false);
    }
  }

  async function toggleHistory() {
    const next = !open;
    setOpen(next);
    if (next && history === null && !loadingHist) {
      setLoadingHist(true);
      try {
        const res = await fetch(`/api/products/${p.id}`);
        const json = await res.json();
        setHistory((json.history as PriceHistoryEntry[]) ?? []);
      } catch {
        setHistory([]);
      } finally {
        setLoadingHist(false);
      }
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="glass rounded-xl border border-white/8 overflow-hidden"
    >
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg bg-white/[0.04] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <Package size={20} className="text-readable-faint" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{p.name}</p>
              <p className="text-xs text-readable-faint truncate">
                {[p.brand, p.variant, size].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <button onClick={onToggleFav} aria-label="Toggle favorite" className="p-1 shrink-0">
              <Star size={16} className={p.is_favorite ? "fill-amber-300 text-amber-300" : "text-readable-faint hover:text-amber-300"} />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {p.last_total_price != null && (
              <span className="text-sm font-semibold text-emerald-300">${Number(p.last_total_price).toFixed(2)}</span>
            )}
            {unit && <span className="text-[11px] text-readable-soft">{unit}</span>}
            {p.category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/10 text-readable-faint">{p.category}</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center border-t border-white/[0.06] divide-x divide-white/[0.06] text-xs">
        <button onClick={addToList} disabled={adding} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-readable-soft hover:bg-white/[0.04] transition-colors disabled:opacity-50">
          {added ? <Check size={13} className="text-emerald-400" /> : adding ? <Loader2 size={13} className="animate-spin" /> : <ListPlus size={13} />}
          {added ? "Added" : "Add to list"}
        </button>
        <button onClick={toggleHistory} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-readable-soft hover:bg-white/[0.04] transition-colors">
          <History size={13} /> {p.price_count} price{p.price_count === 1 ? "" : "s"}
          <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button onClick={onRemove} aria-label="Delete product" className="px-4 inline-flex items-center justify-center py-2 text-readable-faint hover:text-red-300 hover:bg-red-500/[0.06] transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Price history */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/[0.06] bg-black/20 overflow-hidden">
            <div className="p-3">
              {loadingHist ? (
                <p className="text-xs text-readable-faint">Loading price history…</p>
              ) : history && history.length > 0 ? (
                <ul className="space-y-1.5">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-center justify-between text-xs">
                      <span className="text-readable-faint">
                        {new Date(h.observed_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        {h.store_name ? ` · ${h.store_name}` : ""}
                      </span>
                      <span className="text-readable-soft">
                        ${Number(h.total_price).toFixed(2)}
                        {h.unit_price != null && h.unit_type ? ` · ${formatUnitPrice(Number(h.unit_price), h.unit_type)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-readable-faint">No price history yet.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
