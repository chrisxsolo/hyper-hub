"use client";

import { useState } from "react";
import { Check, Loader2, Plus, X, AlertTriangle } from "lucide-react";
import type { AdditionalNutrient, ScannedNutrition } from "@/lib/products/types";
import type { NutritionVersionSave } from "@/lib/products/nutrition-schemas";

const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors w-full";
const lowCls = "border-amber-400/50 bg-amber-400/[0.06]";

// Numeric nutrient fields, grouped, with the unit each column is stored in.
type FieldKey =
  | "calories" | "proteinG" | "totalCarbohydrateG" | "totalFatG"
  | "saturatedFatG" | "transFatG" | "cholesterolMg" | "sodiumMg"
  | "dietaryFiberG" | "totalSugarsG" | "addedSugarsG"
  | "vitaminDMcg" | "calciumMg" | "ironMg" | "potassiumMg";

const MACRO_FIELDS: { key: FieldKey; label: string; unit: string }[] = [
  { key: "totalFatG", label: "Total fat", unit: "g" },
  { key: "saturatedFatG", label: "Saturated fat", unit: "g" },
  { key: "transFatG", label: "Trans fat", unit: "g" },
  { key: "cholesterolMg", label: "Cholesterol", unit: "mg" },
  { key: "sodiumMg", label: "Sodium", unit: "mg" },
  { key: "totalCarbohydrateG", label: "Total carbs", unit: "g" },
  { key: "dietaryFiberG", label: "Dietary fiber", unit: "g" },
  { key: "totalSugarsG", label: "Total sugars", unit: "g" },
  { key: "addedSugarsG", label: "Added sugars", unit: "g" },
];
const MICRO_FIELDS: { key: FieldKey; label: string; unit: string }[] = [
  { key: "vitaminDMcg", label: "Vitamin D", unit: "mcg" },
  { key: "calciumMg", label: "Calcium", unit: "mg" },
  { key: "ironMg", label: "Iron", unit: "mg" },
  { key: "potassiumMg", label: "Potassium", unit: "mg" },
];

type Form = Record<FieldKey, string> & {
  servingSizeDescription: string;
  servingSizeValue: string;
  servingSizeUnit: string;
  servingsPerContainer: string;
  notes: string;
};

function s(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}
function toNum(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function buildInitial(initial: Partial<ScannedNutrition>): Form {
  const f = {} as Form;
  for (const k of [...MACRO_FIELDS, ...MICRO_FIELDS]) f[k.key] = s(initial[k.key]);
  f.calories = s(initial.calories);
  f.proteinG = s(initial.proteinG);
  f.servingSizeDescription = s(initial.servingSizeDescription);
  f.servingSizeValue = s(initial.servingSizeValue);
  f.servingSizeUnit = s(initial.servingSizeUnit) || "g";
  f.servingsPerContainer = s(initial.servingsPerContainer);
  f.notes = s(initial.notes);
  return f;
}

export default function NutritionReview({
  initial,
  lowConfidenceFields = [],
  busy = false,
  saveLabel = "Save Nutrition Facts",
  warning,
  onSave,
  onBack,
}: {
  initial: Partial<ScannedNutrition>;
  lowConfidenceFields?: string[];
  busy?: boolean;
  saveLabel?: string;
  warning?: string | null;
  onSave: (payload: NutritionVersionSave) => void;
  onBack?: () => void;
}) {
  const [form, setForm] = useState<Form>(() => buildInitial(initial));
  const [extras, setExtras] = useState<AdditionalNutrient[]>(initial.additionalNutrients ?? []);
  const low = new Set(lowConfidenceFields);

  function set<K extends keyof Form>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function submit() {
    if (busy) return;
    const payload: NutritionVersionSave = {
      servingSizeDescription: form.servingSizeDescription.trim() || null,
      servingSizeValue: toNum(form.servingSizeValue),
      servingSizeUnit: form.servingSizeUnit.trim() || null,
      servingsPerContainer: toNum(form.servingsPerContainer),
      calories: toNum(form.calories),
      proteinG: toNum(form.proteinG),
      totalFatG: toNum(form.totalFatG),
      saturatedFatG: toNum(form.saturatedFatG),
      transFatG: toNum(form.transFatG),
      cholesterolMg: toNum(form.cholesterolMg),
      sodiumMg: toNum(form.sodiumMg),
      totalCarbohydrateG: toNum(form.totalCarbohydrateG),
      dietaryFiberG: toNum(form.dietaryFiberG),
      totalSugarsG: toNum(form.totalSugarsG),
      addedSugarsG: toNum(form.addedSugarsG),
      vitaminDMcg: toNum(form.vitaminDMcg),
      calciumMg: toNum(form.calciumMg),
      ironMg: toNum(form.ironMg),
      potassiumMg: toNum(form.potassiumMg),
      additionalNutrients: extras
        .filter((e) => e.name.trim())
        .map((e) => ({ name: e.name.trim(), value: e.value, unit: e.unit })),
      notes: form.notes.trim() || null,
    };
    onSave(payload);
  }

  return (
    <div className="flex flex-col gap-4">
      {warning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/[0.07] px-3 py-2 text-xs text-amber-200/90">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{warning} Fill in or correct the values below.</span>
        </div>
      )}
      {low.size > 0 && (
        <p className="text-[11px] text-amber-300/80">
          Amber fields had low recognition confidence — give them a closer look.
        </p>
      )}

      {/* Serving */}
      <Section title="Serving">
        <Field label="Serving size (as printed)" lowKey="servingSizeDescription" low={low}>
          <input className={inputCls} value={form.servingSizeDescription} onChange={(e) => set("servingSizeDescription", e.target.value)} placeholder="e.g. 4 oz (112 g)" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Amount" lowKey="servingSizeValue" low={low}>
            <input inputMode="decimal" className={cls("servingSizeValue", low)} value={form.servingSizeValue} onChange={(e) => set("servingSizeValue", e.target.value)} placeholder="112" />
          </Field>
          <Field label="Unit" lowKey="servingSizeUnit" low={low}>
            <select className={cls("servingSizeUnit", low)} value={form.servingSizeUnit} onChange={(e) => set("servingSizeUnit", e.target.value)}>
              {["g", "ml", "oz", "fl oz", "piece", "item", "slice", "cup", "tbsp"].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </Field>
          <Field label="Servings / container" lowKey="servingsPerContainer" low={low}>
            <input inputMode="decimal" className={cls("servingsPerContainer", low)} value={form.servingsPerContainer} onChange={(e) => set("servingsPerContainer", e.target.value)} placeholder="10" />
          </Field>
        </div>
      </Section>

      {/* Calories + the big three */}
      <Section title="Per serving">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Calories" lowKey="calories" low={low}>
            <input inputMode="decimal" className={cls("calories", low)} value={form.calories} onChange={(e) => set("calories", e.target.value)} placeholder="120" />
          </Field>
          <Field label="Protein (g)" lowKey="proteinG" low={low}>
            <input inputMode="decimal" className={cls("proteinG", low)} value={form.proteinG} onChange={(e) => set("proteinG", e.target.value)} placeholder="26" />
          </Field>
        </div>
      </Section>

      {/* Macros */}
      <Section title="Macronutrients">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MACRO_FIELDS.map((nf) => (
            <Field key={nf.key} label={`${nf.label} (${nf.unit})`} lowKey={nf.key} low={low}>
              <input inputMode="decimal" className={cls(nf.key, low)} value={form[nf.key]} onChange={(e) => set(nf.key, e.target.value)} />
            </Field>
          ))}
        </div>
      </Section>

      {/* Micros */}
      <Section title="Micronutrients">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MICRO_FIELDS.map((nf) => (
            <Field key={nf.key} label={`${nf.label} (${nf.unit})`} lowKey={nf.key} low={low}>
              <input inputMode="decimal" className={cls(nf.key, low)} value={form[nf.key]} onChange={(e) => set(nf.key, e.target.value)} />
            </Field>
          ))}
        </div>
      </Section>

      {/* Additional nutrients */}
      <Section title="Other nutrients">
        {extras.length > 0 && (
          <div className="flex flex-col gap-2 mb-2">
            {extras.map((e, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className={`${inputCls} flex-1`} value={e.name} placeholder="Name" onChange={(ev) => setExtras((p) => p.map((x, j) => (j === i ? { ...x, name: ev.target.value } : x)))} />
                <input className={`${inputCls} w-20`} inputMode="decimal" value={s(e.value)} placeholder="Value" onChange={(ev) => setExtras((p) => p.map((x, j) => (j === i ? { ...x, value: toNum(ev.target.value) } : x)))} />
                <input className={`${inputCls} w-16`} value={s(e.unit)} placeholder="Unit" onChange={(ev) => setExtras((p) => p.map((x, j) => (j === i ? { ...x, unit: ev.target.value || null } : x)))} />
                <button onClick={() => setExtras((p) => p.filter((_, j) => j !== i))} aria-label="Remove" className="p-1.5 rounded-md text-readable-faint hover:text-red-300 hover:bg-red-500/10 transition-colors"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setExtras((p) => [...p, { name: "", value: null, unit: null }])} className="inline-flex items-center gap-1.5 text-xs text-readable-soft hover:text-white transition-colors">
          <Plus size={13} /> Add a nutrient
        </button>
      </Section>

      <Field label="Notes" lowKey="notes" low={low}>
        <input className={inputCls} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. values as prepared, dual-column label…" />
      </Field>

      <div className="flex gap-2 pt-1">
        {onBack && (
          <button onClick={onBack} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 text-readable-soft px-4 py-2.5 text-sm hover:bg-white/[0.06] transition-colors">
            Back
          </button>
        )}
        <button onClick={submit} disabled={busy} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

function cls(key: string, low: Set<string>): string {
  return `${inputCls} ${low.has(key) ? lowCls : ""}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[11px] uppercase tracking-wide text-readable-faint">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label, lowKey, low, children,
}: {
  label: string; lowKey: string; low: Set<string>; children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-readable-faint flex items-center gap-1.5">
        {label}
        {low.has(lowKey) && <span className="text-amber-300/80">· low confidence</span>}
      </span>
      {children}
    </label>
  );
}
