"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Brain, Clock } from "lucide-react";

const comingSoon = [
  { title: "Core Principles", description: "The dichotomy of control, virtue ethics, and living according to nature.", icon: "⚖️" },
  { title: "Daily Practice", description: "Morning reflection, negative visualization, and the evening review.", icon: "🌄" },
  { title: "Memento Mori", description: "Why contemplating death is the ultimate tool for living fully.", icon: "🕯️" },
];

const books = [
  { title: "Meditations", href: "/stoicism/meditations", description: "Private journal of Marcus Aurelius — 12 books of cognitive training under empire-level pressure.", icon: "📜" },
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

      {/* Marcus Aurelius — active section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Marcus Aurelius</h2>
        <div className="space-y-3">
          {books.map((book) => (
            <Link
              key={book.title}
              href={book.href}
              className="group flex items-center gap-4 glass rounded-xl p-5 border border-blue-500/20 hover:border-blue-500/40 bg-gradient-to-br from-blue-500/5 to-transparent transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="text-2xl">{book.icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white mb-0.5">{book.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{book.description}</p>
              </div>
              <ArrowRight size={16} className="text-blue-400/50 group-hover:text-blue-400 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Coming Soon */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass rounded-2xl p-5 border border-blue-500/10 bg-gradient-to-br from-blue-500/5 to-transparent mb-6"
      >
        <div className="flex items-center gap-3">
          <Clock size={16} className="text-blue-400/60" />
          <p className="text-xs text-white/40">More content coming — Epictetus, Seneca, and daily Stoic practice.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {comingSoon.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.07 }}
            className="glass rounded-xl p-5 border border-blue-500/10 opacity-50"
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
