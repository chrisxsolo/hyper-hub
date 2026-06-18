"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, Flame, Beef, Trash2, Copy, CalendarPlus, RefreshCw,
  BookmarkPlus, Clock, Loader2, Pencil, StickyNote, DollarSign, Gauge,
} from "lucide-react";
import { SOURCE_LABELS, type SourceType } from "@/lib/nutrition/types";
import { MEAL_TYPE_META, fmtTime, type MealWithItems } from "@/lib/nutrition/db";
import type { MealCostSummary } from "@/lib/products/cost";
import { hasSatiety, satietyLabel, hungerLabel, ratingColor, type SatietyInput } from "@/lib/nutrition/satiety";

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
  costByMeal,
  canEdit,
  busyId,
  onEdit,
  onDelete,
  onDuplicate,
  onCopyToDay,
  onRecalculate,
  onSaveTemplate,
  onSetSatiety,
}: {
  meals: MealWithItems[];
  costByMeal?: Map<string, MealCostSummary>;
  canEdit: boolean;
  busyId: string | null;
  onEdit: (meal: MealWithItems) => void;
  onDelete: (mealId: string) => void;
  onDuplicate: (meal: MealWithItems) => void;
  onCopyToDay: (meal: MealWithItems, date: string) => void;
  onRecalculate: (meal: MealWithItems) => void;
  onSaveTemplate: (meal: MealWithItems, name: string) => void;
  onSetSatiety: (mealId: string, input: SatietyInput) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copyFor, setCopyFor] = useState<string | null>(null);
  const [tplFor, setTplFor] = useState<string | null>(null);
  const [tplName, setTplName] = useState("");
  const [satFor, setSatFor] = useState<string | null>(null);

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
        const cost = costByMeal?.get(meal.id) ?? null;
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
                  {hasSatiety(meal) && (
                    <Gauge size={11} style={{ color: ratingColor(meal.satiety_score ?? 3, true) }} />
                  )}
                </div>
                <p className="text-xs text-readable-soft truncate mt-0.5">{meal.original_text}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-semibold text-white"><Flame size={12} className="text-orange-400" />{Math.round(meal.total_calories).toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-[11px] text-readable-faint justify-end"><Beef size={11} className="text-emerald-400" />{Math.round(meal.total_protein_g)}g · {meal.items.length} food{meal.items.length === 1 ? "" : "s"}{cost && <span className="text-amber-300/80">{" "}· {cost.complete ? "" : "≥"}${cost.cost.toFixed(2)}</span>}</div>
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

                    {cost && (
                      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                        <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
                          <DollarSign size={11} />{cost.complete ? "" : "≥ "}${cost.cost.toFixed(2)}
                        </span>
                        {cost.complete ? (
                          <span className="text-readable-faint">
                            {cost.proteinPerDollar != null && `${cost.proteinPerDollar} g protein / $`}
                            {cost.proteinPerDollar != null && cost.costPer100Cal != null && " · "}
                            {cost.costPer100Cal != null && `$${cost.costPer100Cal.toFixed(2)} / 100 cal`}
                          </span>
                        ) : (
                          <span className="text-readable-faint">
                            {cost.pricedItems} of {cost.totalItems} foods priced
                          </span>
                        )}
                      </div>
                    )}

                    {hasSatiety(meal) && (
                      <div className="mt-2 text-[11px]">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          {meal.satiety_score != null && (
                            <span className="inline-flex items-center gap-1 text-readable-soft">
                              <Gauge size={11} style={{ color: ratingColor(meal.satiety_score, true) }} />
                              Fullness {meal.satiety_score}/5 · {satietyLabel(meal.satiety_score)}
                            </span>
                          )}
                          {meal.hunger_after_2h != null && (
                            <span className="text-readable-faint">hunger @2h {meal.hunger_after_2h}/5</span>
                          )}
                          {meal.hunger_after_3h != null && (
                            <span className="text-readable-faint">@3h {meal.hunger_after_3h}/5</span>
                          )}
                          {meal.cravings_after_meal != null && (
                            <span className="text-readable-faint">cravings {meal.cravings_after_meal}/5</span>
                          )}
                        </div>
                        {meal.satiety_note && <p className="text-readable-faint mt-0.5">{meal.satiety_note}</p>}
                      </div>
                    )}

                    {meal.note && (
                      <p className="mt-2 text-xs text-readable-soft flex items-start gap-1.5"><StickyNote size={12} className="mt-0.5 shrink-0 text-readable-faint" />{meal.note}</p>
                    )}

                    {canEdit && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-white/5">
                        <ActionBtn icon={Pencil} label="Edit" onClick={() => onEdit(meal)} />
                        <ActionBtn icon={RefreshCw} label="Recalculate" busy={busy} onClick={() => onRecalculate(meal)} />
                        <ActionBtn icon={Copy} label="Duplicate" onClick={() => onDuplicate(meal)} />
                        <ActionBtn icon={CalendarPlus} label="Copy to day" onClick={() => { setCopyFor(copyFor === meal.id ? null : meal.id); setTplFor(null); setSatFor(null); }} />
                        <ActionBtn icon={BookmarkPlus} label="Save as meal" onClick={() => { setTplFor(tplFor === meal.id ? null : meal.id); setTplName(meal.original_text.slice(0, 40)); setCopyFor(null); setSatFor(null); }} />
                        <ActionBtn icon={Gauge} label="Satiety" onClick={() => { setSatFor(satFor === meal.id ? null : meal.id); setCopyFor(null); setTplFor(null); }} />
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
                    {satFor === meal.id && (
                      <SatietyEditor
                        meal={meal}
                        onSave={(input) => { onSetSatiety(meal.id, input); setSatFor(null); }}
                        onCancel={() => setSatFor(null)}
                      />
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

// Inline editor for a meal's satiety / behavior ratings (spec §11). Pre-fills
// from the meal; tapping a selected number again clears it back to "no rating".
function SatietyEditor({
  meal,
  onSave,
  onCancel,
}: {
  meal: MealWithItems;
  onSave: (input: SatietyInput) => void;
  onCancel: () => void;
}) {
  const [satiety, setSatiety] = useState<number | null>(meal.satiety_score);
  const [h2, setH2] = useState<number | null>(meal.hunger_after_2h);
  const [h3, setH3] = useState<number | null>(meal.hunger_after_3h);
  const [crav, setCrav] = useState<number | null>(meal.cravings_after_meal);
  const [note, setNote] = useState(meal.satiety_note ?? "");

  const anySet = satiety != null || h2 != null || h3 != null || crav != null || note.trim() !== "";
  function save(clear = false) {
    onSave(
      clear
        ? { satietyScore: null, hungerAfter2h: null, hungerAfter3h: null, cravingsAfterMeal: null, note: null }
        : { satietyScore: satiety, hungerAfter2h: h2, hungerAfter3h: h3, cravingsAfterMeal: crav, note: note.trim() || null },
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <p className="text-[11px] text-readable-faint">Rate how this meal kept you full (tap a number again to clear).</p>
      <RatingRow label="Fullness" value={satiety} onChange={setSatiety} higherIsBetter />
      <RatingRow label="Hunger @2h" value={h2} onChange={setH2} />
      <RatingRow label="Hunger @3h" value={h3} onChange={setH3} />
      <RatingRow label="Cravings" value={crav} onChange={setCrav} />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Notes (optional) — e.g. kept me full till dinner"
        maxLength={500}
        className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40"
      />
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => save(false)} className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500/25 transition-colors">Save</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-white/10 text-readable-soft px-3 py-1.5 text-xs hover:bg-white/[0.05] transition-colors">Cancel</button>
        {anySet && (
          <button type="button" onClick={() => save(true)} className="ml-auto text-[11px] text-readable-faint hover:text-rose-300 transition-colors">Clear</button>
        )}
      </div>
    </div>
  );
}

function RatingRow({
  label,
  value,
  onChange,
  higherIsBetter = false,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
  higherIsBetter?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-readable-soft w-[68px] shrink-0">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(active ? null : n)}
              className={`w-7 h-7 rounded-md text-xs font-medium border transition-colors ${active ? "text-black border-transparent" : "border-white/10 text-readable-soft hover:bg-white/[0.06]"}`}
              style={active ? { background: ratingColor(n, higherIsBetter) } : undefined}
            >
              {n}
            </button>
          );
        })}
      </div>
      {value != null && (
        <span className="text-[10px] text-readable-faint truncate">
          {higherIsBetter ? satietyLabel(value) : hungerLabel(value)}
        </span>
      )}
    </div>
  );
}
