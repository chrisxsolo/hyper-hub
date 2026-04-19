"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Dumbbell, Camera, Brain, ArrowRight, Sparkles } from "lucide-react";

const categories = [
  {
    href: "/health",
    icon: Dumbbell,
    title: "Health",
    description: "Insulin resistance, hair loss, running, and fat loss — the science behind your body.",
    topics: ["Insulin Resistance", "Hair Loss & DHT", "Running", "Weight Loss"],
    gradient: "from-amber-500/25 via-orange-500/10 to-transparent",
    border: "border-amber-500/20 hover:border-amber-500/40",
    glow: "group-hover:shadow-amber-500/10",
    iconBg: "bg-amber-500/15 border-amber-500/25",
    iconColor: "text-amber-400",
    tagColor: "bg-amber-500/10 text-amber-300/80 border-amber-500/15",
    badge: "4 topics",
  },
  {
    href: "/photography",
    icon: Camera,
    title: "Photography",
    description: "Composition, light, and the craft of capturing moments that last forever.",
    topics: ["Composition", "Light Theory", "Gear Notes", "Post-Processing"],
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    border: "border-violet-500/20 hover:border-violet-500/40",
    glow: "group-hover:shadow-violet-500/10",
    iconBg: "bg-violet-500/15 border-violet-500/25",
    iconColor: "text-violet-400",
    tagColor: "bg-violet-500/10 text-violet-300/80 border-violet-500/15",
    badge: "Coming soon",
  },
  {
    href: "/stoicism",
    icon: Brain,
    title: "Stoicism",
    description: "Ancient wisdom for modern life — control, resilience, and living deliberately.",
    topics: ["Core Principles", "Marcus Aurelius", "Daily Practice", "Memento Mori"],
    gradient: "from-blue-500/20 via-sky-500/10 to-transparent",
    border: "border-blue-500/20 hover:border-blue-500/40",
    glow: "group-hover:shadow-blue-500/10",
    iconBg: "bg-blue-500/15 border-blue-500/25",
    iconColor: "text-blue-400",
    tagColor: "bg-blue-500/10 text-blue-300/80 border-blue-500/15",
    badge: "Coming soon",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardAnim = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8 border-white/10"
        >
          <Sparkles size={12} className="text-amber-400" />
          <span className="text-xs text-white/60 font-medium tracking-wide">Personal Knowledge Hub</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-5xl sm:text-6xl font-bold text-white mb-5 tracking-tight leading-tight"
        >
          Everything I've{" "}
          <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            learned
          </span>
          ,<br />
          all in one place.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="text-white/45 text-lg max-w-xl leading-relaxed mb-14"
        >
          A living knowledge base for my hyper fixations — health science, photography, and stoic philosophy.
          Built to study from, reference, and share.
        </motion.p>

        {/* Category Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl"
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <motion.div key={cat.href} variants={cardAnim}>
                <Link href={cat.href} className="group block h-full">
                  <div
                    className={`glass rounded-2xl p-6 h-full border ${cat.border} transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl ${cat.glow} relative overflow-hidden`}
                  >
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-60 rounded-2xl pointer-events-none`} />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-2.5 rounded-xl border ${cat.iconBg}`}>
                          <Icon size={20} className={cat.iconColor} />
                        </div>
                        <span className="text-[10px] font-medium text-white/35 glass px-2.5 py-1 rounded-full border-white/10">
                          {cat.badge}
                        </span>
                      </div>

                      <h2 className="text-xl font-semibold text-white mb-2">{cat.title}</h2>
                      <p className="text-sm text-white/50 leading-relaxed mb-5">{cat.description}</p>

                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {cat.topics.map((topic) => (
                          <span key={topic} className={`text-[11px] px-2.5 py-0.5 rounded-full border ${cat.tagColor}`}>
                            {topic}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-medium text-white/40 group-hover:text-white/70 transition-colors">
                        Explore
                        <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
}
