"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

// A bottom sheet on mobile, a centered modal on desktop. Used for editing meals
// and managing settings so primary actions stay reachable by thumb on phones.
export default function Sheet({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 32, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col glass border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-black/40"
          >
            <div className="flex items-start justify-between gap-3 p-5 pb-3 border-b border-white/8 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-white">{title}</h2>
                {subtitle && <p className="text-xs text-readable-faint mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-2 -m-1 rounded-lg text-readable-faint hover:text-white hover:bg-white/[0.05] transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-5 flex-1">{children}</div>
            {footer && <div className="p-4 border-t border-white/8 shrink-0">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
