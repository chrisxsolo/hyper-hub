"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Images, Camera, Loader2, Check, ScanLine, Trash2, Layers, Apple, AlertTriangle,
} from "lucide-react";
import { computeUnitPricing, formatUnitPrice } from "@/lib/products/units";
import {
  PRODUCT_CATEGORIES,
  type ProductOverview,
  type ScannedNutrition,
  type ScannedProduct,
  type UnitPricing,
  type ProductImageType,
} from "@/lib/products/types";
import type { NutritionVersionSave } from "@/lib/products/nutrition-schemas";
import { fileToScaledJpeg } from "./image";
import NutritionReview from "./NutritionReview";

const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors w-full";

const CONCURRENCY = 3;

type ComboResult = {
  imageKind: string;
  imagePath: string | null;
  imageUrl: string | null;
  product: { scan: ScannedProduct; pricing: UnitPricing; match: { id: string; name: string; reason: string } | null } | null;
  nutrition: ScannedNutrition | null;
  warning: string | null;
};

type Item = {
  id: string;
  previewUrl: string;
  base64: string;
  mediaType: "image/jpeg";
  status: "pending" | "scanning" | "scanned" | "error";
  result: ComboResult | null;
};

type Step = "select" | "scanning" | "review";

const KIND_TO_IMAGE_TYPE: Record<string, ProductImageType> = {
  nutrition_facts: "nutrition_label",
  product_front: "product_front",
  price_label: "price_label",
  barcode: "barcode",
  receipt: "receipt",
  other: "other",
};
const KIND_LABEL: Record<string, string> = {
  nutrition_facts: "Nutrition",
  product_front: "Product",
  price_label: "Price",
  barcode: "Barcode",
  receipt: "Receipt",
  other: "Other",
};

function s(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}
function toNum(v: string): number | null {
  const n = Number(v.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) && v.trim() !== "" ? n : null;
}
function firstNonNull<T>(vals: (T | null | undefined)[]): T | null {
  for (const v of vals) if (v !== null && v !== undefined && v !== "") return v;
  return null;
}

type Form = {
  name: string; brand: string; variant: string; category: string; price: string;
  totalWeight: string; weightUnit: string; packageCount: string; packageSize: string;
  packageUnit: string; barcode: string; costcoItemNumber: string; storeName: string; notes: string;
};
const EMPTY_FORM: Form = {
  name: "", brand: "", variant: "", category: "", price: "",
  totalWeight: "", weightUnit: "lb", packageCount: "", packageSize: "",
  packageUnit: "", barcode: "", costcoItemNumber: "", storeName: "Costco", notes: "",
};

// Upload several photos of ONE product (front, price tag, nutrition label, …) at
// once; each is classified + extracted, then merged into a single product with a
// price and a confirmed nutrition version.
export default function MultiPhotoScanner({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: (product: ProductOverview) => void;
}) {
  const [step, setStep] = useState<Step>("select");
  const [items, setItems] = useState<Item[]>([]);
  const [scanDone, setScanDone] = useState(0);
  const [prepErr, setPrepErr] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [priceSourceType, setPriceSourceType] = useState("manual");
  const [lowConf, setLowConf] = useState<Set<string>>(new Set());
  const [match, setMatch] = useState<{ id: string; name: string; reason: string } | null>(null);
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [nutritionInitial, setNutritionInitial] = useState<ScannedNutrition | null>(null);
  const [nutritionPayload, setNutritionPayload] = useState<NutritionVersionSave | null>(null);

  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onPick(files: FileList | null) {
    if (!files || !files.length) return;
    setPrepErr("");
    const prepared: Item[] = [];
    for (const file of Array.from(files)) {
      try {
        const scaled = await fileToScaledJpeg(file);
        prepared.push({
          id: globalThis.crypto.randomUUID(),
          previewUrl: scaled.previewUrl,
          base64: scaled.base64,
          mediaType: scaled.mediaType,
          status: "pending",
          result: null,
        });
      } catch (e) {
        setPrepErr(e instanceof Error ? e.message : "One image couldn't be read.");
      }
    }
    setItems((prev) => [...prev, ...prepared]);
  }

  function set<K extends keyof Form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Scan every photo (bounded concurrency), then merge results into one product.
  async function scanAll() {
    if (!items.length || busy) return;
    setStep("scanning");
    setScanDone(0);
    const queue = items.map((it, idx) => ({ it, idx }));
    const collected: (ComboResult | null)[] = new Array(items.length).fill(null);
    let cursor = 0;
    let completed = 0;
    const patch = (id: string, p: Partial<Item>) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));

    async function worker() {
      while (cursor < queue.length) {
        const { it, idx } = queue[cursor++];
        patch(it.id, { status: "scanning" });
        let result: ComboResult;
        try {
          const res = await fetch("/api/products/scan-combo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: it.base64, mediaType: it.mediaType }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Scan failed.");
          result = json as ComboResult;
          patch(it.id, { status: "scanned", result });
        } catch (e) {
          result = { imageKind: "other", imagePath: null, imageUrl: null, product: null, nutrition: null, warning: e instanceof Error ? e.message : "Scan failed." };
          patch(it.id, { status: "error", result });
        } finally {
          collected[idx] = result!;
          completed += 1;
          setScanDone(completed);
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));

    mergeResults(collected.filter((r): r is ComboResult => !!r));
    setStep("review");
  }

  function mergeResults(results: ComboResult[]) {
    const productScans = results.filter((r) => r.product).map((r) => r.product!.scan);
    const nutritionRes = results.find((r) => r.nutrition);
    const priceRes = results.find((r) => r.product && r.product.scan.totalPrice != null) ?? results.find((r) => r.product);

    setForm({
      name: s(firstNonNull(productScans.map((p) => p.name))),
      brand: s(firstNonNull(productScans.map((p) => p.brand))),
      variant: s(firstNonNull(productScans.map((p) => p.variant))),
      category: s(firstNonNull(productScans.map((p) => p.category))),
      price: s(firstNonNull(productScans.map((p) => p.totalPrice))),
      totalWeight: s(firstNonNull(productScans.map((p) => p.totalWeight))),
      weightUnit: s(firstNonNull(productScans.map((p) => p.weightUnit))) || "lb",
      packageCount: s(firstNonNull(productScans.map((p) => p.packageCount))),
      packageSize: s(firstNonNull(productScans.map((p) => p.packageSize))),
      packageUnit: s(firstNonNull(productScans.map((p) => p.packageUnit))),
      barcode: s(firstNonNull(productScans.map((p) => p.barcode))),
      costcoItemNumber: s(firstNonNull(productScans.map((p) => p.costcoItemNumber))),
      storeName: s(firstNonNull(productScans.map((p) => p.storeName))) || "Costco",
      notes: s(firstNonNull(productScans.map((p) => p.notes))),
    });
    setPriceSourceType(priceRes?.product?.scan.sourceType ?? "manual");
    setLowConf(new Set(productScans.flatMap((p) => p.lowConfidenceFields ?? [])));
    setMatch(results.find((r) => r.product?.match)?.product?.match ?? null);
    setNutritionInitial(nutritionRes?.nutrition ?? null);
  }

  const pricing = computeUnitPricing({
    totalPrice: toNum(form.price),
    totalWeight: toNum(form.totalWeight),
    weightUnit: form.weightUnit || null,
    packageCount: toNum(form.packageCount),
  });

  // Image paths by purpose (for the gallery + price/nutrition source images).
  function imagePaths() {
    const results = items.map((i) => i.result).filter((r): r is ComboResult => !!r);
    const front = results.find((r) => r.imageKind === "product_front")?.imagePath ?? null;
    const price = results.find((r) => r.imageKind === "price_label" && r.imagePath)?.imagePath ?? null;
    const nutrition = results.find((r) => r.imageKind === "nutrition_facts")?.imagePath ?? null;
    const primary = front ?? results.find((r) => r.imagePath)?.imagePath ?? null;
    return { results, front, price, nutrition, primary };
  }

  async function save() {
    if (busy) return;
    if (!form.name.trim()) { setErr("Give the product a name before saving."); return; }
    const price = toNum(form.price);
    if (price == null) { setErr("Enter the price before saving."); return; }
    setBusy(true);
    setErr("");

    const { results, price: priceImg, nutrition: nutritionImg, primary } = imagePaths();
    const pricePayload = {
      totalPrice: price,
      currency: "USD",
      unitPrice: pricing.unitPrice,
      unitType: pricing.unitType,
      pricePerLb: pricing.pricePerLb,
      pricePerOz: pricing.pricePerOz,
      pricePerItem: pricing.pricePerItem,
      packageCount: toNum(form.packageCount),
      packageSize: toNum(form.packageSize),
      packageUnit: form.packageUnit.trim() || null,
      storeName: form.storeName.trim() || null,
      sourceType: priceSourceType,
      sourceImagePath: priceImg ?? primary,
    };

    try {
      let product: ProductOverview;
      let productId: string;
      if (match && !saveAsNew) {
        const json = await postJson(`/api/products/${match.id}/prices`, pricePayload);
        product = json.product as ProductOverview;
        productId = match.id;
      } else {
        const json = await postJson("/api/products", {
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          variant: form.variant.trim() || null,
          category: form.category.trim() || null,
          barcode: form.barcode.trim() || null,
          costcoItemNumber: form.costcoItemNumber.trim() || null,
          packageCount: toNum(form.packageCount),
          packageSize: toNum(form.packageSize),
          packageUnit: form.packageUnit.trim() || null,
          totalWeight: toNum(form.totalWeight),
          weightUnit: form.weightUnit.trim() || null,
          standardUnit: pricing.standardUnit,
          notes: form.notes.trim() || null,
          imagePath: primary,
          price: pricePayload,
        });
        product = json.product as ProductOverview;
        productId = product.id;
      }

      // Save the confirmed nutrition version (if any photo had one).
      if (nutritionPayload && (nutritionPayload.calories != null || nutritionPayload.proteinG != null)) {
        const njson = await postJson(`/api/products/${productId}/nutrition`, {
          ...nutritionPayload,
          sourceImagePath: nutritionImg,
          recognitionConfidence: nutritionInitial ? { overall: nutritionInitial.confidence } : null,
        });
        if (njson.product) product = njson.product as ProductOverview;
      }

      // Attach the remaining photos to the gallery (front recorded by create,
      // nutrition by the nutrition save) without re-uploading.
      const attachable = results.filter(
        (r) => r.imagePath && r.imageKind !== "nutrition_facts" && r.imagePath !== primary,
      );
      await Promise.allSettled(
        attachable.map((r) =>
          postJson(`/api/products/${productId}/images`, {
            imagePath: r.imagePath,
            imageType: KIND_TO_IMAGE_TYPE[r.imageKind] ?? "other",
          }),
        ),
      );

      onSaved?.(product);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save.");
      setBusy(false);
    }
  }

  const low = (k: string) => lowConf.has(k);
  const lowCls = "border-amber-400/50 bg-amber-400/[0.06]";
  const anyWarning = items.some((i) => i.result?.warning);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="relative z-10 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto glass rounded-t-3xl sm:rounded-2xl border border-white/10 p-5"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-emerald-400" />
              <h2 className="text-base font-semibold text-white">
                {step === "review" ? "Review product" : "Scan a product"}
              </h2>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-readable-faint hover:text-white hover:bg-white/10 transition-colors">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-readable-faint mb-4">
            {step === "review" ? "Combined from your photos — confirm before saving." : "Add the front, price tag and nutrition label together."}
          </p>

          <input ref={uploadRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPick(e.target.files)} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPick(e.target.files)} />

          {step === "select" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => uploadRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 text-white px-4 py-3 text-sm font-medium hover:bg-white/[0.08] transition-colors">
                  <Images size={16} /> {items.length ? "Add more" : "Choose photos"}
                </button>
                <button onClick={() => cameraRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 text-white px-4 py-3 text-sm font-medium hover:bg-white/[0.08] transition-colors">
                  <Camera size={16} /> Take a photo
                </button>
              </div>

              {items.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {items.map((it) => (
                    <div key={it.id} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.previewUrl} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))} aria-label="Remove" className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {prepErr && <p className="text-xs text-amber-300/90">{prepErr}</p>}

              {items.length > 0 && (
                <button onClick={scanAll} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-3 text-sm font-medium hover:bg-emerald-500/30 transition-colors">
                  <ScanLine size={16} /> Scan {items.length} photo{items.length === 1 ? "" : "s"}
                </button>
              )}
            </div>
          )}

          {step === "scanning" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <Loader2 size={28} className="animate-spin text-emerald-400" />
              <p className="text-sm text-readable-soft">Reading photos… {scanDone} / {items.length}</p>
              <div className="w-full max-w-xs h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-[width] duration-300" style={{ width: `${items.length ? (scanDone / items.length) * 100 : 0}%` }} />
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="flex flex-col gap-3">
              {/* Photo strip with detected kinds */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {items.map((it) => (
                  <div key={it.id} className="relative shrink-0">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.previewUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] px-1 py-0.5 rounded bg-black/70 text-white/90 whitespace-nowrap">
                      {it.result?.warning ? "—" : KIND_LABEL[it.result?.imageKind ?? "other"]}
                    </span>
                  </div>
                ))}
              </div>

              {anyWarning && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/[0.07] px-3 py-2 text-xs text-amber-200/90">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>Some photos couldn&apos;t be read — fill in anything missing below.</span>
                </div>
              )}

              {match && (
                <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/[0.07] px-3 py-2.5 text-xs text-cyan-100/90">
                  <p className="font-medium">You already track “{match.name}”.</p>
                  <label className="mt-1.5 flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={!saveAsNew} onChange={(e) => setSaveAsNew(!e.target.checked)} className="accent-cyan-400" />
                    Add this scan to that product
                  </label>
                </div>
              )}

              <Labeled label="Product name">
                <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Kirkland Boneless Skinless Chicken Breast" />
              </Labeled>
              <div className="grid grid-cols-2 gap-3">
                <Labeled label="Brand"><input className={`${inputCls} ${low("brand") ? lowCls : ""}`} value={form.brand} onChange={(e) => set("brand", e.target.value)} /></Labeled>
                <Labeled label="Variant"><input className={`${inputCls} ${low("variant") ? lowCls : ""}`} value={form.variant} onChange={(e) => set("variant", e.target.value)} /></Labeled>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Labeled label="Price ($)"><input inputMode="decimal" className={`${inputCls} ${low("totalPrice") ? lowCls : ""}`} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="26.42" /></Labeled>
                <Labeled label="Category">
                  <input list="multi-cats" className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)} />
                  <datalist id="multi-cats">{PRODUCT_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
                </Labeled>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Labeled label="Total weight"><input inputMode="decimal" className={`${inputCls} ${low("totalWeight") ? lowCls : ""}`} value={form.totalWeight} onChange={(e) => set("totalWeight", e.target.value)} /></Labeled>
                <Labeled label="Unit">
                  <select className={inputCls} value={form.weightUnit} onChange={(e) => set("weightUnit", e.target.value)}>
                    <option value="">—</option><option value="lb">lb</option><option value="oz">oz</option><option value="g">g</option><option value="kg">kg</option>
                  </select>
                </Labeled>
                <Labeled label="Item count"><input inputMode="numeric" className={inputCls} value={form.packageCount} onChange={(e) => set("packageCount", e.target.value)} /></Labeled>
              </div>
              {(pricing.pricePerLb != null || pricing.pricePerItem != null) && (
                <div className="flex flex-wrap gap-2">
                  {pricing.pricePerLb != null && <Chip>{formatUnitPrice(pricing.pricePerLb, "lb")}</Chip>}
                  {pricing.pricePerItem != null && <Chip>{formatUnitPrice(pricing.pricePerItem, "item")}</Chip>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Labeled label="Barcode / UPC"><input inputMode="numeric" className={`${inputCls} ${low("barcode") ? lowCls : ""}`} value={form.barcode} onChange={(e) => set("barcode", e.target.value)} /></Labeled>
                <Labeled label="Costco item #"><input inputMode="numeric" className={`${inputCls} ${low("costcoItemNumber") ? lowCls : ""}`} value={form.costcoItemNumber} onChange={(e) => set("costcoItemNumber", e.target.value)} /></Labeled>
              </div>

              {/* Nutrition (full review, embedded) */}
              {nutritionInitial && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3 mt-1">
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Apple size={15} className="text-emerald-400" /> Nutrition Facts (from the label photo)
                  </h3>
                  <NutritionReview
                    initial={nutritionInitial}
                    lowConfidenceFields={nutritionInitial.lowConfidenceFields ?? []}
                    embedded
                    onChange={setNutritionPayload}
                  />
                </div>
              )}

              {err && <p className="text-xs text-red-300/90">{err}</p>}

              <div className="flex gap-2 pt-1">
                <button onClick={() => setStep("select")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 text-readable-soft px-4 py-2.5 text-sm hover:bg-white/[0.06] transition-colors">
                  Back
                </button>
                <button onClick={save} disabled={busy} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40">
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {match && !saveAsNew ? "Save to product" : "Save product"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Request failed.");
  return json;
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wide text-readable-faint">{label}</span>
      {children}
    </label>
  );
}
function Chip({ children }: { children: React.ReactNode }) {
  return <span className="text-xs px-2 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">{children}</span>;
}
