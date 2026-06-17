"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Mic, MicOff } from "lucide-react";
import { MEAL_TYPES, type MealType } from "@/lib/nutrition/types";
import { MEAL_TYPE_META } from "@/lib/nutrition/db";

export const DRAFT_KEY = "nutrition:draft";

const PLACEHOLDER =
  "Lunch: 2 eggs, 1 cup cooked rice, 175 g chicken breast, and 1 cup mixed vegetables";

const EXAMPLES = [
  "A 4x4 from In-N-Out",
  "Half a large pepperoni pizza",
  "285 g chicken breast, one cup of rice, a cup of vegetables",
  "Two eggs and 250 g of gold potatoes",
  "A handful of almonds and a medium apple",
];

// Minimal typing for the Web Speech API (not in lib.dom for all targets).
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export default function MealLogger({
  defaultDate,
  busy,
  onAnalyze,
}: {
  defaultDate: string;
  busy: boolean;
  onAnalyze: (input: {
    text: string;
    mealType: MealType;
    date: string;
    time: string;
  }) => void;
}) {
  const [text, setText] = useState("");
  const [mealType, setMealType] = useState<MealType>("lunch");
  // The log date follows the day you're viewing until you explicitly override it.
  const [dateOverride, setDateOverride] = useState<string | null>(null);
  const date = dateOverride ?? defaultDate;
  const [time, setTime] = useState("");
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  // Recover an unsaved draft after mount (kept across failures / reloads).
  useEffect(() => {
    try {
      const d = localStorage.getItem(DRAFT_KEY);
      if (d) setText(d);
    } catch {
      /* ignore */
    }
  }, []);
  // Persist the draft so a failed request or accidental reload never erases it.
  useEffect(() => {
    try {
      if (text) localStorage.setItem(DRAFT_KEY, text);
      else localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }, [text]);

  // Feature-detect the Web Speech API after mount (client-only; avoids a
  // hydration mismatch from probing `window` during render).
  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (Ctor) {
      setMicSupported(true);
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (e) => {
        const transcript = Array.from({ length: e.results.length })
          .map((_, i) => e.results[i][0].transcript)
          .join(" ");
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recRef.current = rec;
    }
  }, []);

  function toggleMic() {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      try {
        rec.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  }

  function submit() {
    if (!text.trim() || busy) return;
    onAnalyze({ text: text.trim(), mealType, date, time });
    setDateOverride(null); // resume following the viewed day
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl border border-emerald-500/20 p-5 bg-gradient-to-br from-emerald-500/[0.07] to-transparent"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-emerald-400" />
        <h2 className="text-sm font-semibold text-white">Log a meal</h2>
        <span className="text-xs text-readable-faint">— just describe it</span>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
          }}
          rows={3}
          placeholder={PLACEHOLDER}
          className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40 transition-colors resize-none pr-12"
        />
        {micSupported && (
          <button
            type="button"
            onClick={toggleMic}
            aria-label={listening ? "Stop dictation" : "Dictate meal"}
            className={`absolute right-3 top-3 p-1.5 rounded-lg border transition-colors ${
              listening
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse"
                : "bg-white/[0.04] border-white/10 text-readable-faint hover:text-white"
            }`}
          >
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
        )}
      </div>

      {/* Example chips */}
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setText(ex)}
            className="text-[11px] px-2 py-1 rounded-full border border-white/10 text-readable-faint hover:text-white hover:border-white/25 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Meal type chips */}
      <div className="flex flex-wrap gap-1.5 mt-4">
        {MEAL_TYPES.map((mt) => {
          const meta = MEAL_TYPE_META[mt];
          const active = mealType === mt;
          return (
            <button
              key={mt}
              type="button"
              onClick={() => setMealType(mt)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                active
                  ? "text-white"
                  : "text-readable-soft border-white/10 hover:bg-white/[0.05]"
              }`}
              style={
                active
                  ? { background: `${meta.color}26`, borderColor: `${meta.color}66` }
                  : undefined
              }
            >
              <span>{meta.emoji}</span>
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Date / time / analyze */}
      <div className="flex flex-wrap items-end gap-3 mt-4">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-readable-faint">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDateOverride(e.target.value)}
            className="rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/40 [color-scheme:dark]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-readable-faint">Time (optional)</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/40"
          />
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={busy || !text.trim()}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-100 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {busy ? "Analyzing…" : "Analyze meal"}
        </button>
      </div>
    </motion.div>
  );
}
