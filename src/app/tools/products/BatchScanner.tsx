"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Images, Loader2, Check, ScanLine, AlertTriangle, Layers, Trash2,
} from "lucide-react";
import { computeUnitPricing, formatUnitPrice } from "@/lib/products/units";
import { PRODUCT_CATEGORIES, type ProductOverview, type ScannedProduct } from "@/lib/products/types";
import { fileToScaledJpeg } from "./image";

const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors";
const lowCls = "border-amber-400/50 bg-amber-400/[0.06]";

// How many images to scan concurrently. Keeps within the route's rate budget
// while staying fast for a stack of photos.
const CONCURRENCY = 3;

type ItemStatus = "pending" | "scanning" | "scanned" | "error" | "saving" | "saved" | "failed";

type BatchItem = {
  id: string;
  previewUrl: string;
  base64: string;
  mediaType: "image/jpeg";
  status: ItemStatus;
  error?: string;
  // editable
  name: string;
  price: string;
  category: string;
  // scan context
  scan: ScannedProduct | null;
  imagePath: string | null;
  confidence: number | null;
  sourceType: string;
  lowConf: string[];
  match: { id: string; name: string; reason: string } | null;
  include: boolean;
  saveAsNew: boolean;
};

function s(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}
function toNum(v: string): number | null {
  const n = Number(v.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) && v.trim() !== "" ? n : null;
}

type Step = "select" | "scanning" | "review";

export default function BatchScanner({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: (product: ProductOverview) => void;
}) {
  const [step, setStep] = useState<Step>("select");
  const [items, setItems] = useState<BatchItem[]>([]);
  const [prepErr, setPrepErr] = useState("");
  const [scanDone, setScanDone] = useState(0);
  const [busy, setBusy] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const patch = (id: string, p: Partial<BatchItem>) =>
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));

  async function onPick(files: FileList | null) {
    if (!files || !files.length) return;
    setPrepErr("");
    const prepared: BatchItem[] = [];
    for (const file of Array.from(files)) {
      try {
        const scaled = await fileToScaledJpeg(file);
        prepared.push({
          id: globalThis.crypto.randomUUID(),
          previewUrl: scaled.previewUrl,
          base64: scaled.base64,
          mediaType: scaled.mediaType,
          status: "pending",
          name: "", price: "", category: "",
          scan: null, imagePath: null, confidence: null, sourceType: "manual",
          lowConf: [], match: null, include: true, saveAsNew: false,
        });
      } catch (e) {
        setPrepErr(e instanceof Error ? e.message : "One image couldn't be read.");
      }
    }
    setItems((prev) => [...prev, ...prepared]);
  }

  // Scan every pending image with bounded concurrency.
  async function scanAll() {
    if (!items.length || busy) return;
    setStep("scanning");
    setScanDone(0);
    const queue = [...items];
    let cursor = 0;
    let completed = 0;

    async function worker() {
      while (cursor < queue.length) {
        const item = queue[cursor++];
        patch(item.id, { status: "scanning" });
        try {
          const res = await fetch("/api/products/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: item.base64, mediaType: item.mediaType }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Scan failed.");
          const sc = json.scan as ScannedProduct | null;
          patch(item.id, {
            status: "scanned",
            name: s(sc?.name),
            price: s(sc?.totalPrice),
            category: s(sc?.category),
            scan: sc,
            imagePath: json.imagePath ?? null,
            confidence: sc?.confidence ?? null,
            sourceType: sc?.sourceType ?? "manual",
            lowConf: Array.isArray(sc?.lowConfidenceFields) ? sc!.lowConfidenceFields : [],
            match: json.match ?? null,
            include: !!(sc?.name && sc?.totalPrice != null),
          });
        } catch (e) {
          patch(item.id, {
            status: "error",
            error: e instanceof Error ? e.message : "Scan failed.",
            include: false,
          });
        } finally {
          completed += 1;
          setScanDone(completed);
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
    setStep("review");
  }

  function buildPrice(it: BatchItem) {
    const sc = it.scan;
    const pricing = computeUnitPricing({
      totalPrice: toNum(it.price),
      totalWeight: sc?.totalWeight ?? null,
      weightUnit: sc?.weightUnit ?? null,
      packageCount: sc?.packageCount ?? null,
      pricePerLb: sc?.pricePerLb ?? null,
      pricePerOz: sc?.pricePerOz ?? null,
      pricePerItem: sc?.pricePerItem ?? null,
    });
    return {
      pricing,
      price: {
        totalPrice: toNum(it.price) ?? 0,
        currency: "USD",
        unitPrice: pricing.unitPrice,
        unitType: pricing.unitType,
        pricePerLb: pricing.pricePerLb,
        pricePerOz: pricing.pricePerOz,
        pricePerItem: pricing.pricePerItem,
        packageCount: sc?.packageCount ?? null,
        packageSize: sc?.packageSize ?? null,
        packageUnit: sc?.packageUnit ?? null,
        storeName: sc?.storeName ?? null,
        storeLocation: sc?.storeLocation ?? null,
        sourceType: it.sourceType,
        sourceImagePath: it.imagePath,
        recognitionConfidence: it.confidence,
      },
    };
  }

  async function saveItem(it: BatchItem): Promise<boolean> {
    const sc = it.scan;
    if (!it.name.trim() || toNum(it.price) == null) return false;
    const { pricing, price } = buildPrice(it);
    try {
      let product: ProductOverview;
      if (it.match && !it.saveAsNew) {
        const json = await postJson(`/api/products/${it.match.id}/prices`, price);
        product = json.product as ProductOverview;
      } else {
        const json = await postJson("/api/products", {
          name: it.name.trim(),
          brand: sc?.brand ?? null,
          variant: sc?.variant ?? null,
          category: it.category.trim() || sc?.category || null,
          barcode: sc?.barcode ?? null,
          costcoItemNumber: sc?.costcoItemNumber ?? null,
          packageCount: sc?.packageCount ?? null,
          packageSize: sc?.packageSize ?? null,
          packageUnit: sc?.packageUnit ?? null,
          totalWeight: sc?.totalWeight ?? null,
          weightUnit: sc?.weightUnit ?? null,
          standardUnit: pricing.standardUnit,
          notes: sc?.notes ?? null,
          imagePath: it.imagePath,
          price,
        });
        product = json.product as ProductOverview;
      }
      onSaved?.(product);
      return true;
    } catch {
      return false;
    }
  }

  async function saveAll() {
    if (busy) return;
    setBusy(true);
    const toSave = items.filter((it) => it.include && it.status !== "saved" && it.name.trim() && toNum(it.price) != null);
    let ok = 0;
    for (const it of toSave) {
      patch(it.id, { status: "saving" });
      const success = await saveItem(it);
      patch(it.id, { status: success ? "saved" : "failed" });
      if (success) ok += 1;
    }
    setSavedCount(ok);
    setBusy(false);
  }

  const scannable = items.length;
  const includedCount = items.filter((it) => it.include && it.status !== "saved").length;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
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
          className="relative z-10 w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto glass rounded-t-3xl sm:rounded-2xl border border-white/10 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-emerald-400" />
              <h2 className="text-base font-semibold text-white">Batch scan products</h2>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-readable-faint hover:text-white hover:bg-white/10 transition-colors">
              <X size={16} />
            </button>
          </div>

          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />

          {step === "select" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-readable-soft">
                Upload several photos at once — product packages or Costco shelf labels. Each is read
                automatically; you confirm the batch before anything is saved.
              </p>

              <button
                onClick={() => uploadRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 text-white px-4 py-3 text-sm font-medium hover:bg-white/[0.08] transition-colors"
              >
                <Images size={16} /> {items.length ? "Add more photos" : "Choose photos"}
              </button>

              {items.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {items.map((it) => (
                    <div key={it.id} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.previewUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                        aria-label="Remove"
                        className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {prepErr && <p className="text-xs text-amber-300/90">{prepErr}</p>}

              {items.length > 0 && (
                <button
                  onClick={scanAll}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-3 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                >
                  <ScanLine size={16} /> Scan {items.length} photo{items.length === 1 ? "" : "s"}
                </button>
              )}
            </div>
          )}

          {step === "scanning" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <Loader2 size={28} className="animate-spin text-emerald-400" />
              <p className="text-sm text-readable-soft">
                Reading photos… {scanDone} / {scannable}
              </p>
              <div className="w-full max-w-xs h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-[width] duration-300"
                  style={{ width: `${scannable ? (scanDone / scannable) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-readable-faint">
                  {includedCount} of {items.length} selected to save
                  {savedCount != null && ` · ${savedCount} saved`}
                </p>
              </div>

              <ul className="flex flex-col gap-2">
                {items.map((it) => (
                  <BatchRow key={it.id} item={it} patch={(p) => patch(it.id, p)} />
                ))}
              </ul>

              <div className="flex gap-2 pt-1 sticky bottom-0 bg-transparent">
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 text-readable-soft px-4 py-2.5 text-sm hover:bg-white/[0.06] transition-colors"
                >
                  {savedCount != null ? "Done" : "Cancel"}
                </button>
                <button
                  onClick={saveAll}
                  disabled={busy || includedCount === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {busy ? "Saving…" : `Save ${includedCount} product${includedCount === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function BatchRow({ item: it, patch }: { item: BatchItem; patch: (p: Partial<BatchItem>) => void }) {
  const low = (k: string) => it.lowConf.includes(k);
  const sc = it.scan;
  const pricing = computeUnitPricing({
    totalPrice: toNum(it.price),
    totalWeight: sc?.totalWeight ?? null,
    weightUnit: sc?.weightUnit ?? null,
    packageCount: sc?.packageCount ?? null,
    pricePerLb: sc?.pricePerLb ?? null,
    pricePerOz: sc?.pricePerOz ?? null,
    pricePerItem: sc?.pricePerItem ?? null,
  });
  const unit = formatUnitPrice(pricing.unitPrice, pricing.unitType);
  const meta = [sc?.brand, sc?.costcoItemNumber ? `#${sc.costcoItemNumber}` : null].filter(Boolean).join(" · ");

  const errored = it.status === "error";
  const saved = it.status === "saved";
  const failed = it.status === "failed";

  return (
    <li
      className={`rounded-xl border p-2.5 flex gap-3 ${
        saved ? "border-emerald-500/30 bg-emerald-500/[0.05]" : errored ? "border-amber-400/25 bg-amber-400/[0.04]" : "border-white/8 bg-white/[0.02]"
      } ${!it.include && !saved ? "opacity-55" : ""}`}
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={it.previewUrl} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        {errored ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-300/90 py-1">
            <AlertTriangle size={13} /> Couldn&apos;t read this photo — it&apos;ll be skipped.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <input
                value={it.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="Product name"
                disabled={saved}
                className={`${inputCls} flex-1 ${low("name") ? lowCls : ""}`}
              />
              {saved ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-300 shrink-0"><Check size={13} /> Saved</span>
              ) : (
                <input
                  type="checkbox"
                  checked={it.include}
                  onChange={(e) => patch({ include: e.target.checked })}
                  aria-label="Include this product"
                  className="accent-emerald-400 w-4 h-4 shrink-0"
                />
              )}
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[11px] text-readable-faint">$</span>
              <input
                value={it.price}
                onChange={(e) => patch({ price: e.target.value })}
                placeholder="0.00"
                inputMode="decimal"
                disabled={saved}
                className={`${inputCls} w-20 ${low("totalPrice") ? lowCls : ""}`}
              />
              <input
                list="batch-cats"
                value={it.category}
                onChange={(e) => patch({ category: e.target.value })}
                placeholder="Category"
                disabled={saved}
                className={`${inputCls} w-28 ${low("category") ? lowCls : ""}`}
              />
              <datalist id="batch-cats">
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {unit && <span className="text-[11px] text-emerald-300">{unit}</span>}
              {meta && <span className="text-[11px] text-readable-faint truncate">{meta}</span>}
              {failed && <span className="text-[11px] text-red-300">Save failed</span>}
            </div>

            {it.match && !saved && (
              <label className="flex items-center gap-1.5 mt-1.5 text-[11px] text-cyan-100/80 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!it.saveAsNew}
                  onChange={(e) => patch({ saveAsNew: !e.target.checked })}
                  className="accent-cyan-400"
                />
                Add as a new price to “{it.match.name}” (matched by {it.match.reason})
              </label>
            )}
            {it.lowConf.length > 0 && !saved && (
              <p className="text-[10px] text-amber-300/70 mt-1">Amber fields were low-confidence — double-check them.</p>
            )}
          </>
        )}
      </div>
    </li>
  );
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Request failed.");
  return json;
}
