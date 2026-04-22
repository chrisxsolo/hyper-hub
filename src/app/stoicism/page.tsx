"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Compass,
  Leaf,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

const introChips = [
  "Founded in Athens around 300 BCE",
  "Practical philosophy, not abstract theory",
  "Built for pressure, uncertainty, and loss",
  "Still echoed in CBT and modern psychology",
];

const principles = [
  {
    icon: Brain,
    title: "Train your judgments",
    description:
      "Stoicism teaches that events hit us once, then our interpretation hits us again. The work is learning to notice the second blow.",
    accent: "from-amber-500/14 via-amber-500/6 to-transparent",
    border: "border-amber-500/20",
    iconClass: "text-amber-300",
  },
  {
    icon: Shield,
    title: "Treat virtue as the goal",
    description:
      "The Stoic measure of a good life is character: wisdom, courage, justice, and self-command, even when outcomes go sideways.",
    accent: "from-sky-500/14 via-sky-500/6 to-transparent",
    border: "border-sky-500/20",
    iconClass: "text-sky-300",
  },
  {
    icon: Leaf,
    title: "Live according to nature",
    description:
      "That means accepting change, limits, mortality, and the fact that humans are rational, social, embodied creatures.",
    accent: "from-emerald-500/14 via-emerald-500/6 to-transparent",
    border: "border-emerald-500/20",
    iconClass: "text-emerald-300",
  },
  {
    icon: Activity,
    title: "Practice it daily",
    description:
      "Stoicism is a training discipline: reflection, journaling, rehearsal of adversity, and returning attention to what you can actually do now.",
    accent: "from-rose-500/14 via-rose-500/6 to-transparent",
    border: "border-rose-500/20",
    iconClass: "text-rose-300",
  },
];

const founders = [
  {
    name: "Zeno of Citium",
    years: "334-262 BCE",
    role: "Founder",
    description:
      "Zeno began teaching in Athens near the Stoa Poikile, the painted porch that gave Stoicism its name. He framed philosophy as a way to live well, not just argue well.",
    accent: "from-amber-500/18 via-amber-500/8 to-transparent",
    border: "border-amber-500/20",
    marker: "01",
  },
  {
    name: "Cleanthes",
    years: "330-230 BCE",
    role: "Keeper of the school",
    description:
      "Cleanthes preserved and deepened the early school. He emphasized endurance, reverence for order, and the idea that humans flourish when they align with the larger pattern of nature.",
    accent: "from-orange-500/16 via-orange-500/8 to-transparent",
    border: "border-orange-500/20",
    marker: "02",
  },
  {
    name: "Chrysippus",
    years: "279-206 BCE",
    role: "System builder",
    description:
      "Chrysippus turned Stoicism into a real philosophical system by sharpening its logic, ethics, and psychology. Ancient writers joked that without him there would be no Stoicism.",
    accent: "from-cyan-500/16 via-cyan-500/8 to-transparent",
    border: "border-cyan-500/20",
    marker: "03",
  },
];

const romanStoics = [
  {
    name: "Seneca",
    years: "4 BCE-65 CE",
    description:
      "Brought Stoicism into politics, wealth, grief, and daily conduct. His letters make the philosophy feel conversational and human.",
  },
  {
    name: "Epictetus",
    years: "50-135 CE",
    description:
      "Made the distinction between what is up to you and what is not painfully clear. His teaching lands close to modern ideas of agency and appraisal.",
  },
  {
    name: "Marcus Aurelius",
    years: "121-180 CE",
    description:
      "Turned Stoicism into a private discipline under real pressure. Meditations reads like a ruler coaching his own mind back into alignment.",
  },
];

const responseLoop = [
  {
    step: "1. Event",
    title: "Something happens",
    body: "Criticism, illness, delay, rejection, bad luck. The outside world does what it does.",
    bar: "bg-gradient-to-r from-amber-400 to-orange-300",
  },
  {
    step: "2. Appraisal",
    title: "The mind assigns meaning",
    body: "Is this danger, insult, failure, inconvenience, or simply reality? Stoicism starts working here.",
    bar: "bg-gradient-to-r from-sky-400 to-cyan-300",
  },
  {
    step: "3. Body",
    title: "Your biology reacts",
    body: "Breath shortens, attention narrows, muscles tense. Psychology and physiology move together.",
    bar: "bg-gradient-to-r from-emerald-400 to-lime-300",
  },
  {
    step: "4. Choice",
    title: "Character answers back",
    body: "Pause, reframe, and act by values instead of impulse. That is the Stoic move.",
    bar: "bg-gradient-to-r from-rose-400 to-amber-300",
  },
];

const therapyParallels = [
  {
    stoic: "Impression",
    therapy: "Automatic thought",
    description:
      "Both begin by noticing that a fast interpretation appears before you have really examined it. The skill is seeing the thought instead of instantly obeying it.",
    accent: "border-sky-500/18",
  },
  {
    stoic: "Examine the judgment",
    therapy: "Cognitive restructuring",
    description:
      "The Stoic asks, 'Is this actually true, useful, and within my control?' Cognitive therapy asks whether the thought is distorted, exaggerated, or incomplete.",
    accent: "border-amber-500/18",
  },
  {
    stoic: "Premeditation of adversity",
    therapy: "Coping rehearsal",
    description:
      "Both rehearse difficulty ahead of time so the nervous system is less shocked when life gets rough. Preparation softens panic.",
    accent: "border-emerald-500/18",
  },
  {
    stoic: "Evening review",
    therapy: "Thought record",
    description:
      "Writing down the event, the judgment, and the response turns a vague mood into something visible, workable, and easier to improve tomorrow.",
    accent: "border-rose-500/18",
  },
];

const bridges = [
  {
    icon: Brain,
    title: "Stoicism and psychology",
    description:
      "Stoicism stays useful because it treats attention, interpretation, and self-command as trainable. Modern psychology often reaches the same terrain through a clinical lens rather than a philosophical one.",
    points: [
      "Attention training: what you dwell on changes what grows louder in the mind.",
      "Cognitive reappraisal: changing meaning often changes emotion.",
      "Journaling and self-examination: naming a thought makes it easier to question.",
    ],
    accent: "border-sky-500/20",
    iconClass: "text-sky-300",
  },
  {
    icon: Activity,
    title: "Stoicism and biology",
    description:
      "The philosophy is not a biology textbook, but it fits a creature whose nervous system responds to prediction, repetition, sleep, pain, hunger, and social stress. Stoicism works best when it respects embodiment instead of pretending willpower floats above it.",
    points: [
      "Appraisal shapes stress: what you think is happening changes how your body mobilizes.",
      "Repetition rewires defaults: practiced responses become easier to access under pressure.",
      "State matters: fatigue and overload make wisdom harder, so self-command includes caring for the organism.",
    ],
    accent: "border-emerald-500/20",
    iconClass: "text-emerald-300",
  },
  {
    icon: Users,
    title: "Stoicism and human nature",
    description:
      "Stoics saw people as social beings made for cooperation. That maps well to modern views of humans as relational animals whose identity, threat response, and health are shaped by community.",
    points: [
      "Justice is not optional; it is part of what a healthy human life is.",
      "Service stabilizes the self by turning attention outward.",
      "Isolation magnifies fear, ego, and distorted judgment.",
    ],
    accent: "border-amber-500/20",
    iconClass: "text-amber-300",
  },
];

const studyCards = [
  {
    title: "Marcus Aurelius",
    eyebrow: "Study card",
    description: "Meet the Roman emperor who used Stoicism as daily mental training under pressure, war, illness, and power.",
    href: "/stoicism/meditations",
    icon: "👑",
    accent: "border-amber-500/18 hover:border-amber-400/28",
    glow: "from-amber-500/10 via-amber-500/4 to-transparent",
  },
  {
    title: "Meditations Summaries",
    eyebrow: "Already in the project",
    description: "Jump into the summaries and breakdowns we already built for Marcus's private journal and Stoic system.",
    href: "/stoicism/meditations",
    icon: "📜",
    accent: "border-sky-500/18 hover:border-sky-400/28",
    glow: "from-sky-500/10 via-sky-500/4 to-transparent",
  },
  {
    title: "Book I and II Breakdown",
    eyebrow: "Quick review",
    description: "Start with gratitude, modeled virtue, control, and mortality — the clearest summaries we have established so far.",
    href: "/stoicism/meditations",
    icon: "🧠",
    accent: "border-emerald-500/18 hover:border-emerald-400/28",
    glow: "from-emerald-500/10 via-emerald-500/4 to-transparent",
  },
];

export default function StoicismPage() {
  const reducedMotion = useReducedMotion();
  const easeOut = [0.22, 1, 0.36, 1] as const;
  const easeInOut = [0.42, 0, 0.58, 1] as const;

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: reducedMotion ? 0 : 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: easeOut },
  });

  const stagger = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.08,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOut } },
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-14">
      <motion.div {...fadeUp(0)}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/45 hover:text-white/75 transition-colors mb-10"
        >
          <ArrowLeft size={14} /> Back to Hub
        </Link>
      </motion.div>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] items-start mb-8 md:mb-12">
        <motion.div {...fadeUp(0.05)} className="space-y-6">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 border border-amber-500/15">
            <Sparkles size={12} className="text-amber-300" />
            <span className="text-xs font-medium tracking-wide text-white/60">Ancient philosophy for modern pressure</span>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl glass border border-amber-500/20 flex items-center justify-center bg-gradient-to-br from-amber-500/12 to-transparent">
                <Compass size={24} className="text-amber-300" />
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">Stoicism</h1>
                <p className="text-sm text-white/45 mt-1">A practical philosophy for attention, resilience, and character.</p>
              </div>
            </div>

            <p className="text-base sm:text-lg text-white/72 leading-relaxed max-w-2xl mb-4">
              Stoicism is a school of philosophy that asks a simple question: <span className="text-white font-medium">what kind
              of person should you be when life gets hard?</span> It began in ancient Greece, but it still feels current because it
              focuses on judgment, self-command, mortality, uncertainty, and how to act well when the world does not cooperate.
            </p>

            <p className="text-sm text-white/50 leading-relaxed max-w-2xl">
              The name comes from the <span className="text-white/80">Stoa Poikile</span>, the painted porch in Athens where Zeno
              taught. At its best, Stoicism is not emotional numbness and it is not passivity. It is training: learning to see clearly,
              regulate reaction, and choose a steady response that matches your values.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {introChips.map((chip) => (
              <span
                key={chip}
                className="text-xs px-3 py-1 rounded-full border border-white/10 bg-white/4 text-white/45"
              >
                {chip}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          {...fadeUp(0.12)}
          className="relative overflow-hidden rounded-[28px] border border-amber-500/15 glass p-6 sm:p-7 min-h-[420px]"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at top, rgba(245, 158, 11, 0.18), transparent 34%), radial-gradient(circle at 80% 30%, rgba(56, 189, 248, 0.12), transparent 22%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(13,13,15,0.16))",
            }}
          />

          <motion.div
            aria-hidden
            className="absolute right-8 top-8 h-40 w-40 rounded-full border border-white/8"
            animate={reducedMotion ? undefined : { rotate: [0, 10, 0], scale: [1, 1.04, 1] }}
            transition={reducedMotion ? undefined : { duration: 14, repeat: Infinity, ease: easeInOut }}
          />
          <motion.div
            aria-hidden
            className="absolute right-14 top-14 h-28 w-28 rounded-full border border-amber-400/12"
            animate={reducedMotion ? undefined : { rotate: [0, -16, 0], scale: [1, 0.96, 1] }}
            transition={reducedMotion ? undefined : { duration: 12, repeat: Infinity, ease: easeInOut }}
          />
          <motion.div
            aria-hidden
            className="absolute left-6 bottom-8 h-24 w-24 rounded-full bg-emerald-400/8 blur-2xl"
            animate={reducedMotion ? undefined : { y: [0, -10, 0], x: [0, 6, 0] }}
            transition={reducedMotion ? undefined : { duration: 10, repeat: Infinity, ease: easeInOut }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-sky-300" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Stoic response loop</p>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Where Stoicism meets psychology and biology</h2>
            <p className="text-sm text-white/52 leading-relaxed max-w-lg mb-5">
              The philosophy becomes useful in the gap between stimulus and reaction. It does not erase the body. It trains the meaning
              you add to an event so your next action is less hijacked by panic, ego, or habit.
            </p>

            <div className="space-y-3">
              {responseLoop.map((entry, index) => (
                <motion.div
                  key={entry.step}
                  initial={{ opacity: 0, x: reducedMotion ? 0 : 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.2 + index * 0.08, ease: easeOut }}
                  className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{entry.step}</p>
                    <div className="w-24 h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${entry.bar}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.5, delay: 0.35 + index * 0.1, ease: easeOut }}
                        style={{ originX: 0 }}
                      />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white mb-1">{entry.title}</p>
                  <p className="text-xs text-white/42 leading-relaxed">{entry.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <motion.section {...fadeUp(0.16)} className="mb-8 md:mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={15} className="text-amber-300" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">What Stoicism is</p>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <motion.div
                key={principle.title}
                variants={item}
                className={`rounded-2xl border ${principle.border} glass p-5 bg-gradient-to-br ${principle.accent}`}
              >
                <div className="w-10 h-10 rounded-2xl border border-white/8 bg-white/5 flex items-center justify-center mb-4">
                  <Icon size={18} className={principle.iconClass} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{principle.title}</h3>
                <p className="text-sm text-white/48 leading-relaxed">{principle.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      <motion.section {...fadeUp(0.2)} className="mb-8 md:mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Compass size={15} className="text-orange-300" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Founders and lineage</p>
        </div>

        <div className="glass rounded-[28px] border border-white/8 p-6 sm:p-7 overflow-hidden relative">
          <div
            className="absolute inset-x-6 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.5), transparent)" }}
          />

          <div className="mb-6 max-w-3xl">
            <h2 className="text-2xl font-semibold text-white mb-2">Built in Athens, carried into Rome</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              Stoicism starts with three Greek founders, then gets translated into Roman letters, lectures, and journals. The core
              question stays the same: how do you become difficult to break without becoming hard, cold, or unjust?
            </p>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6"
          >
            {founders.map((founder) => (
              <motion.div
                key={founder.name}
                variants={item}
                className={`rounded-2xl border ${founder.border} bg-gradient-to-br ${founder.accent} p-5`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/38 mb-1">{founder.role}</p>
                    <h3 className="text-lg font-semibold text-white">{founder.name}</h3>
                    <p className="text-xs text-white/40 mt-1">{founder.years}</p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl border border-white/10 bg-black/12 flex items-center justify-center text-sm font-medium text-white/70">
                    {founder.marker}
                  </div>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">{founder.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={15} className="text-sky-300" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/38">Roman Stoics who made it personal</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {romanStoics.map((teacher, index) => (
                <motion.div
                  key={teacher.name}
                  initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.3 + index * 0.08, ease: easeOut }}
                  className="rounded-2xl border border-white/8 bg-black/8 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-white">{teacher.name}</h3>
                    <span className="text-[11px] text-white/30">{teacher.years}</span>
                  </div>
                  <p className="text-sm text-white/45 leading-relaxed">{teacher.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...fadeUp(0.24)} className="mb-8 md:mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={15} className="text-sky-300" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Stoicism and cognitive therapy</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.96fr_1.04fr] gap-4">
          <div className="glass rounded-[28px] border border-sky-500/15 p-6 sm:p-7 relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 36%), linear-gradient(180deg, rgba(255,255,255,0.015), rgba(13,13,15,0.08))",
              }}
            />

            <div className="relative z-10">
              <h2 className="text-2xl font-semibold text-white mb-3">Why therapy keeps rediscovering the Stoics</h2>
              <p className="text-sm text-white/52 leading-relaxed mb-4">
                Modern cognitive therapy is not the same thing as Stoicism, but they share a deep structural insight:
                <span className="text-white/78"> the mind's interpretation sits between the event and the feeling.</span>
                The Stoics trained that insight as philosophy. Cognitive therapy trains it as a clinical method.
              </p>
              <p className="text-sm text-white/52 leading-relaxed mb-4">
                Albert Ellis spoke openly about the influence of Epictetus when shaping rational emotive behavior therapy.
                CBT later carried forward the same practical move: notice the thought, test it, and replace blind reaction with a more grounded response.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/30 mb-2">Shared core</p>
                  <p className="text-sm text-white/55 leading-relaxed">
                    Thoughts are not commands. They can be examined, reframed, and practiced into better patterns.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/30 mb-2">Important difference</p>
                  <p className="text-sm text-white/55 leading-relaxed">
                    CBT aims at symptom relief and functioning. Stoicism also asks what kind of person you are becoming while you suffer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {therapyParallels.map((parallel) => (
              <motion.div
                key={parallel.stoic}
                variants={item}
                className={`glass rounded-2xl border ${parallel.accent} p-5`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/80 mb-1">Stoic move</p>
                    <h3 className="text-sm font-semibold text-white">{parallel.stoic}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-sky-300/80 mb-1">Therapy parallel</p>
                    <p className="text-sm font-semibold text-white">{parallel.therapy}</p>
                  </div>
                </div>
                <p className="text-sm text-white/46 leading-relaxed">{parallel.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section {...fadeUp(0.28)} className="mb-8 md:mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={15} className="text-emerald-300" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Why it still feels modern</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-4">
          <div className="glass rounded-[28px] border border-emerald-500/15 p-6 sm:p-7">
            <h2 className="text-2xl font-semibold text-white mb-3">A philosophy that survives contact with real life</h2>
            <p className="text-sm text-white/52 leading-relaxed mb-4">
              Stoicism stays relevant because it does not depend on perfect circumstances. It assumes grief, ego, envy, uncertainty,
              bodily stress, and social pressure are normal features of human life. The question is not whether you feel those forces.
              The question is whether they get the final vote.
            </p>
            <p className="text-sm text-white/52 leading-relaxed">
              That is why the philosophy overlaps so naturally with current conversations about mental resilience, emotional regulation,
              stress physiology, and deliberate practice. It gives a language for agency without denying that humans are vulnerable,
              finite, and deeply embodied.
            </p>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4"
          >
            {bridges.map((bridge) => {
              const Icon = bridge.icon;
              return (
                <motion.div
                  key={bridge.title}
                  variants={item}
                  className={`glass rounded-2xl border ${bridge.accent} p-5`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl border border-white/8 bg-white/5 flex items-center justify-center shrink-0">
                      <Icon size={18} className={bridge.iconClass} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{bridge.title}</h3>
                      <p className="text-sm text-white/48 leading-relaxed mt-1">{bridge.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {bridge.points.map((point) => (
                      <div key={point} className="flex items-start gap-2 text-sm text-white/42">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/22 shrink-0" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      <motion.section {...fadeUp(0.32)} className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-4">
        <Link
          href="/stoicism/meditations"
          className="group glass rounded-[28px] border border-amber-500/18 p-6 sm:p-7 bg-gradient-to-br from-amber-500/10 via-amber-500/4 to-transparent hover:border-amber-400/28 transition-all duration-300"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80 mb-2">Read next</p>
              <h2 className="text-2xl font-semibold text-white mb-2">Meditations</h2>
              <p className="text-sm text-white/50 leading-relaxed max-w-lg">
                Marcus Aurelius is the easiest place to feel Stoicism as a lived practice: self-correction, mortality, discipline,
                attention, and keeping a clear head while the world stays messy.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl border border-amber-400/15 bg-black/12 flex items-center justify-center text-xl shrink-0">
              📜
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/60 group-hover:text-white/78 transition-colors">
            Explore Marcus Aurelius
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
          {studyCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.38 + index * 0.08, ease: easeOut }}
            >
              <Link
                href={card.href}
                className={`group block glass rounded-2xl border ${card.accent} p-5 bg-gradient-to-br ${card.glow} transition-all duration-300 hover:-translate-y-0.5`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/30 mb-2">{card.eyebrow}</p>
                    <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                  </div>
                  <span className="text-xl shrink-0">{card.icon}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed mb-3">{card.description}</p>
                <div className="flex items-center gap-2 text-xs text-white/55 group-hover:text-white/75 transition-colors">
                  Open study card
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
