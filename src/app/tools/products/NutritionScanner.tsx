"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, ImagePlus, Loader2, X, RotateCcw, RotateCw, ScanLine, Crop,
} from "lucide-react";
import { fileToScaledJpeg, transformImage, type CropRect } from "./image";
import NutritionReview from "./NutritionReview";
import type { NutritionVersionSave } from "@/lib/products/nutrition-schemas";
import type { ProductOverview, ScannedNutrition } from "@/lib/products/types";

type Step = "capture" | "review";

type ScanResponse = {
  scan: ScannedNutrition | null;
  imagePath: string | null;
  imageUrl: string | null;
  warning: string | null;
  error?: string;
};

// Scan/upload a nutrition-facts label for a specific product, straighten/crop it,
// extract values, review them, and save a confirmed nutrition version.
export default function NutritionScanner({
  productId,
  productName,
  onClose,
  onSaved,
}: {
  productId: string;
  productName: string;
  onClose: () => void;
  onSaved?: (product: ProductOverview) => void;
}) {
  const [step, setStep] = useState<Step>("capture");
  const [workingUrl, setWorkingUrl] = useState<string | null>(null); // rotation baked in
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [drag, setDrag] = useState<{ x0: number; y0: number; rect: CropRect } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [scan, setScan] = useState<ScannedNutrition | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const imgBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setErr("");
    setCrop(null);
    try {
      const scaled = await fileToScaledJpeg(file);
      setWorkingUrl(scaled.previewUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't load that image.");
    }
  }

  async function rotate(dir: 1 | -1) {
    if (!workingUrl) return;
    try {
      const out = await transformImage(workingUrl, { rotateDeg: dir === 1 ? 90 : 270 });
      setWorkingUrl(out.previewUrl);
      setCrop(null);
    } catch {
      /* ignore */
    }
  }

  // Pointer-drag crop selection (normalized to the displayed image box).
  function norm(e: React.PointerEvent): { x: number; y: number } {
    const box = imgBoxRef.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    return {
      x: Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)),
      y: Math.min(1, Math.max(0, (e.clientY - box.top) / box.height)),
    };
  }
  function onDown(e: React.PointerEvent) {
    const p = norm(e);
    setDrag({ x0: p.x, y0: p.y, rect: { x: p.x, y: p.y, w: 0, h: 0 } });
  }
  function onMove(e: React.PointerEvent) {
    if (!drag) return;
    const p = norm(e);
    setDrag({
      ...drag,
      rect: {
        x: Math.min(drag.x0, p.x),
        y: Math.min(drag.y0, p.y),
        w: Math.abs(p.x - drag.x0),
        h: Math.abs(p.y - drag.y0),
      },
    });
  }
  function onUp() {
    if (!drag) return;
    setCrop(drag.rect.w > 0.04 && drag.rect.h > 0.04 ? drag.rect : null);
    setDrag(null);
  }

  const liveCrop = drag?.rect ?? crop;

  async function analyze() {
    if (!workingUrl || busy) return;
    setBusy(true);
    setErr("");
    setWarning(null);
    try {
      const prepared = await transformImage(workingUrl, { crop });
      const res = await fetch(`/api/products/${productId}/nutrition/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: prepared.base64, mediaType: prepared.mediaType }),
      });
      const json: ScanResponse = await res.json();
      if (!res.ok) throw new Error(json.error || "Scan failed.");
      setScan(json.scan);
      setWarning(json.warning);
      setImagePath(json.imagePath);
      setStep("review");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setBusy(false);
    }
  }

  async function save(payload: NutritionVersionSave) {
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/products/${productId}/nutrition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          sourceImagePath: imagePath,
          recognitionConfidence: scan ? { overall: scan.confidence } : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Couldn't save nutrition.");
      onSaved?.(json.product as ProductOverview);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save nutrition.");
      setBusy(false);
    }
  }

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
              <ScanLine size={18} className="text-emerald-400" />
              <h2 className="text-base font-semibold text-white">
                {step === "capture" ? "Scan Nutrition Facts" : "Review Nutrition Facts"}
              </h2>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-readable-faint hover:text-white hover:bg-white/10 transition-colors">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-readable-faint mb-4 truncate">{productName}</p>

          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
          <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />

          {step === "capture" ? (
            <div className="flex flex-col gap-4">
              {workingUrl ? (
                <>
                  <div
                    ref={imgBoxRef}
                    className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30 touch-none select-none"
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={workingUrl} alt="Nutrition label" className="w-full max-h-80 object-contain pointer-events-none" />
                    {liveCrop && liveCrop.w > 0 && liveCrop.h > 0 && (
                      <div
                        className="absolute border-2 border-emerald-400/80"
                        style={{
                          left: `${liveCrop.x * 100}%`, top: `${liveCrop.y * 100}%`,
                          width: `${liveCrop.w * 100}%`, height: `${liveCrop.h * 100}%`,
                          boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                        }}
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-readable-faint flex items-center gap-1.5">
                    <Crop size={12} /> Drag across the label to crop. {crop && <button onClick={() => setCrop(null)} className="text-emerald-300 hover:underline">Reset crop</button>}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => rotate(-1)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 text-readable-soft px-3 py-2 text-sm hover:bg-white/[0.06] transition-colors" aria-label="Rotate left"><RotateCcw size={15} /></button>
                    <button onClick={() => rotate(1)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 text-readable-soft px-3 py-2 text-sm hover:bg-white/[0.06] transition-colors" aria-label="Rotate right"><RotateCw size={15} /></button>
                    <button onClick={() => { setWorkingUrl(null); setCrop(null); }} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 text-readable-soft px-3 py-2 text-sm hover:bg-white/[0.06] transition-colors">Retake</button>
                    <button onClick={analyze} disabled={busy} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40">
                      {busy ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}
                      {busy ? "Analyzing…" : "Analyze"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-readable-soft">
                    Photograph the Nutrition Facts panel, or upload an image. You can straighten and crop it,
                    then confirm every value before it&apos;s saved.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => cameraRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 text-white px-4 py-2.5 text-sm font-medium hover:bg-white/[0.08] transition-colors">
                      <Camera size={16} /> Take photo
                    </button>
                    <button onClick={() => uploadRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 text-white px-4 py-2.5 text-sm font-medium hover:bg-white/[0.08] transition-colors">
                      <ImagePlus size={16} /> Upload
                    </button>
                  </div>
                </>
              )}
              {err && <p className="text-xs text-red-300/90">{err}</p>}
            </div>
          ) : (
            <>
              <NutritionReview
                initial={scan ?? {}}
                lowConfidenceFields={scan?.lowConfidenceFields ?? []}
                warning={warning}
                busy={busy}
                onBack={() => setStep("capture")}
                onSave={save}
              />
              {err && <p className="text-xs text-red-300/90 mt-2">{err}</p>}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
