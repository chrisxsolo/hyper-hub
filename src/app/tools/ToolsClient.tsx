"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight, UtensilsCrossed, ShoppingCart, LineChart } from "lucide-react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function ToolsClient({
  calorieSummary,
  grocerySummary,
  metricsSummary,
}: {
  calorieSummary: string;
  grocerySummary: string;
  metricsSummary: string;
}) {
  const tools = [
    {
      href: "/tools/nutrition",
      icon: UtensilsCrossed,
      title: "Calorie Tracker",
      summary: calorieSummary,
      cta: "Open tracker",
      gradient: "from-emerald-500/20 to-teal-500/10",
      border: "border-emerald-500/20 hover:border-emerald-500/40",
      iconBg: "bg-emerald-500/15 border-emerald-500/25",
      iconColor: "text-emerald-400",
    },
    {
      href: "/tools/grocery",
      icon: ShoppingCart,
      title: "Grocery List",
      summary: grocerySummary,
      cta: "Open list",
      gradient: "from-amber-500/20 to-orange-500/10",
      border: "border-amber-500/20 hover:border-amber-500/40",
      iconBg: "bg-amber-500/15 border-amber-500/25",
      iconColor: "text-amber-400",
    },
    {
      href: "/tools/metrics",
      icon: LineChart,
      title: "My Metrics",
      summary: metricsSummary,
      cta: "Open dashboard",
      gradient: "from-cyan-500/20 to-blue-500/10",
      border: "border-cyan-500/20 hover:border-cyan-500/40",
      iconBg: "bg-cyan-500/15 border-cyan-500/25",
      iconColor: "text-cyan-400",
    },
  ];

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
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <span className="text-lg">🧰</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Personalized Tools</h1>
            <p className="text-sm text-readable-soft">The tools I actively use</p>
          </div>
        </div>
        <p className="text-readable-soft max-w-xl mt-4 text-sm leading-relaxed">
          Interactive trackers and lists — log meals, manage the grocery run, and follow my
          body metrics over time.
        </p>
      </motion.div>

      {/* Tool tiles */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <motion.div key={tool.href} variants={item}>
              <Link href={tool.href} className="group block h-full">
                <div
                  className={`glass rounded-2xl p-6 h-full border ${tool.border} transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl relative overflow-hidden`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-50 pointer-events-none`} />
                  <div className="relative z-10 flex flex-col h-full">
                    <div className={`p-2.5 rounded-xl border ${tool.iconBg} w-fit mb-4`}>
                      <Icon size={20} className={tool.iconColor} />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">{tool.title}</h3>
                    <p className="text-sm text-readable-soft leading-relaxed mb-5 flex-1">{tool.summary}</p>
                    <div className="flex items-center gap-1 text-xs font-medium text-readable-faint group-hover:text-readable-muted transition-colors">
                      {tool.cta} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
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
