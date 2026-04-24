"use client";

import { ExternalLink, BookOpen } from "lucide-react";

interface Study {
  title: string;
  journal: string;
  year: number;
  url: string;
  summary: string;
}

export default function StudyCard({ study }: { study: Study }) {
  return (
    <a
      href={study.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block glass rounded-xl p-4 hover:border-white/15 transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
          <BookOpen size={14} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90 group-hover:text-white leading-snug mb-1 line-clamp-2">
            {study.title}
          </p>
          <p className="text-xs text-readable-soft mb-2">{study.summary}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-400/70 font-medium">{study.journal}</span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-readable-soft">{study.year}</span>
            <ExternalLink size={10} className="ml-auto text-readable-faint group-hover:text-amber-400/60 transition-colors" />
          </div>
        </div>
      </div>
    </a>
  );
}
