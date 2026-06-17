"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, Tag, Barcode, Receipt, Apple, ChevronRight } from "lucide-react";

export type AddMode = "product" | "price" | "nutrition" | "barcode" | "receipt";

const OPTIONS: { mode: AddMode; label: string; hint: string; icon: React.ElementType }[] = [
  { mode: "product", label: "Scan Product", hint: "Package front — name, brand, size", icon: Package },
  { mode: "price", label: "Scan Price Label", hint: "Costco shelf tag or receipt price", icon: Tag },
  { mode: "nutrition", label: "Scan Nutrition Facts", hint: "The Nutrition Facts panel", icon: Apple },
  { mode: "barcode", label: "Scan Barcode", hint: "UPC / item number", icon: Barcode },
  { mode: "receipt", label: "Scan Receipt", hint: "A line item from a receipt", icon: Receipt },
];

// The "Add Product Information" chooser (spec §3). Emits the chosen mode; the
// parent opens the right scanner (nutrition needs a product to attach to).
export default function AddProductMenu({
  onPick,
  onClose,
}: {
  onPick: (mode: AddMode) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
          className="relative z-10 w-full sm:max-w-sm glass rounded-t-3xl sm:rounded-2xl border border-white/10 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Add Product Information</h2>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-readable-faint hover:text-white hover:bg-white/10 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {OPTIONS.map(({ mode, label, hint, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => onPick(mode)}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.07] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                  <Icon size={17} className="text-emerald-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-readable-faint truncate">{hint}</p>
                </div>
                <ChevronRight size={15} className="text-readable-faint shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
