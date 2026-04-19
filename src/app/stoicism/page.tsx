"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Brain, Clock } from "lucide-react";

const comingSoon = [
  { title: "Core Principles", description: "The dichotomy of control, virtue ethics, and living according to nature.", icon: "⚖️" },
  { title: "Marcus Aurelius", description: "Meditations — the private journal of a Roman Emperor who chose wisdom.", icon: "📜" },
  { title: "Daily Practice", description: "Morning reflection, negative visualization, and the evening review.", icon: "🌄" },
  { title: "Memento Mori", description: "Why contemplating death is the ultimate tool for living fully.", icon: "🕯️" },
];

export default function StoicismPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-10">
          <ArrowLeft size={14} /> Back to Hub
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl glass border border-blue-500/25 flex items-center justify-center">
            <Brain size={22} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Stoicism</h1>
            <p className="text-sm text-white/40">Ancient wisdom for modern living</p>
          </div>
        </div>
      </motion.div>

      {/* Coming Soon Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6 border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent mb-8"
      >
        <div className="flex items-center gap-3">
          <Clock size={18} className="text-blue-400" />
          <div>
            <p className="text-sm font-medium text-white/80">Content coming soon</p>
            <p className="text-xs text-white/40 mt-0.5">Building out notes on Epictetus, Marcus Aurelius, and Seneca.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {comingSoon.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="glass rounded-xl p-5 border border-blue-500/10 opacity-60"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <h3 className="text-sm font-semibold text-white/70 mb-1">{item.title}</h3>
            <p className="text-xs text-white/40 leading-relaxed">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
