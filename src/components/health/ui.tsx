"use client";

// Shared visual primitives for the health dashboard. Every metrics view builds
// from these so the glass/dark language stays consistent across tabs.

import { motion } from "framer-motion";
import { Loader2, Plus, Trash2 } from "lucide-react";
import AnimatedNumber from "@/components/charts/AnimatedNumber";

export const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

export const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/40 transition-colors w-full";

// ── Form primitives ──────────────────────────────────────────────────────────

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-readable-faint">{label}</span>
      {children}
    </label>
  );
}

export function AddCard({
  onSubmit,
  saving,
  submitLabel = "Add entry",
  children,
}: {
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="glass rounded-2xl border border-white/8 p-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">{children}</div>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 px-4 py-2 text-sm font-medium hover:bg-cyan-500/25 transition-colors disabled:opacity-60"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        {submitLabel}
      </button>
    </form>
  );
}

export function HistoryList({
  items,
  canEdit,
  onDelete,
  emptyText = "No entries yet.",
}: {
  items: { id: string; date: string; primary: string; secondary?: string }[];
  canEdit: boolean;
  onDelete: (id: string) => void;
  emptyText?: string;
}) {
  if (items.length === 0)
    return (
      <div className="glass rounded-2xl border border-white/8 p-5 text-sm text-readable-faint">
        {emptyText}
      </div>
    );
  const ordered = [...items].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="glass rounded-2xl border border-white/8 divide-y divide-white/5 overflow-hidden">
      {ordered.map((it) => (
        <div key={it.id} className="flex items-center gap-3 px-5 py-3 text-sm">
          <span className="text-readable-faint w-24 shrink-0 font-mono text-xs">{it.date}</span>
          <span className="text-white font-medium">{it.primary}</span>
          {it.secondary && <span className="text-readable-faint text-xs">{it.secondary}</span>}
          {canEdit && (
            <button
              onClick={() => onDelete(it.id)}
              className="ml-auto text-readable-faint hover:text-red-400 transition-colors"
              aria-label="Delete entry"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Layout / display primitives ──────────────────────────────────────────────

export function SectionCard({
  title,
  subtitle,
  icon: Icon,
  iconColor = "#22d3ee",
  right,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  icon?: React.ElementType;
  iconColor?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={fadeUp} className={`glass rounded-2xl border border-white/8 p-5 ${className}`}>
      {(title || right) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                {Icon && <Icon size={15} style={{ color: iconColor }} />}
                {title}
              </h2>
            )}
            {subtitle && <p className="text-xs text-readable-faint mt-1">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </motion.div>
  );
}

export function Narrative({
  icon: Icon,
  accent = "#22d3ee",
  title,
  children,
}: {
  icon: React.ElementType;
  accent?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="glass rounded-2xl border p-5 bg-gradient-to-br to-transparent"
      style={{ borderColor: `${accent}33`, backgroundImage: `linear-gradient(to bottom right, ${accent}14, transparent)` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color: accent }} />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <p className="text-sm text-readable-soft leading-relaxed">{children}</p>
    </motion.div>
  );
}

export type Kpi = {
  icon: React.ElementType;
  color: string;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  sub?: string;
  animate?: boolean;
};

export function KpiCard(k: Kpi) {
  const Icon = k.icon;
  return (
    <div className="glass rounded-2xl border border-white/8 p-4 relative overflow-hidden">
      <div className="absolute -right-4 -top-4 opacity-[0.07]">
        <Icon size={72} />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} style={{ color: k.color }} />
        <span className="text-[11px] uppercase tracking-wide text-readable-faint">{k.label}</span>
      </div>
      <div className="text-2xl font-bold text-white leading-none">
        {k.animate === false ? (
          <span>
            {k.prefix}
            {k.value.toLocaleString(undefined, {
              minimumFractionDigits: k.decimals ?? 0,
              maximumFractionDigits: k.decimals ?? 0,
            })}
            {k.suffix}
          </span>
        ) : (
          <AnimatedNumber value={k.value} decimals={k.decimals ?? 0} prefix={k.prefix} suffix={k.suffix} />
        )}
      </div>
      {k.sub && <div className="text-[11px] text-readable-faint mt-1.5">{k.sub}</div>}
    </div>
  );
}

export function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {kpis.map((k) => (
        <KpiCard key={k.label} {...k} />
      ))}
    </motion.div>
  );
}

export type Insight = { icon: React.ElementType; color: string; title: string; text: string };

export function InsightGrid({ insights, heading = "What the data says" }: { insights: Insight[]; heading?: string }) {
  if (insights.length === 0) return null;
  return (
    <motion.div variants={fadeUp}>
      <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {heading}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-xl border border-white/8 p-4 flex gap-3"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${ins.color}1f`, border: `1px solid ${ins.color}40` }}
              >
                <Icon size={15} style={{ color: ins.color }} />
              </div>
              <div>
                <div className="text-xs font-semibold text-white mb-0.5">{ins.title}</div>
                <div className="text-xs text-readable-soft leading-relaxed">{ins.text}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl border border-white/8 p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
        <Icon size={22} className="text-readable-faint" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-readable-soft leading-relaxed max-w-sm mx-auto">{text}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function Pill({ children, color = "#94a3b8" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
      style={{ background: `${color}14`, borderColor: `${color}33`, color }}
    >
      {children}
    </span>
  );
}

const CONFIDENCE_COLORS: Record<string, string> = { high: "#34d399", medium: "#fbbf24", low: "#f87171" };

export function ConfidenceBadge({ level }: { level: "low" | "medium" | "high" }) {
  return <Pill color={CONFIDENCE_COLORS[level]}>{level} confidence</Pill>;
}
