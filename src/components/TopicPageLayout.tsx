"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TopicSection from "./TopicSection";
import StudyCard from "./StudyCard";
import StatCard from "./StatCard";

interface TopicData {
  title: string;
  subtitle: string;
  color: string;
  gradient: string;
  borderColor: string;
  accentColor: string;
  icon: string;
  sections: {
    id: string;
    title: string;
    content: string;
    tags: string[];
  }[];
  studies: {
    title: string;
    journal: string;
    year: number;
    url: string;
    summary: string;
  }[];
  quickStats: {
    label: string;
    value: string;
    note: string;
  }[];
}

export default function TopicPageLayout({
  data,
  backHref = "/health",
  backLabel = "Health",
}: {
  data: TopicData;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Back */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-10"
        >
          <ArrowLeft size={14} /> Back to {backLabel}
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-10"
      >
        <div className="flex items-center gap-4 mb-3">
          <div className={`w-12 h-12 rounded-2xl glass border ${data.borderColor} flex items-center justify-center text-2xl`}>
            {data.icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{data.title}</h1>
            <p className="text-sm text-white/40 mt-0.5">{data.subtitle}</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10"
      >
        {data.quickStats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} color={data.color} index={i} />
        ))}
      </motion.div>

      {/* Two-column layout: sections + studies sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Sections */}
        <div className="space-y-4">
          {data.sections.map((section, i) => (
            <TopicSection key={section.id} section={section} color={data.color} index={i} />
          ))}
        </div>

        {/* Studies Sidebar */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
              Research & Studies
            </h2>
            <div className="space-y-3">
              {data.studies.map((study) => (
                <StudyCard key={study.title} study={study} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
