"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, LogOut, Lock, Plus, Check, Trash2, Pencil, X,
  ShoppingCart, Loader2, Sparkles, ScanLine, Package, UtensilsCrossed,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatUnitPrice } from "@/lib/products/units";
import { todayInTz } from "@/lib/nutrition/db";
import { GROCERY_CATEGORIES, type GroceryItemView } from "@/lib/health/grocery";
import type { DbCostcoProductNutritionVersion, NutritionVersionEntry } from "@/lib/products/types";
import ProductScanner from "../products/ProductScanner";
import ServingEntrySheet from "../products/ServingEntrySheet";

const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors w-full";

type TrackerTarget = {
  productId: string;
  name: string;
  brand: string | null;
  nutrition: DbCostcoProductNutritionVersion;
};

export default function GroceryClient({
  email,
  canEdit,
  initialItems,
}: {
  email: string | null;
  canEdit: boolean;
  initialItems: GroceryItemView[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [items, setItems] = useState<GroceryItemView[]>(initialItems);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [cat, setCat] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editCat, setEditCat] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [trackerBusyId, setTrackerBusyId] = useState<string | null>(null);
  const [tracker, setTracker] = useState<TrackerTarget | null>(null);

  const active = items.filter((i) => !i.checked);
  const done = items.filter((i) => i.checked);
  const remaining = active.length;
  const progress = items.length ? Math.round((done.length / items.length) * 100) : 0;
  const today = todayInTz("America/Los_Angeles");

  async function signOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  async function api(url: string, init?: RequestInit) {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || "Something went wrong.");
    return json;
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setErr("");
    try {
      const { item } = await api("/api/grocery", {
        method: "POST",
        body: JSON.stringify({ name: trimmed, quantity: qty.trim() || null, category: cat.trim() || null }),
      });
      setItems((prev) => [...prev, item as GroceryItemView]);
      setName("");
      setQty("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't add item.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: GroceryItemView) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)));
    try {
      await api(`/api/grocery/${item.id}`, { method: "PATCH", body: JSON.stringify({ checked: !item.checked }) });
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: item.checked } : i)));
      setErr("Couldn't update item.");
    }
  }

  async function remove(id: string) {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    try {
      await api(`/api/grocery/${id}`, { method: "DELETE" });
    } catch {
      setItems(prev);
      setErr("Couldn't delete item.");
    }
  }

  function startEdit(item: GroceryItemView) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQty(item.quantity ?? "");
    setEditCat(item.category ?? "");
  }

  async function saveEdit(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    try {
      const { item } = await api(`/api/grocery/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: trimmed, quantity: editQty.trim() || null, category: editCat.trim() || null }),
      });
      setItems((prev) => prev.map((i) => (i.id === id ? (item as GroceryItemView) : i)));
      setEditingId(null);
    } catch {
      setErr("Couldn't save changes.");
    }
  }

  async function clearCompleted() {
    if (!done.length || busy) return;
    const prev = items;
    setItems((p) => p.filter((i) => !i.checked));
    try {
      await api("/api/grocery/clear", { method: "POST" });
    } catch {
      setItems(prev);
      setErr("Couldn't clear completed items.");
    }
  }

  // Fetch the product's current nutrition version, then open the serving sheet.
  async function openTracker(item: GroceryItemView) {
    if (!item.product_id || trackerBusyId) return;
    setTrackerBusyId(item.id);
    setErr("");
    try {
      const json = await api(`/api/products/${item.product_id}/nutrition`);
      const versions = (json.versions as NutritionVersionEntry[]) ?? [];
      const current = versions.find((v) => v.is_current) ?? null;
      if (!current) {
        setErr("That product has no confirmed nutrition yet.");
        return;
      }
      setTracker({
        productId: item.product_id,
        name: item.name,
        brand: item.product?.brand ?? null,
        nutrition: current,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't load nutrition.");
    } finally {
      setTrackerBusyId(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
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
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <ShoppingCart size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Grocery List</h1>
            <p className="text-sm text-readable-soft">
              {canEdit
                ? remaining > 0
                  ? `${remaining} item${remaining === 1 ? "" : "s"} remaining`
                  : items.length
                  ? "All done — nothing left to grab"
                  : "Your list is empty"
                : "A running shopping list"}
            </p>
          </div>
        </div>
      </motion.div>

      {!canEdit ? (
        <div className="glass rounded-2xl border border-white/10 p-10 text-center">
          <Lock size={28} className="text-readable-faint mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">This list is private</h2>
          <p className="text-sm text-readable-soft mb-6 max-w-sm mx-auto">The grocery list is personal. Sign in to view and manage it.</p>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-2 text-sm font-medium hover:bg-emerald-500/25 transition-colors">
            <Lock size={14} /> Sign in
          </Link>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          {items.length > 0 && (
            <div className="mb-5">
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
              </div>
              <div className="flex justify-between mt-1.5 text-[11px] text-readable-faint">
                <span>{done.length} of {items.length} in cart</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {/* Scan a product / price → product database (and this list) */}
          <button
            onClick={() => setScanOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 text-emerald-200 px-4 py-3 text-sm font-medium hover:from-emerald-500/25 hover:to-teal-500/20 transition-colors mb-4"
          >
            <ScanLine size={17} /> Scan Product or Price
          </button>

          {/* Add item */}
          <form onSubmit={addItem} className="glass rounded-2xl border border-white/10 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add an item — e.g. Rotisserie chicken" className={`${inputCls} sm:flex-1`} autoFocus />
              <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty" className={`${inputCls} sm:w-24`} />
              <input value={cat} onChange={(e) => setCat(e.target.value)} placeholder="Aisle" list="grocery-cats" className={`${inputCls} sm:w-32`} />
              <datalist id="grocery-cats">
                {GROCERY_CATEGORIES.map((c) => (<option key={c} value={c} />))}
              </datalist>
              <button type="submit" disabled={busy || !name.trim()} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Add
              </button>
            </div>
            {err && <p className="text-xs text-red-300/90 mt-2">{err}</p>}
          </form>

          {/* Empty state */}
          {items.length === 0 && (
            <div className="glass rounded-2xl border border-white/10 p-10 text-center">
              <Sparkles size={26} className="text-emerald-400/70 mx-auto mb-3" />
              <p className="text-sm text-readable-soft">Nothing on the list yet. Add your first item above.</p>
            </div>
          )}

          {/* Active items */}
          {active.length > 0 && (
            <ul className="space-y-2 mb-8">
              <AnimatePresence initial={false}>
                {active.map((item) => (
                  <GroceryRow
                    key={item.id}
                    item={item}
                    editing={editingId === item.id}
                    editName={editName} editQty={editQty} editCat={editCat}
                    setEditName={setEditName} setEditQty={setEditQty} setEditCat={setEditCat}
                    trackerBusy={trackerBusyId === item.id}
                    onToggle={() => toggle(item)}
                    onStartEdit={() => startEdit(item)}
                    onCancelEdit={() => setEditingId(null)}
                    onSaveEdit={() => saveEdit(item.id)}
                    onRemove={() => remove(item.id)}
                    onAddToTracker={() => openTracker(item)}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}

          {/* Completed items */}
          {done.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wide text-readable-faint">In cart ({done.length})</span>
                <button onClick={clearCompleted} className="inline-flex items-center gap-1.5 text-xs text-readable-faint hover:text-red-300 transition-colors">
                  <Trash2 size={12} /> Clear completed
                </button>
              </div>
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {done.map((item) => (
                    <GroceryRow
                      key={item.id}
                      item={item}
                      editing={false}
                      onToggle={() => toggle(item)}
                      onStartEdit={() => startEdit(item)}
                      onCancelEdit={() => setEditingId(null)}
                      onSaveEdit={() => saveEdit(item.id)}
                      onRemove={() => remove(item.id)}
                      onAddToTracker={() => openTracker(item)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          )}
        </>
      )}

      {scanOpen && (
        <ProductScanner
          onClose={() => setScanOpen(false)}
          defaultAddToGrocery
          onAddedToGrocery={(item) =>
            setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item as GroceryItemView]))
          }
        />
      )}

      {tracker && (
        <ServingEntrySheet
          productId={tracker.productId}
          productName={tracker.name}
          brand={tracker.brand}
          nutrition={tracker.nutrition}
          versionId={tracker.nutrition.id}
          defaultDate={today}
          onClose={() => setTracker(null)}
        />
      )}
    </div>
  );
}

function GroceryRow({
  item, editing,
  editName = "", editQty = "", editCat = "",
  setEditName, setEditQty, setEditCat,
  trackerBusy = false,
  onToggle, onStartEdit, onCancelEdit, onSaveEdit, onRemove, onAddToTracker,
}: {
  item: GroceryItemView;
  editing: boolean;
  editName?: string; editQty?: string; editCat?: string;
  setEditName?: (v: string) => void; setEditQty?: (v: string) => void; setEditCat?: (v: string) => void;
  trackerBusy?: boolean;
  onToggle: () => void; onStartEdit: () => void; onCancelEdit: () => void;
  onSaveEdit: () => void; onRemove: () => void; onAddToTracker: () => void;
}) {
  const prod = item.product;
  const unit = prod ? formatUnitPrice(prod.last_unit_price, prod.last_unit_type) : null;
  const hasNutrition = !!prod?.nutrition_version_id;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="group glass rounded-xl border border-white/8 px-3 py-2.5"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          aria-label={item.checked ? "Mark as not bought" : "Mark as bought"}
          className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
            item.checked ? "bg-emerald-500/80 border-emerald-400 text-white" : "border-white/25 hover:border-emerald-400/60"
          }`}
        >
          {item.checked && <Check size={12} strokeWidth={3} />}
        </button>

        {editing ? (
          <div className="flex-1 flex flex-col sm:flex-row gap-1.5">
            <input value={editName} onChange={(e) => setEditName?.(e.target.value)} className={`${inputCls} sm:flex-1`} onKeyDown={(e) => { if (e.key === "Enter") onSaveEdit(); if (e.key === "Escape") onCancelEdit(); }} autoFocus />
            <input value={editQty} onChange={(e) => setEditQty?.(e.target.value)} placeholder="Qty" className={`${inputCls} sm:w-20`} />
            <input value={editCat} onChange={(e) => setEditCat?.(e.target.value)} placeholder="Aisle" className={`${inputCls} sm:w-24`} />
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm ${item.checked ? "line-through text-readable-faint" : "text-white"}`}>{item.name}</span>
              {item.quantity && <span className="text-xs text-readable-faint">×{item.quantity}</span>}
              {item.category && <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/10 text-readable-faint">{item.category}</span>}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {editing ? (
            <>
              <button onClick={onSaveEdit} aria-label="Save" className="p-1.5 rounded-md text-emerald-300 hover:bg-emerald-500/15 transition-colors"><Check size={14} /></button>
              <button onClick={onCancelEdit} aria-label="Cancel" className="p-1.5 rounded-md text-readable-faint hover:bg-white/10 transition-colors"><X size={14} /></button>
            </>
          ) : (
            <>
              {!item.checked && (
                <button onClick={onStartEdit} aria-label="Edit" className="p-1.5 rounded-md text-readable-faint hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"><Pencil size={13} /></button>
              )}
              <button onClick={onRemove} aria-label="Delete" className="p-1.5 rounded-md text-readable-faint hover:text-red-300 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
            </>
          )}
        </div>
      </div>

      {/* Product preview (references the canonical product — always latest info) */}
      {prod && !editing && (
        <Link href={`/tools/products/${prod.id}`} className="mt-2 ml-8 flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 hover:bg-white/[0.05] transition-colors">
          <div className="w-9 h-9 rounded-md bg-white/[0.04] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
            {prod.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prod.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : <Package size={14} className="text-readable-faint" />}
          </div>
          <div className="flex-1 min-w-0 text-[11px] text-readable-faint">
            <div className="flex items-center gap-2 flex-wrap">
              {prod.last_total_price != null && <span className="text-emerald-300 font-medium">${Number(prod.last_total_price).toFixed(2)}</span>}
              {unit && <span>{unit}</span>}
              {prod.package_summary && <span>· {prod.package_summary}</span>}
            </div>
            {hasNutrition && prod.n_calories != null && (
              <div className="mt-0.5">{prod.n_calories} cal · {prod.n_protein_g ?? "—"} g protein{prod.n_serving_desc ? ` / ${prod.n_serving_desc}` : ""}</div>
            )}
          </div>
        </Link>
      )}
      {hasNutrition && !editing && (
        <div className="ml-8 mt-1.5">
          <button
            onClick={onAddToTracker}
            disabled={trackerBusy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 px-2.5 py-1 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
          >
            {trackerBusy ? <Loader2 size={12} className="animate-spin" /> : <UtensilsCrossed size={12} />}
            Add to Calorie Tracker
          </button>
        </div>
      )}
    </motion.li>
  );
}
