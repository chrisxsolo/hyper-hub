"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, LogOut, Package, Star, ListPlus, Check, Loader2, UtensilsCrossed,
  Tag, Apple, ScanLine, History, BarChart3, Images, ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatUnitPrice } from "@/lib/products/units";
import { computeValueMetrics } from "@/lib/products/analytics";
import { todayInTz } from "@/lib/nutrition/db";
import type {
  NutritionVersionEntry, PriceHistoryEntry, ProductImageEntry, ProductOverview,
} from "@/lib/products/types";
import ProductScanner from "../ProductScanner";
import NutritionScanner from "../NutritionScanner";
import ServingEntrySheet from "../ServingEntrySheet";

function fmtMoney(n: number | null | undefined): string {
  return n == null ? "—" : `$${Number(n).toFixed(2)}`;
}
function sizeSummary(p: ProductOverview): string | null {
  if (p.total_weight != null) return `${p.total_weight} ${p.weight_unit ?? "lb"}`;
  if (p.package_count != null) return `${p.package_count} ct`;
  if (p.package_size != null) return `${p.package_size} ${p.package_unit ?? ""}`.trim();
  return null;
}

export default function ProductDetailClient({
  email,
  product: initialProduct,
  history: initialHistory,
  images: initialImages,
  nutritionVersions: initialVersions,
}: {
  email: string | null;
  product: ProductOverview;
  history: PriceHistoryEntry[];
  images: ProductImageEntry[];
  nutritionVersions: NutritionVersionEntry[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [product, setProduct] = useState(initialProduct);
  const [history, setHistory] = useState(initialHistory);
  const [images, setImages] = useState(initialImages);
  const [versions, setVersions] = useState(initialVersions);

  const [priceOpen, setPriceOpen] = useState(false);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [servingOpen, setServingOpen] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState("");

  const current = versions.find((v) => v.is_current) ?? null;
  const metrics = useMemo(
    () =>
      computeValueMetrics({
        totalPrice: product.last_total_price,
        totalWeight: product.total_weight,
        weightUnit: product.weight_unit,
        packageCount: product.package_count,
        calories: current?.calories ?? null,
        proteinG: current?.protein_g ?? null,
        servingSizeValue: current?.serving_size_value ?? null,
        servingSizeUnit: current?.serving_size_unit ?? null,
        servingsPerContainer: current?.servings_per_container ?? null,
      }),
    [product, current],
  );

  async function signOut() { await supabase.auth.signOut(); router.refresh(); }

  async function refetch() {
    try {
      const res = await fetch(`/api/products/${product.id}`);
      const json = await res.json();
      if (!res.ok) return;
      setProduct(json.product as ProductOverview);
      setHistory((json.history as PriceHistoryEntry[]) ?? []);
      setImages((json.images as ProductImageEntry[]) ?? []);
      setVersions((json.nutritionVersions as NutritionVersionEntry[]) ?? []);
    } catch { /* ignore */ }
  }

  async function toggleFav() {
    const next = !product.is_favorite;
    setProduct((p) => ({ ...p, is_favorite: next }));
    try {
      await fetch(`/api/products/${product.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      });
    } catch { setProduct((p) => ({ ...p, is_favorite: !next })); }
  }

  async function addToGrocery() {
    if (adding || added) return;
    setAdding(true);
    try {
      const res = await fetch("/api/grocery", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: product.name, category: product.category ?? null, product_id: product.id }),
      });
      if (!res.ok) throw new Error();
      setAdded(true);
    } catch { setErr("Couldn't add to grocery list."); } finally { setAdding(false); }
  }

  async function makeCurrent(versionId: string) {
    const res = await fetch(`/api/products/${product.id}/nutrition/${versionId}`, { method: "PATCH" });
    if (res.ok) await refetch();
  }

  const size = sizeSummary(product);
  const unit = formatUnitPrice(product.last_unit_price, product.last_unit_type);
  const today = todayInTz("America/Los_Angeles");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex items-center justify-between mb-8">
        <Link href="/tools/products" className="inline-flex items-center gap-1.5 text-sm text-readable-soft hover:text-readable-strong transition-colors">
          <ArrowLeft size={14} /> Back to Products
        </Link>
        {email && (
          <button onClick={signOut} className="inline-flex items-center gap-1.5 text-xs text-readable-faint hover:text-readable-strong transition-colors">
            <LogOut size={13} /> Sign out
          </button>
        )}
      </motion.div>

      {err && <p className="text-xs text-red-300/90 mb-3">{err}</p>}

      {/* Hero */}
      <div className="glass rounded-2xl border border-white/10 p-5 mb-5">
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-xl bg-white/[0.04] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : <Package size={28} className="text-readable-faint" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-bold text-white leading-tight">{product.name}</h1>
              <button onClick={toggleFav} aria-label="Toggle favorite" className="p-1 shrink-0">
                <Star size={18} className={product.is_favorite ? "fill-amber-300 text-amber-300" : "text-readable-faint hover:text-amber-300"} />
              </button>
            </div>
            <p className="text-sm text-readable-soft mt-0.5">{[product.brand, product.variant].filter(Boolean).join(" · ") || "—"}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {product.last_total_price != null && <span className="text-base font-semibold text-emerald-300">{fmtMoney(product.last_total_price)}</span>}
              {unit && <span className="text-xs text-readable-soft">{unit}</span>}
              {size && <Chip>{size}</Chip>}
              {product.category && <Chip>{product.category}</Chip>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-readable-faint">
              {product.costco_item_number && <span>Item #{product.costco_item_number}</span>}
              {product.barcode && <span>UPC {product.barcode}</span>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <ActionBtn onClick={addToGrocery} disabled={adding || added} icon={added ? Check : adding ? Loader2 : ListPlus} spin={adding} label={added ? "Added" : "Add to list"} />
          <ActionBtn onClick={() => setServingOpen(true)} disabled={!current} icon={UtensilsCrossed} label="Log in tracker" title={current ? undefined : "Add nutrition facts first"} />
          <ActionBtn onClick={() => setPriceOpen(true)} icon={Tag} label="Upload price" />
          <ActionBtn onClick={() => setNutritionOpen(true)} icon={Apple} label={current ? "Update nutrition" : "Add nutrition"} />
        </div>
      </div>

      {/* Nutrition Facts */}
      <Section icon={Apple} title="Nutrition Facts">
        {current ? (
          <>
            <NutritionFacts v={current} />
            {versions.length > 1 && (
              <div className="mt-3">
                <button onClick={() => setShowVersions((s) => !s)} className="inline-flex items-center gap-1.5 text-xs text-readable-soft hover:text-white transition-colors">
                  <History size={13} /> {versions.length} versions <ChevronDown size={12} className={`transition-transform ${showVersions ? "rotate-180" : ""}`} />
                </button>
                {showVersions && (
                  <ul className="mt-2 space-y-1.5">
                    {versions.map((v) => (
                      <li key={v.id} className="flex items-center justify-between text-xs rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                        <span className="text-readable-soft">
                          {new Date(v.observed_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                          {" · "}{v.calories ?? "—"} cal · {v.protein_g ?? "—"} g protein
                          {v.is_current && <span className="ml-2 text-emerald-300">current</span>}
                        </span>
                        {!v.is_current && (
                          <button onClick={() => makeCurrent(v.id)} className="text-emerald-300 hover:underline">Make current</button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-readable-soft mb-3">No nutrition facts yet.</p>
            <button onClick={() => setNutritionOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-2 text-sm font-medium hover:bg-emerald-500/25 transition-colors">
              <ScanLine size={15} /> Scan Nutrition Facts
            </button>
          </div>
        )}
      </Section>

      {/* Value Analytics */}
      <Section icon={BarChart3} title="Value Analytics">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Metric label="Servings / package" value={metrics.servingsPerPackage} />
          <Metric label="Cost / serving" value={metrics.costPerServing} money />
          <Metric label="Cost / item" value={metrics.costPerItem} money />
          <Metric label="Calories / $" value={metrics.caloriesPerDollar} />
          <Metric label="Protein / $" value={metrics.proteinPerDollar} suffix=" g" />
          <Metric label="Protein / 100 cal" value={metrics.proteinPer100Cal} suffix=" g" />
          <Metric label="Cost / g protein" value={metrics.costPerGramProtein} money />
          <Metric label="Package calories" value={metrics.packageCalories} />
          <Metric label="Package protein" value={metrics.packageProtein} suffix=" g" />
        </div>
        <p className="text-[10px] text-readable-faint mt-2">Computed only when price and nutrition inputs are available — never estimated.</p>
      </Section>

      {/* Price History */}
      <Section icon={History} title={`Price History (${history.length})`}>
        {history.length === 0 ? (
          <p className="text-sm text-readable-faint">No price history yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between text-xs">
                <span className="text-readable-faint">
                  {new Date(h.observed_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  {h.store_name ? ` · ${h.store_name}` : ""}
                </span>
                <span className="text-readable-soft">
                  {fmtMoney(h.total_price)}
                  {h.unit_price != null && h.unit_type ? ` · ${formatUnitPrice(Number(h.unit_price), h.unit_type)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Photos & Scans */}
      {images.length > 0 && (
        <Section icon={Images} title="Photos & Scans">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map((img) => (
              <div key={img.id} className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/30 relative">
                {img.signedUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.signedUrl} alt={img.image_type} className="w-full h-full object-cover" />
                )}
                <span className="absolute bottom-0 inset-x-0 text-[9px] text-white/80 bg-black/50 px-1 py-0.5 truncate">{img.image_type.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {priceOpen && (
        <ProductScanner
          forProduct={{ id: product.id, name: product.name }}
          title="Upload price"
          onClose={() => setPriceOpen(false)}
          onSaved={() => { setPriceOpen(false); refetch(); }}
        />
      )}
      {nutritionOpen && (
        <NutritionScanner
          productId={product.id}
          productName={product.name}
          onClose={() => setNutritionOpen(false)}
          onSaved={() => { setNutritionOpen(false); refetch(); }}
        />
      )}
      {servingOpen && current && (
        <ServingEntrySheet
          productId={product.id}
          productName={product.name}
          brand={product.brand}
          nutrition={current}
          versionId={current.id}
          defaultDate={today}
          onClose={() => setServingOpen(false)}
        />
      )}
    </div>
  );
}

function NutritionFacts({ v }: { v: NutritionVersionEntry }) {
  const rows: { label: string; value: number | null; unit: string }[] = [
    { label: "Total fat", value: v.total_fat_g, unit: "g" },
    { label: "Saturated fat", value: v.saturated_fat_g, unit: "g" },
    { label: "Trans fat", value: v.trans_fat_g, unit: "g" },
    { label: "Cholesterol", value: v.cholesterol_mg, unit: "mg" },
    { label: "Sodium", value: v.sodium_mg, unit: "mg" },
    { label: "Total carbohydrate", value: v.total_carbohydrate_g, unit: "g" },
    { label: "Dietary fiber", value: v.dietary_fiber_g, unit: "g" },
    { label: "Total sugars", value: v.total_sugars_g, unit: "g" },
    { label: "Added sugars", value: v.added_sugars_g, unit: "g" },
    { label: "Vitamin D", value: v.vitamin_d_mcg, unit: "mcg" },
    { label: "Calcium", value: v.calcium_mg, unit: "mg" },
    { label: "Iron", value: v.iron_mg, unit: "mg" },
    { label: "Potassium", value: v.potassium_mg, unit: "mg" },
  ].filter((r) => r.value != null);

  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-white/15 pb-2 mb-2">
        <div>
          <p className="text-xs text-readable-faint">Serving size</p>
          <p className="text-sm font-medium text-white">{v.serving_size_description ?? "—"}</p>
        </div>
        {v.servings_per_container != null && (
          <p className="text-xs text-readable-faint">{v.servings_per_container} servings / container</p>
        )}
      </div>
      <div className="flex items-center gap-6 mb-2">
        <div><span className="text-2xl font-bold text-white">{v.calories ?? "—"}</span> <span className="text-xs text-readable-faint">cal</span></div>
        <div><span className="text-2xl font-bold text-emerald-300">{v.protein_g ?? "—"}</span> <span className="text-xs text-readable-faint">g protein</span></div>
      </div>
      <ul className="divide-y divide-white/[0.06]">
        {rows.map((r) => (
          <li key={r.label} className="flex justify-between py-1 text-sm">
            <span className="text-readable-soft">{r.label}</span>
            <span className="text-white">{r.value}{r.unit}</span>
          </li>
        ))}
        {(v.additional_nutrients ?? []).map((a, i) => (
          <li key={`a-${i}`} className="flex justify-between py-1 text-sm">
            <span className="text-readable-soft">{a.name}</span>
            <span className="text-white">{a.value != null ? `${a.value}${a.unit ?? ""}` : "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl border border-white/8 p-5 mb-5">
      <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Icon size={15} className="text-emerald-400" /> {title}
      </h2>
      {children}
    </div>
  );
}

function Metric({ label, value, money = false, suffix = "" }: { label: string; value: number | null; money?: boolean; suffix?: string }) {
  const text = value == null ? "—" : money ? `$${value.toFixed(2)}` : `${value.toLocaleString()}${suffix}`;
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-wide text-readable-faint mb-1">{label}</div>
      <div className={`text-lg font-bold ${value == null ? "text-readable-faint" : "text-white"}`}>{value == null ? "unavailable" : text}</div>
    </div>
  );
}

function ActionBtn({
  onClick, disabled, icon: Icon, label, spin = false, title,
}: {
  onClick: () => void; disabled?: boolean; icon: React.ElementType; label: string; spin?: boolean; title?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-readable-soft px-3 py-2.5 text-xs font-medium hover:bg-white/[0.08] hover:text-white transition-colors disabled:opacity-50">
      <Icon size={14} className={spin ? "animate-spin" : ""} /> {label}
    </button>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/10 text-readable-faint">{children}</span>;
}
