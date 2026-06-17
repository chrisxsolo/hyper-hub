"use client";

import { useState } from "react";
import { Loader2, Check, Download, Trash2, Link2, Salad, BookMarked } from "lucide-react";
import type { AliasRow, MealTemplate, NutritionSettings, SavedFood } from "@/lib/nutrition/types";

const TIMEZONES = [
  "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
  "America/Phoenix", "Europe/London", "Europe/Berlin", "Asia/Tokyo", "UTC",
];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const input = "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/40 w-full [color-scheme:dark]";

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold text-white uppercase tracking-wide flex items-center gap-2">
        <Icon size={13} className="text-emerald-400" /> {title}
      </h3>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-readable-faint">{label}</span>
      {children}
    </label>
  );
}
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 text-sm text-readable-soft"
    >
      <span className={`w-9 h-5 rounded-full transition-colors relative ${checked ? "bg-emerald-500/60" : "bg-white/10"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

export default function SettingsBody({
  settings,
  savedFoods,
  templates,
  aliases,
  saving,
  onSaveSettings,
  onDeleteFood,
  onDeleteTemplate,
  onCreateAlias,
  onDeleteAlias,
}: {
  settings: NutritionSettings | null;
  savedFoods: SavedFood[];
  templates: MealTemplate[];
  aliases: AliasRow[];
  saving: boolean;
  onSaveSettings: (patch: Record<string, unknown>) => void;
  onDeleteFood: (id: string) => void;
  onDeleteTemplate: (id: string) => void;
  onCreateAlias: (phrase: string, templateId: string) => void;
  onDeleteAlias: (id: string) => void;
}) {
  const [cal, setCal] = useState(String(settings?.calorie_target ?? 2200));
  const [prot, setProt] = useState(String(settings?.protein_target_g ?? 160));
  const [tz, setTz] = useState(settings?.timezone ?? "America/Los_Angeles");
  const [weekStart, setWeekStart] = useState(String(settings?.week_start ?? 0));
  const [units, setUnits] = useState(settings?.units ?? "imperial");
  const [showRemaining, setShowRemaining] = useState(settings?.show_remaining ?? true);
  const [showAvg, setShowAvg] = useState(settings?.show_rolling_avg ?? true);
  const [preferUsda, setPreferUsda] = useState(settings?.ai_prefer_usda ?? true);
  const [rice, setRice] = useState(settings?.rice_default ?? "cooked");
  const [chicken, setChicken] = useState(settings?.chicken_default ?? "cooked");
  const [egg, setEgg] = useState(settings?.egg_size_default ?? "large");
  const [milk, setMilk] = useState(settings?.default_milk ?? "unsweetened almond milk");

  const [aliasPhrase, setAliasPhrase] = useState("");
  const [aliasTemplate, setAliasTemplate] = useState("");

  function save() {
    onSaveSettings({
      calorie_target: Number(cal) || 2200,
      protein_target_g: Number(prot) || 160,
      timezone: tz,
      week_start: Number(weekStart),
      units,
      show_remaining: showRemaining,
      show_rolling_avg: showAvg,
      ai_prefer_usda: preferUsda,
      rice_default: rice,
      chicken_default: chicken,
      egg_size_default: egg,
      default_milk: milk.trim() || "unsweetened almond milk",
    });
  }

  const tzOptions = TIMEZONES.includes(tz) ? TIMEZONES : [tz, ...TIMEZONES];

  return (
    <div className="space-y-7">
      <Section icon={Check} title="Targets">
        <p className="text-[11px] text-readable-faint -mt-1">
          Changing targets is recorded with today&apos;s date — past days keep the target that was active then.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Daily calorie target"><input type="number" value={cal} onChange={(e) => setCal(e.target.value)} className={input} /></Field>
          <Field label="Daily protein target (g)"><input type="number" value={prot} onChange={(e) => setProt(e.target.value)} className={input} /></Field>
        </div>
      </Section>

      <Section icon={Check} title="Display, units & week">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Timezone">
            <select value={tz} onChange={(e) => setTz(e.target.value)} className={input}>
              {tzOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Week starts on">
            <select value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className={input}>
              {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </Field>
          <Field label="Units">
            <select value={units} onChange={(e) => setUnits(e.target.value as "imperial" | "metric")} className={input}>
              <option value="imperial">Imperial (oz, lb)</option>
              <option value="metric">Metric (g, kg)</option>
            </select>
          </Field>
        </div>
        <div className="flex flex-col gap-2.5 pt-1">
          <Toggle checked={showRemaining} onChange={setShowRemaining} label="Show calories remaining" />
          <Toggle checked={showAvg} onChange={setShowAvg} label="Show rolling averages on Trends" />
        </div>
      </Section>

      <Section icon={Salad} title="AI analysis & food defaults">
        <Toggle checked={preferUsda} onChange={setPreferUsda} label="Prefer USDA data for generic foods" />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Field label="Rice default"><select value={rice} onChange={(e) => setRice(e.target.value)} className={input}><option value="cooked">cooked</option><option value="dry">dry</option></select></Field>
          <Field label="Chicken weights"><select value={chicken} onChange={(e) => setChicken(e.target.value)} className={input}><option value="cooked">cooked</option><option value="raw">raw</option></select></Field>
          <Field label="Egg size"><select value={egg} onChange={(e) => setEgg(e.target.value)} className={input}><option value="small">small</option><option value="medium">medium</option><option value="large">large</option><option value="xl">extra large</option></select></Field>
          <Field label="Default milk"><input value={milk} onChange={(e) => setMilk(e.target.value)} className={input} /></Field>
        </div>
      </Section>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-100 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
        Save settings
      </button>

      {/* Saved meals + aliases */}
      <Section icon={BookMarked} title={`Saved meals (${templates.length})`}>
        {templates.length === 0 ? (
          <p className="text-xs text-readable-faint">No saved meals yet. Use “Save as meal” on any logged meal.</p>
        ) : (
          <div className="space-y-1.5">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white truncate">{t.name}</div>
                  <div className="text-[11px] text-readable-faint">{Math.round(t.total_calories)} kcal · {Math.round(t.total_protein_g)}g · {t.items.length} foods</div>
                </div>
                <button onClick={() => onDeleteTemplate(t.id)} className="text-readable-faint hover:text-rose-400 p-1" aria-label="Delete saved meal"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Create alias */}
        {templates.length > 0 && (
          <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3 space-y-2">
            <div className="text-[11px] text-readable-faint flex items-center gap-1.5"><Link2 size={12} /> Add an alias — type a phrase that loads a saved meal instantly (e.g. “my usual lunch”).</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input value={aliasPhrase} onChange={(e) => setAliasPhrase(e.target.value)} placeholder="my usual lunch" className={input} />
              <select value={aliasTemplate} onChange={(e) => setAliasTemplate(e.target.value)} className={input}>
                <option value="">Choose saved meal…</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button
                type="button"
                disabled={!aliasPhrase.trim() || !aliasTemplate}
                onClick={() => { onCreateAlias(aliasPhrase.trim(), aliasTemplate); setAliasPhrase(""); setAliasTemplate(""); }}
                className="rounded-lg bg-white/[0.06] border border-white/15 text-white px-3 py-2 text-sm hover:bg-white/[0.1] transition-colors disabled:opacity-40 shrink-0"
              >
                Add
              </button>
            </div>
            {aliases.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {aliases.map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border border-white/12 text-readable-soft">
                    “{a.phrase}”
                    <button onClick={() => onDeleteAlias(a.id)} className="text-readable-faint hover:text-rose-400" aria-label="Remove alias">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Saved foods */}
      <Section icon={Salad} title={`Saved foods (${savedFoods.length})`}>
        {savedFoods.length === 0 ? (
          <p className="text-xs text-readable-faint">Confirmed foods are remembered here automatically as you log meals.</p>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {savedFoods.map((f) => (
              <div key={f.id} className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white truncate">
                    {f.name}{f.preparation_state ? <span className="text-readable-faint"> · {f.preparation_state}</span> : ""}
                  </div>
                  <div className="text-[11px] text-readable-faint">
                    {f.basis === "per_100g"
                      ? `${Math.round(Number(f.calories_per_100g ?? 0))} kcal/100g`
                      : `${Math.round(Number(f.serving_calories ?? 0))} kcal/serving`}
                    {" · used "}{f.times_logged}×{f.verified ? " · verified" : ""}
                  </div>
                </div>
                <button onClick={() => onDeleteFood(f.id)} className="text-readable-faint hover:text-rose-400 p-1" aria-label="Delete saved food"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Download} title="Data">
        <a
          href="/api/nutrition/export"
          className="inline-flex items-center gap-2 rounded-lg border border-white/12 text-readable-soft px-4 py-2 text-sm hover:bg-white/[0.05] transition-colors w-fit"
        >
          <Download size={14} /> Export all data (JSON)
        </a>
      </Section>
    </div>
  );
}
