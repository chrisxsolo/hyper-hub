"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Camera, Clock } from "lucide-react";

const comingSoon = [
  { title: "Composition", description: "Rule of thirds, leading lines, framing, and negative space.", icon: "📐" },
  { title: "Light Theory", description: "Golden hour, direction, hard vs soft, and reading natural light.", icon: "🌅" },
  { title: "Gear Notes", description: "Lenses, bodies, what actually matters vs gear acquisition syndrome.", icon: "📷" },
  { title: "Post-Processing", description: "Lightroom workflow, color grading, and editing with intention.", icon: "🎨" },
];

export default function PhotographyPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-readable-soft hover:text-readable-strong transition-colors mb-10">
          <ArrowLeft size={14} /> Back to Hub
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl glass border border-violet-500/25 flex items-center justify-center">
            <Camera size={22} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Photography</h1>
            <p className="text-sm text-readable-soft">Craft, light, and the art of seeing</p>
          </div>
        </div>
      </motion.div>

      {/* Coming Soon Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6 border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent mb-8"
      >
        <div className="flex items-center gap-3">
          <Clock size={18} className="text-violet-400" />
          <div>
            <p className="text-sm font-medium text-readable-strong">Content coming soon</p>
            <p className="text-xs text-readable-soft mt-0.5">I'm building out these notes — check back soon.</p>
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
            className="glass rounded-xl p-5 border border-violet-500/10 opacity-60"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <h3 className="text-sm font-semibold text-readable-strong mb-1">{item.title}</h3>
            <p className="text-xs text-readable-soft leading-relaxed">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
