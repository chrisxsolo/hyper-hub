"use client";

import { motion } from "framer-motion";

interface Section {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

const colorMap: Record<string, string> = {
  amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  purple: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  blue: "bg-blue-500/10 text-blue-300 border-blue-500/20",
};

function renderContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("•")) {
      const content = line.slice(1).trim();
      const rendered = content.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white/90'>$1</strong>");
      return (
        <li key={i} className="flex gap-2 text-readable-muted text-sm leading-relaxed">
          <span className="mt-1.5 w-1 h-1 rounded-full bg-white/30 shrink-0" />
          <span dangerouslySetInnerHTML={{ __html: rendered }} />
        </li>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    const rendered = line.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white/90'>$1</strong>");
    return (
      <p key={i} className="text-readable-muted text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: rendered }} />
    );
  });
}

export default function TopicSection({
  section,
  color,
  index,
}: {
  section: Section;
  color: string;
  index: number;
}) {
  const tagStyle = colorMap[color] ?? colorMap.amber;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      className="glass rounded-2xl p-6 hover:border-white/12 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-white/90">{section.title}</h3>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {section.tags.map((tag) => (
            <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${tagStyle}`}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-1 divider-top">
        <ul className="space-y-1">{renderContent(section.content)}</ul>
      </div>
    </motion.div>
  );
}
