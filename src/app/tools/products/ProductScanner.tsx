"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, ImagePlus, Loader2, X, Check, RotateCcw, AlertTriangle, ScanLine,
} from "lucide-react";
import { computeUnitPricing, formatUnitPrice } from "@/lib/products/units";
import { PRODUCT_CATEGORIES, type ProductOverview } from "@/lib/products/types";
import type { DbGroceryItem } from "@/lib/health/grocery";

const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors w-full";
const lowCls = "border-amber-400/50 bg-amber-400/[0.06]";

type Step = "capture" | "review";

type Form = {
  name: string;
  brand: string;
  variant: string;
  category: string;
  totalPrice: string;
  totalWeight: string;
  weightUnit: string;
  packageCount: string;
  packageSize: string;
  packageUnit: string;
  barcode: string;
  costcoItemNumber: string;
  storeName: string;
  storeLocation: string;
  notes: string;
};

const EMPTY: Form = {
  name: "", brand: "", variant: "", category: "", totalPrice: "",
  totalWeight: "", weightUnit: "lb", packageCount: "", packageSize: "", packageUnit: "",
  barcode: "", costcoItemNumber: "", storeName: "Costco", storeLocation: "", notes: "",
};

type ScanResponse = {
  scan: Record<string, unknown> | null;
  pricing: ReturnType<typeof computeUnitPricing>;
  imagePath: string | null;
  imageUrl: string | null;
  match: { id: string; name: string; reason: string } | null;
  warning: string | null;
};

function s(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}
function toNum(v: string): number | null {
  const n = Number(v.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) && v.trim() !== "" ? n : null;
}

// Downscale a captured/selected image to a Claude-friendly JPEG and return base64.
async function fileToScaledJpeg(
  file: File,
  maxDim = 1568,
  quality = 0.82,
): Promise<{ base64: string; mediaType: "image/jpeg"; previewUrl: string }> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = () => rej(new Error("Could not read the image file."));
    fr.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("That image format isn't supported — try a JPEG or PNG."));
    i.src = dataUrl;
  });
  let { width, height } = img;
  const longest = Math.max(width, height);
  if (longest > maxDim) {
    const scale = maxDim / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process images.");
  ctx.drawImage(img, 0, 0, width, height);
  const out = canvas.toDataURL("image/jpeg", quality);
  return { base64: out.split(",")[1] ?? "", mediaType: "image/jpeg", previewUrl: out };
}

// Mounted only while open (parents render it conditionally), so every open
// starts from fresh useState defaults — no reset-on-open effect needed.
export default function ProductScanner({
  onClose,
  onSaved,
  onAddedToGrocery,
  defaultAddToGrocery = false,
}: {
  onClose: () => void;
  onSaved?: (product: ProductOverview) => void;
  onAddedToGrocery?: (item: DbGroceryItem) => void;
  defaultAddToGrocery?: boolean;
}) {
  const [step, setStep] = useState<Step>("capture");
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState<{ base64: string; mediaType: "image/jpeg" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [warning, setWarning] = useState<string | null>(null);

  const [form, setForm] = useState<Form>(EMPTY);
  const [lowConf, setLowConf] = useState<Set<string>>(new Set());
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [sourceType, setSourceType] = useState<string>("manual");
  const [match, setMatch] = useState<{ id: string; name: string; reason: string } | null>(null);
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [addToGrocery, setAddToGrocery] = useState(defaultAddToGrocery);

  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  // Close on Escape. Only subscribes to an external event — no setState here.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setErr("");
    try {
      const scaled = await fileToScaledJpeg(file);
      setPreview(scaled.previewUrl);
      setPending({ base64: scaled.base64, mediaType: scaled.mediaType });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't load that image.");
    }
  }

  async function analyze() {
    if (!pending || busy) return;
    setBusy(true);
    setErr("");
    setWarning(null);
    try {
      const res = await fetch("/api/products/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: pending.base64, mediaType: pending.mediaType }),
      });
      const json: ScanResponse & { error?: string } = await res.json();
      if (!res.ok) throw new Error(json.error || "Scan failed.");

      setImagePath(json.imagePath);
      setMatch(json.match);
      setWarning(json.warning);
      const sc = json.scan;
      if (sc) {
        setForm({
          name: s(sc.name),
          brand: s(sc.brand),
          variant: s(sc.variant),
          category: s(sc.category),
          totalPrice: s(sc.totalPrice),
          totalWeight: s(sc.totalWeight),
          weightUnit: s(sc.weightUnit) || "lb",
          packageCount: s(sc.packageCount),
          packageSize: s(sc.packageSize),
          packageUnit: s(sc.packageUnit),
          barcode: s(sc.barcode),
          costcoItemNumber: s(sc.costcoItemNumber),
          storeName: s(sc.storeName) || "Costco",
          storeLocation: s(sc.storeLocation),
          notes: s(sc.notes),
        });
        setLowConf(new Set(Array.isArray(sc.lowConfidenceFields) ? (sc.lowConfidenceFields as string[]) : []));
        setConfidence(typeof sc.confidence === "number" ? sc.confidence : null);
        setSourceType(typeof sc.sourceType === "string" ? sc.sourceType : "manual");
      } else {
        setForm({ ...EMPTY });
      }
      setStep("review");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setBusy(false);
    }
  }

  // Live unit-pricing preview from the current form values.
  const pricing = computeUnitPricing({
    totalPrice: toNum(form.totalPrice),
    totalWeight: toNum(form.totalWeight),
    weightUnit: form.weightUnit || null,
    packageCount: toNum(form.packageCount),
  });

  function set<K extends keyof Form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  const low = (k: string) => lowConf.has(k);
  // (onSaved closes the modal, which unmounts and discards this state.)

  async function save() {
    if (busy) return;
    if (!form.name.trim()) {
      setErr("Give the product a name before saving.");
      return;
    }
    const price = toNum(form.totalPrice);
    if (price == null) {
      setErr("Enter the price before saving.");
      return;
    }
    setBusy(true);
    setErr("");

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
      storeLocation: form.storeLocation.trim() || null,
      sourceType,
      sourceImagePath: imagePath,
      recognitionConfidence: confidence,
    };

    try {
      let product: ProductOverview;
      if (match && !saveAsNew) {
        const json = await postJson(`/api/products/${match.id}/prices`, pricePayload);
        product = json.product as ProductOverview;
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
          imagePath,
          price: pricePayload,
        });
        product = json.product as ProductOverview;
      }
      onSaved?.(product);

      if (addToGrocery) {
        try {
          const g = await postJson("/api/grocery", {
            name: form.name.trim(),
            quantity: null,
            category: form.category.trim() || null,
          });
          onAddedToGrocery?.(g.item as DbGroceryItem);
        } catch {
          /* product saved; grocery add is best-effort */
        }
      }
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          aria-label="Close"
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="relative z-10 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto glass rounded-t-3xl sm:rounded-2xl border border-white/10 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ScanLine size={18} className="text-emerald-400" />
              <h2 className="text-base font-semibold text-white">
                {step === "capture" ? "Scan product or price" : "Review product"}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-md text-readable-faint hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Hidden inputs: camera (rear by default) + library */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />

          {step === "capture" ? (
            <div className="flex flex-col gap-4">
              {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Scan preview" className="w-full max-h-72 object-contain bg-black/30" />
                </div>
              ) : (
                <p className="text-sm text-readable-soft">
                  Photograph a product package, a Costco shelf label, a price tag, or a barcode. It&apos;ll be
                  read automatically — you confirm before anything is saved.
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 text-white px-4 py-2.5 text-sm font-medium hover:bg-white/[0.08] transition-colors"
                >
                  <Camera size={16} /> Take photo
                </button>
                <button
                  onClick={() => uploadRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 text-white px-4 py-2.5 text-sm font-medium hover:bg-white/[0.08] transition-colors"
                >
                  <ImagePlus size={16} /> Upload
                </button>
              </div>

              {preview && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPreview(null);
                      setPending(null);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 text-readable-soft px-4 py-2.5 text-sm hover:bg-white/[0.06] transition-colors"
                  >
                    <RotateCcw size={15} /> Retake
                  </button>
                  <button
                    onClick={analyze}
                    disabled={busy || !pending}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
                  >
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}
                    {busy ? "Analyzing…" : "Analyze"}
                  </button>
                </div>
              )}

              {err && <p className="text-xs text-red-300/90">{err}</p>}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {warning && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/[0.07] px-3 py-2 text-xs text-amber-200/90">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{warning} You can fill in the details by hand below.</span>
                </div>
              )}

              {match && (
                <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/[0.07] px-3 py-2.5 text-xs text-cyan-100/90">
                  <p className="font-medium">You already track “{match.name}”.</p>
                  <p className="text-cyan-100/70 mt-0.5">Matched by {match.reason}.</p>
                  <label className="mt-2 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!saveAsNew}
                      onChange={(e) => setSaveAsNew(!e.target.checked)}
                      className="accent-cyan-400"
                    />
                    Add this as a new price to that product
                  </label>
                </div>
              )}

              {confidence != null && !warning && (
                <p className="text-[11px] text-readable-faint">
                  Overall recognition confidence: {Math.round(confidence * 100)}%
                  {lowConf.size > 0 && " · amber fields need a closer look"}
                </p>
              )}

              <Field label="Product name" low={false}>
                <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Kirkland Boneless Skinless Chicken Breast" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Brand" low={low("brand")}>
                  <input className={`${inputCls} ${low("brand") ? lowCls : ""}`} value={form.brand} onChange={(e) => set("brand", e.target.value)} />
                </Field>
                <Field label="Variant" low={low("variant")}>
                  <input className={`${inputCls} ${low("variant") ? lowCls : ""}`} value={form.variant} onChange={(e) => set("variant", e.target.value)} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Price ($)" low={low("totalPrice")}>
                  <input inputMode="decimal" className={`${inputCls} ${low("totalPrice") ? lowCls : ""}`} value={form.totalPrice} onChange={(e) => set("totalPrice", e.target.value)} placeholder="26.42" />
                </Field>
                <Field label="Category" low={low("category")}>
                  <input list="product-cats" className={`${inputCls} ${low("category") ? lowCls : ""}`} value={form.category} onChange={(e) => set("category", e.target.value)} />
                  <datalist id="product-cats">
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Total weight" low={low("totalWeight")}>
                  <input inputMode="decimal" className={`${inputCls} ${low("totalWeight") ? lowCls : ""}`} value={form.totalWeight} onChange={(e) => set("totalWeight", e.target.value)} placeholder="6.71" />
                </Field>
                <Field label="Unit" low={low("weightUnit")}>
                  <select className={`${inputCls} ${low("weightUnit") ? lowCls : ""}`} value={form.weightUnit} onChange={(e) => set("weightUnit", e.target.value)}>
                    <option value="">—</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                  </select>
                </Field>
                <Field label="Item count" low={low("packageCount")}>
                  <input inputMode="numeric" className={`${inputCls} ${low("packageCount") ? lowCls : ""}`} value={form.packageCount} onChange={(e) => set("packageCount", e.target.value)} placeholder="24" />
                </Field>
              </div>

              {/* Live unit-price preview */}
              {(pricing.unitPrice != null || pricing.pricePerLb != null || pricing.pricePerItem != null) && (
                <div className="flex flex-wrap gap-2">
                  {pricing.pricePerLb != null && <Chip>{formatUnitPrice(pricing.pricePerLb, "lb")}</Chip>}
                  {pricing.pricePerOz != null && <Chip>{formatUnitPrice(pricing.pricePerOz, "oz")}</Chip>}
                  {pricing.pricePerItem != null && <Chip>{formatUnitPrice(pricing.pricePerItem, "item")}</Chip>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Barcode / UPC" low={low("barcode")}>
                  <input inputMode="numeric" className={`${inputCls} ${low("barcode") ? lowCls : ""}`} value={form.barcode} onChange={(e) => set("barcode", e.target.value)} />
                </Field>
                <Field label="Costco item #" low={low("costcoItemNumber")}>
                  <input inputMode="numeric" className={`${inputCls} ${low("costcoItemNumber") ? lowCls : ""}`} value={form.costcoItemNumber} onChange={(e) => set("costcoItemNumber", e.target.value)} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Store" low={low("storeName")}>
                  <input className={`${inputCls} ${low("storeName") ? lowCls : ""}`} value={form.storeName} onChange={(e) => set("storeName", e.target.value)} />
                </Field>
                <Field label="Location" low={low("storeLocation")}>
                  <input className={`${inputCls} ${low("storeLocation") ? lowCls : ""}`} value={form.storeLocation} onChange={(e) => set("storeLocation", e.target.value)} placeholder="e.g. Antioch" />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-xs text-readable-soft cursor-pointer select-none mt-1">
                <input type="checkbox" checked={addToGrocery} onChange={(e) => setAddToGrocery(e.target.checked)} className="accent-emerald-400" />
                Also add to my grocery list
              </label>

              {err && <p className="text-xs text-red-300/90">{err}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setStep("capture")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 text-readable-soft px-4 py-2.5 text-sm hover:bg-white/[0.06] transition-colors"
                >
                  <RotateCcw size={15} /> Rescan
                </button>
                <button
                  onClick={save}
                  disabled={busy}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {match && !saveAsNew ? "Save price" : "Save product"}
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
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Request failed.");
  return json;
}

function Field({ label, low, children }: { label: string; low: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wide text-readable-faint flex items-center gap-1.5">
        {label}
        {low && <span className="text-amber-300/80 normal-case tracking-normal">· low confidence</span>}
      </span>
      {children}
    </label>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs px-2 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
      {children}
    </span>
  );
}
