"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Droplets, Zap, Activity, Scale, Apple, Brain } from "lucide-react";

const topics = [
  {
    href: "/health/insulin",
    icon: Droplets,
    title: "Insulin & Insulin Resistance",
    description: "What insulin is, how it works, what causes resistance, and its link to Type 3 Diabetes and brain health.",
    tags: ["Metabolic Health", "Hormones", "Type 2 Diabetes", "Brain"],
    gradient: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/20 hover:border-amber-500/40",
    iconBg: "bg-amber-500/15 border-amber-500/25",
    iconColor: "text-amber-400",
    tagColor: "bg-amber-500/10 text-amber-300/80 border-amber-500/15",
    readTime: "8 min read",
  },
  {
    href: "/health/hair-loss",
    icon: Zap,
    title: "Hair Loss & DHT",
    description: "The science of androgenetic alopecia — DHT, finasteride, minoxidil, and combination protocols.",
    tags: ["DHT", "Finasteride", "Minoxidil", "5-AR"],
    gradient: "from-purple-500/20 to-violet-500/10",
    border: "border-purple-500/20 hover:border-purple-500/40",
    iconBg: "bg-purple-500/15 border-purple-500/25",
    iconColor: "text-purple-400",
    tagColor: "bg-purple-500/10 text-purple-300/80 border-purple-500/15",
    readTime: "7 min read",
  },
  {
    href: "/health/running",
    icon: Activity,
    title: "Running & Aerobic Training",
    description: "Zone 2, VO2 max, running form, and the science of building a durable aerobic engine.",
    tags: ["Zone 2", "VO2 Max", "Cardio", "Longevity"],
    gradient: "from-emerald-500/20 to-green-500/10",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/15 border-emerald-500/25",
    iconColor: "text-emerald-400",
    tagColor: "bg-emerald-500/10 text-emerald-300/80 border-emerald-500/15",
    readTime: "5 min read",
  },
  {
    href: "/health/weight-loss",
    icon: Scale,
    title: "Weight Loss",
    description: "Energy balance, visceral fat, protein's role, and a sustainable approach to body recomposition.",
    tags: ["Nutrition", "Calories", "Visceral Fat", "Protein"],
    gradient: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/20 hover:border-blue-500/40",
    iconBg: "bg-blue-500/15 border-blue-500/25",
    iconColor: "text-blue-400",
    tagColor: "bg-blue-500/10 text-blue-300/80 border-blue-500/15",
    readTime: "6 min read",
  },
  {
    href: "/health/brain",
    icon: Brain,
    title: "Brain Health",
    description: "Alzheimer's prevention, cognitive reserve, exercise protocols, APOE E4, what damages your brain, SSRIs, and the insulin-brain connection.",
    tags: ["Alzheimer's", "Cognitive Reserve", "SSRIs", "BDNF", "APOE E4"],
    gradient: "from-cyan-500/20 to-sky-500/10",
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    iconBg: "bg-cyan-500/15 border-cyan-500/25",
    iconColor: "text-cyan-400",
    tagColor: "bg-cyan-500/10 text-cyan-300/80 border-cyan-500/15",
    readTime: "18 min read",
  },
  {
    href: "/health/diet",
    icon: Apple,
    title: "Diet & Metabolic Health",
    description: "Protein, processed foods, food order, and how to eat for muscle, stable glucose, and long-range metabolic health.",
    tags: ["Protein", "Food Quality", "Glucose", "Satiety"],
    gradient: "from-teal-500/20 to-cyan-500/10",
    border: "border-teal-500/20 hover:border-teal-500/40",
    iconBg: "bg-teal-500/15 border-teal-500/25",
    iconColor: "text-teal-400",
    tagColor: "bg-teal-500/10 text-teal-300/80 border-teal-500/15",
    readTime: "9 min read",
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function HealthPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Back */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-readable-soft hover:text-readable-strong transition-colors mb-10"
        >
          <ArrowLeft size={14} /> Back to Hub
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <span className="text-lg">🫀</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Health</h1>
            <p className="text-sm text-readable-soft">Body, metabolism, and longevity</p>
          </div>
        </div>
        <p className="text-readable-soft max-w-xl mt-4 text-sm leading-relaxed">
          Deep dives into the topics I've obsessed over — backed by research, explained clearly,
          and organized so I can actually reference them.
        </p>
      </motion.div>

      {/* Topic Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {topics.map((topic) => {
          const Icon = topic.icon;
          return (
            <motion.div key={topic.href} variants={item}>
              <Link href={topic.href} className="group block h-full">
                <div
                  className={`glass rounded-2xl p-6 h-full border ${topic.border} transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl relative overflow-hidden`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${topic.gradient} opacity-50 pointer-events-none`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-xl border ${topic.iconBg}`}>
                        <Icon size={18} className={topic.iconColor} />
                      </div>
                      <span className="text-[10px] text-readable-faint font-medium">{topic.readTime}</span>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">{topic.title}</h3>
                    <p className="text-sm text-readable-soft leading-relaxed mb-4">{topic.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {topic.tags.map((tag) => (
                        <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full border ${topic.tagColor}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-readable-faint group-hover:text-readable-muted transition-colors">
                      Read more <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
