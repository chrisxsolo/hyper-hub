"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, Flame, Beef, Trash2, Copy, CalendarPlus, RefreshCw,
  BookmarkPlus, Clock, Loader2, Pencil, StickyNote,
} from "lucide-react";
import { SOURCE_LABELS, type SourceType } from "@/lib/nutrition/types";
import { MEAL_TYPE_META, fmtTime, type MealWithItems } from "@/lib/nutrition/db";

const SOURCE_COLOR: Record<SourceType, string> = {
  personal: "#34d399", official_restaurant: "#22d3ee", usda: "#60a5fa",
  manufacturer: "#a78bfa", nutrition_database: "#818cf8", ai_estimate: "#fbbf24", manual: "#94a3b8",
};

function confDot(c: number | null) {
  if (c == null) return "#94a3b8";
  if (c >= 0.75) return "#34d399";
  if (c >= 0.45) return "#fbbf24";
  return "#f87171";
}

export default function MealTimeline({
  meals,
  canEdit,
  busyId,
  onEdit,
  onDelete,
  onDuplicate,
  onCopyToDay,
  onRecalculate,
  onSaveTemplate,
}: {
  meals: MealWithItems[];
  canEdit: boolean;
  busyId: string | null;
  onEdit: (meal: MealWithItems) => void;
  onDelete: (mealId: string) => void;
  onDuplicate: (meal: MealWithItems) => void;
  onCopyToDay: (meal: MealWithItems, date: string) => void;
  onRecalculate: (meal: MealWithItems) => void;
  onSaveTemplate: (meal: MealWithItems, name: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copyFor, setCopyFor] = useState<string | null>(null);
  const [tplFor, setTplFor] = useState<string | null>(null);
  const [tplName, setTplName] = useState("");

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (meals.length === 0) {
    return (
      <div className="glass rounded-2xl border border-white/8 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-3">
          <Clock size={20} className="text-readable-faint" />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">No meals logged for this day</h3>
        <p className="text-xs text-readable-soft max-w-sm mx-auto">
          {canEdit ? "Describe what you ate above and it'll appear here." : "Nothing logged for this date."}
        </p>
      </div>
    );
  }

  const ordered = [...meals].sort((a, b) => a.consumed_at.localeCompare(b.consumed_at));

  return (
    <div className="space-y-2.5">
      {ordered.map((meal) => {
        const meta = MEAL_TYPE_META[meal.meal_type];
        const isOpen = expanded.has(meal.id);
        const busy = busyId === meal.id;
        return (
          <motion.div
            key={meal.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-white/8 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggle(meal.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base" style={{ background: `${meta.color}1f`, border: `1px solid ${meta.color}40` }}>
                {meta.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{meta.label}</span>
                  <span className="text-[11px] text-readable-faint">{fmtTime(meal.consumed_at)}</span>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: confDot(meal.confidence) }} title={`${Math.round((meal.confidence ?? 0) * 100)}% confidence`} />
                  {meal.note && <StickyNote size={11} className="text-readable-faint" />}
                </div>
                <p className="text-xs text-readable-soft truncate mt-0.5">{meal.original_text}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-semibold text-white"><Flame size={12} className="text-orange-400" />{Math.round(meal.total_calories).toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-[11px] text-readable-faint justify-end"><Beef size={11} className="text-emerald-400" />{Math.round(meal.total_protein_g)}g · {meal.items.length} food{meal.items.length === 1 ? "" : "s"}</div>
                </div>
                <ChevronDown size={16} className={`text-readable-faint transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                  <div className="px-4 pb-4 border-t border-white/5">
                    <div className="divide-y divide-white/5">
                      {meal.items.map((it) => {
                        const color = SOURCE_COLOR[it.source_type];
                        const badge = (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full border font-medium align-middle" style={{ color, background: `${color}14`, borderColor: `${color}33` }}>
                            {SOURCE_LABELS[it.source_type]}
                          </span>
                        );
                        return (
                          <div key={it.id} className="flex items-center gap-2 py-2 text-sm">
                            <div className="min-w-0 flex-1">
                              <span className="text-white">{it.name}</span>{" "}
                              {it.source_url ? <a href={it.source_url} target="_blank" rel="noreferrer" className="align-middle">{badge}</a> : badge}
                              <div className="text-[11px] text-readable-faint">
                                {it.quantity != null ? `${+Number(it.quantity).toFixed(2)} ` : ""}{it.unit}{it.preparation_state ? ` · ${it.preparation_state}` : ""}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-white font-medium">{Math.round(Number(it.calories ?? 0))}</span><span className="text-[11px] text-readable-faint"> kcal</span>
                              <div className="text-[11px] text-emerald-300/80">{Math.round(Number(it.protein_g ?? 0))}g protein</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {meal.note && (
                      <p className="mt-2 text-xs text-readable-soft flex items-start gap-1.5"><StickyNote size={12} className="mt-0.5 shrink-0 text-readable-faint" />{meal.note}</p>
                    )}

                    {canEdit && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-white/5">
                        <ActionBtn icon={Pencil} label="Edit" onClick={() => onEdit(meal)} />
                        <ActionBtn icon={RefreshCw} label="Recalculate" busy={busy} onClick={() => onRecalculate(meal)} />
                        <ActionBtn icon={Copy} label="Duplicate" onClick={() => onDuplicate(meal)} />
                        <ActionBtn icon={CalendarPlus} label="Copy to day" onClick={() => { setCopyFor(copyFor === meal.id ? null : meal.id); setTplFor(null); }} />
                        <ActionBtn icon={BookmarkPlus} label="Save as meal" onClick={() => { setTplFor(tplFor === meal.id ? null : meal.id); setTplName(meal.original_text.slice(0, 40)); setCopyFor(null); }} />
                        <button type="button" onClick={() => onDelete(meal.id)} className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-readable-faint hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                    {copyFor === meal.id && (
                      <div className="flex items-center gap-2 mt-2">
                        <input type="date" defaultValue={meal.eaten_on} onChange={(e) => { if (e.target.value) { onCopyToDay(meal, e.target.value); setCopyFor(null); } }} className="rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40 [color-scheme:dark]" />
                        <span className="text-[11px] text-readable-faint">Pick a date to copy this meal to</span>
                      </div>
                    )}
                    {tplFor === meal.id && (
                      <div className="flex items-center gap-2 mt-2">
                        <input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Name this meal (e.g. usual lunch)" className="rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40 flex-1" />
                        <button type="button" disabled={!tplName.trim()} onClick={() => { onSaveTemplate(meal, tplName.trim()); setTplFor(null); }} className="rounded-lg bg-white/[0.06] border border-white/15 text-white px-3 py-1.5 text-xs hover:bg-white/[0.1] transition-colors disabled:opacity-40">Save</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, busy }: { icon: React.ElementType; label: string; onClick: () => void; busy?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-readable-soft hover:text-white hover:bg-white/[0.05] transition-colors disabled:opacity-50">
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
      {label}
    </button>
  );
}
