"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

const virtues = [
  "Patience", "Self-Control", "Humility", "Rationality",
  "Simplicity", "Endurance", "Restraint", "Indifference to praise",
];

const inControl = ["Judgments", "Intentions", "Actions", "Responses", "Effort"];
const outOfControl = ["Other people", "Outcomes", "Reputation", "Death", "Past events"];

const ontologyLayers = [
  { label: "Physics",    desc: "Everything is change — matter is always in flux",       color: "from-violet-500/15 to-transparent", border: "border-violet-500/20", text: "text-violet-400" },
  { label: "Biology",   desc: "You are a temporary organism",                            color: "from-blue-500/15 to-transparent",   border: "border-blue-500/20",   text: "text-blue-400"   },
  { label: "Psychology",desc: "Your mind interprets reality",                            color: "from-cyan-500/15 to-transparent",   border: "border-cyan-500/20",   text: "text-cyan-400"   },
  { label: "Ethics",    desc: "Only your judgments matter — this is the only domain",   color: "from-emerald-500/15 to-transparent",border: "border-emerald-500/20",text: "text-emerald-400"},
];

const bookTwoConcepts = [
  { icon: "🌅", title: "Morning Anticipation", body: "Prime yourself each morning to expect difficult people. Not pessimism — predictive modeling. Calibrated expectations eliminate reactive anger before it starts." },
  { icon: "♾️", title: "Material Impermanence", body: "Everything dissolves. Alexander the Great and his mule-driver ended up in the same place. Individuals are temporary configurations of matter." },
  { icon: "🌊", title: "Death as Transformation", body: "Not an evil — a return of elements. No annihilation, only change of form. Fear of death is a misunderstanding of natural law." },
  { icon: "◉", title: "The Present Moment", body: "Past is inaccessible. Future is probabilistic. Present is the only place rational agency exists. This is not poetic — it's a functional constraint." },
];

export default function MeditationsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* Back */}
      <motion.div {...fadeUp(0)}>
        <Link
          href="/stoicism"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-10"
        >
          <ArrowLeft size={14} /> Back to Stoicism
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div {...fadeUp(0.05)} className="mb-10">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl glass border border-blue-500/25 flex items-center justify-center text-2xl shrink-0">
            📜
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-3xl font-bold text-white tracking-tight">Meditations</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400 font-medium">
                Marcus Aurelius
              </span>
            </div>
            <p className="text-sm text-white/35">161–180 AD · Written in Greek · Never meant for publication</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {["12 Books", "Private journal", "Stoic practice", "Dichotomy of Control", "Cognitive sovereignty"].map((tag) => (
            <span key={tag} className="text-xs px-3 py-1 rounded-full glass border border-white/8 text-white/40">
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Overview */}
      <motion.div
        {...fadeUp(0.1)}
        className="glass rounded-2xl p-6 border border-blue-500/15 bg-gradient-to-br from-blue-500/8 to-transparent mb-5"
      >
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">What is Meditations?</p>
        <p className="text-sm text-white/65 leading-relaxed mb-3">
          Not a philosophy textbook. Not written to persuade. Meditations is the private journal of a Roman Emperor —
          <span className="text-white/85 font-medium"> cognitive training exercises</span> recorded under extreme pressure:
          managing an empire, commanding armies, navigating plague and corrupt power.
        </p>
        <p className="text-sm text-white/45 leading-relaxed">
          Each entry is less a "chapter" and more a daily rep for the mind. Marcus wrote in Greek — his private language,
          away from official Latin culture. His goal was not wisdom for others. It was maintaining psychological sovereignty for himself.
        </p>
      </motion.div>

      {/* ── BOOK I ─────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.15)} className="glass rounded-2xl border border-white/8 overflow-hidden mb-5">

        <div className="px-6 pt-6 pb-4 border-b border-white/5 bg-gradient-to-r from-amber-500/8 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-400 uppercase tracking-wide">
              Book I
            </span>
            <span className="text-xs text-white/25">of 12</span>
          </div>
          <h2 className="text-base font-bold text-white">Moral Genealogy as Ethical Construction</h2>
          <p className="text-xs text-amber-300/40 mt-1 italic">Character is built through modeled influence, not abstract reasoning.</p>
        </div>

        <div className="p-6 space-y-5">

          {/* Core insight callout */}
          <div className="rounded-xl bg-amber-500/8 border border-amber-500/15 p-4">
            <p className="text-xs font-semibold text-amber-400 mb-2">Core Insight</p>
            <p className="text-sm text-white/60 leading-relaxed">
              Book I is a catalog of gratitude — Marcus lists 17 mentors and extracts specific virtues from each.
              He doesn't begin with metaphysics or logic. He begins with <span className="text-white/85 font-medium">example-based ethics</span>:
              virtue is learned through imitation. You become the statistical average of your influences.
            </p>
          </div>

          {/* Virtue chips */}
          <div>
            <p className="text-xs text-white/25 uppercase tracking-wider mb-3">
              Virtues he catalogued — not "goodness" in the abstract, but specific trainable traits
            </p>
            <div className="flex flex-wrap gap-2">
              {virtues.map((v, i) => (
                <motion.span
                  key={v}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.055, type: "spring", stiffness: 200 }}
                  className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300/75 font-medium"
                >
                  {v}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/3 border border-white/8 p-4">
              <p className="text-xs font-semibold text-white/55 mb-2">Privilege Awareness</p>
              <p className="text-xs text-white/35 leading-relaxed">
                Marcus openly acknowledges good family, good teachers, stable upbringing. Rare for a ruler.
                The Stoic position: external fortune is morally irrelevant — but it shapes your starting conditions.
                He doesn't pretend otherwise.
              </p>
            </div>
            <div className="rounded-xl bg-white/3 border border-white/8 p-4">
              <p className="text-xs font-semibold text-white/55 mb-2">Identity Construction</p>
              <p className="text-xs text-white/35 leading-relaxed">
                Book I isn't just gratitude — it's <span className="text-white/65">cognitive programming</span>.
                Marcus selects traits, reinforces them, internalizes a moral blueprint.
                He decides who he will be by choosing what to remember and honor.
              </p>
            </div>
          </div>

        </div>
      </motion.div>

      {/* ── BOOK II ────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.2)} className="glass rounded-2xl border border-white/8 overflow-hidden mb-5">

        <div className="px-6 pt-6 pb-4 border-b border-white/5 bg-gradient-to-r from-blue-500/8 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/25 text-blue-400 uppercase tracking-wide">
              Book II
            </span>
            <span className="text-xs text-white/25">of 12</span>
          </div>
          <h2 className="text-base font-bold text-white">Ontology of Control and Mortality</h2>
          <p className="text-xs text-blue-300/40 mt-1 italic">You control your mind. Everything else is transient, chaotic, and indifferent.</p>
        </div>

        <div className="p-6 space-y-5">

          {/* Dichotomy of Control — split visual */}
          <div>
            <p className="text-xs text-white/25 uppercase tracking-wider mb-3">The Dichotomy of Control — Stoicism's central doctrine</p>
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.38, duration: 0.4 }}
                className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs text-emerald-400 font-bold">
                    ✓
                  </div>
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Yours</p>
                </div>
                <div className="space-y-2">
                  {inControl.map((item) => (
                    <p key={item} className="text-xs text-emerald-300/65 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-emerald-400/50 shrink-0" />
                      {item}
                    </p>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.38, duration: 0.4 }}
                className="rounded-xl bg-white/3 border border-white/8 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-white/8 border border-white/12 flex items-center justify-center text-xs text-white/30 font-bold">
                    ✗
                  </div>
                  <p className="text-xs font-bold text-white/30 uppercase tracking-wide">Not Yours</p>
                </div>
                <div className="space-y-2">
                  {outOfControl.map((item) => (
                    <p key={item} className="text-xs text-white/28 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-white/15 shrink-0" />
                      {item}
                    </p>
                  ))}
                </div>
              </motion.div>
            </div>
            <p className="text-xs text-white/20 mt-2.5 text-center">
              Suffering = misclassifying "Not Yours" as "Yours"
            </p>
          </div>

          {/* 4 concept cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bookTwoConcepts.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 + i * 0.07 }}
                className="rounded-xl bg-white/3 border border-white/8 p-4 hover:border-white/14 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{c.icon}</span>
                  <p className="text-xs font-semibold text-white/65">{c.title}</p>
                </div>
                <p className="text-xs text-white/35 leading-relaxed">{c.body}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </motion.div>

      {/* ── SYNTHESIS ──────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.25)} className="glass rounded-2xl border border-white/8 overflow-hidden mb-5">

        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <p className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-1">Synthesis</p>
          <h2 className="text-base font-bold text-white">The Stoic System Emerging</h2>
        </div>

        <div className="p-6 space-y-5">

          {/* Ontological layers — stacked */}
          <div>
            <p className="text-xs text-white/25 uppercase tracking-wider mb-3">
              Marcus' view of reality — layer by layer
            </p>
            <div className="space-y-2">
              {ontologyLayers.map((layer, i) => (
                <motion.div
                  key={layer.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.08 }}
                  className={`flex items-center gap-4 rounded-xl bg-gradient-to-r ${layer.color} border ${layer.border} px-4 py-3`}
                >
                  <span className={`text-xs font-bold uppercase tracking-wider ${layer.text} w-24 shrink-0`}>
                    {layer.label}
                  </span>
                  <span className="text-xs text-white/45">{layer.desc}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 3-step system */}
          <div className="rounded-xl bg-white/3 border border-white/8 p-4">
            <p className="text-xs font-semibold text-white/45 mb-3">The Three-Layer Stoic System</p>
            <div className="space-y-3">
              {[
                { n: "1", premise: "You are shaped by others", action: "choose your influences deliberately" },
                { n: "2", premise: "Reality is unstable and indifferent", action: "stop expecting control over outcomes" },
                { n: "3", premise: "Your mind is your only domain", action: "train it rigorously, every day" },
              ].map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/20 text-xs text-blue-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.n}
                  </span>
                  <p className="text-xs text-white/45 leading-relaxed">
                    {s.premise}
                    <span className="text-white/25"> → </span>
                    <span className="text-blue-400/60 italic">{s.action}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Core statement */}
          <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 p-6 text-center">
            <p className="text-sm text-white/55 leading-loose italic">
              "Everything outside your mind is unstable.{" "}
              People will disappoint you. You will die.
            </p>
            <p className="text-base text-white/90 font-semibold mt-1">
              Discipline your thoughts — or suffer unnecessarily.
            </p>
            <p className="text-xs text-white/22 mt-3">
              He wasn't writing philosophy for discussion. He was writing instructions for psychological survival
              as the most powerful man in the Western world.
            </p>
          </div>

        </div>
      </motion.div>

      {/* Books III–XII coming soon */}
      <motion.div
        {...fadeUp(0.3)}
        className="glass rounded-xl border border-white/5 p-5 flex items-center gap-4"
      >
        <div className="w-8 h-8 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center shrink-0">
          <BookOpen size={14} className="text-white/25" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white/35">Books III–XII</p>
          <p className="text-xs text-white/22 mt-0.5">
            Breakdowns coming as the reading continues — time, reason in society, self and cosmos, acting rightly without the world's cooperation.
          </p>
        </div>
        <a
          href="https://www.gutenberg.org/ebooks/2680"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-white/25 hover:text-white/55 transition-colors shrink-0"
        >
          Read free <ExternalLink size={11} />
        </a>
      </motion.div>

    </div>
  );
}
