// Metadata for the long-form educational deep-dives in the Health section.
// These are the "curated guides" that live alongside personal notes in the
// Knowledge Hub. The full content pages (e.g. /health/insulin) are unchanged —
// this just describes them for the hub's unified, filterable feed.

import type { NoteCategory } from "@/lib/health/notes";

export type GuideIcon = "insulin" | "hair" | "running" | "weight" | "brain" | "diet";

export type Guide = {
  slug: string;
  href: string;
  title: string;
  description: string;
  tags: string[];
  category: NoteCategory;
  readTime: string;
  icon: GuideIcon;
  gradient: string;
  border: string;
  iconBg: string;
  iconColor: string;
  tagColor: string;
};

export const guides: Guide[] = [
  {
    slug: "insulin",
    href: "/health/insulin",
    title: "Insulin & Insulin Resistance",
    description:
      "What insulin is, how it works, what causes resistance, and its link to Type 3 Diabetes and brain health.",
    tags: ["Metabolic Health", "Hormones", "Type 2 Diabetes", "Brain"],
    category: "Nutrition",
    readTime: "8 min read",
    icon: "insulin",
    gradient: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/20 hover:border-amber-500/40",
    iconBg: "bg-amber-500/15 border-amber-500/25",
    iconColor: "text-amber-400",
    tagColor: "bg-amber-500/10 text-amber-300/80 border-amber-500/15",
  },
  {
    slug: "diet",
    href: "/health/diet",
    title: "Diet & Metabolic Health",
    description:
      "Protein, processed foods, food order, and how to eat for muscle, stable glucose, and long-range metabolic health.",
    tags: ["Protein", "Food Quality", "Glucose", "Satiety"],
    category: "Nutrition",
    readTime: "9 min read",
    icon: "diet",
    gradient: "from-teal-500/20 to-cyan-500/10",
    border: "border-teal-500/20 hover:border-teal-500/40",
    iconBg: "bg-teal-500/15 border-teal-500/25",
    iconColor: "text-teal-400",
    tagColor: "bg-teal-500/10 text-teal-300/80 border-teal-500/15",
  },
  {
    slug: "weight-loss",
    href: "/health/weight-loss",
    title: "Weight Loss",
    description:
      "Energy balance, visceral fat, protein's role, and a sustainable approach to body recomposition.",
    tags: ["Nutrition", "Calories", "Visceral Fat", "Protein"],
    category: "Nutrition",
    readTime: "6 min read",
    icon: "weight",
    gradient: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/20 hover:border-blue-500/40",
    iconBg: "bg-blue-500/15 border-blue-500/25",
    iconColor: "text-blue-400",
    tagColor: "bg-blue-500/10 text-blue-300/80 border-blue-500/15",
  },
  {
    slug: "running",
    href: "/health/running",
    title: "Running & Aerobic Training",
    description:
      "Zone 2, VO2 max, running form, and the science of building a durable aerobic engine.",
    tags: ["Zone 2", "VO2 Max", "Cardio", "Longevity"],
    category: "Fitness and Running",
    readTime: "5 min read",
    icon: "running",
    gradient: "from-emerald-500/20 to-green-500/10",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/15 border-emerald-500/25",
    iconColor: "text-emerald-400",
    tagColor: "bg-emerald-500/10 text-emerald-300/80 border-emerald-500/15",
  },
  {
    slug: "hair-loss",
    href: "/health/hair-loss",
    title: "Hair Loss & DHT",
    description:
      "The science of androgenetic alopecia — DHT, finasteride, minoxidil, and combination protocols.",
    tags: ["DHT", "Finasteride", "Minoxidil", "5-AR"],
    category: "Hair Health",
    readTime: "7 min read",
    icon: "hair",
    gradient: "from-purple-500/20 to-violet-500/10",
    border: "border-purple-500/20 hover:border-purple-500/40",
    iconBg: "bg-purple-500/15 border-purple-500/25",
    iconColor: "text-purple-400",
    tagColor: "bg-purple-500/10 text-purple-300/80 border-purple-500/15",
  },
  {
    slug: "brain",
    href: "/health/brain",
    title: "Brain Health",
    description:
      "Alzheimer's prevention, cognitive reserve, exercise protocols, APOE E4, what damages your brain, SSRIs, and the insulin-brain connection.",
    tags: ["Alzheimer's", "Cognitive Reserve", "SSRIs", "BDNF", "APOE E4"],
    category: "General Health Notes",
    readTime: "18 min read",
    icon: "brain",
    gradient: "from-cyan-500/20 to-sky-500/10",
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    iconBg: "bg-cyan-500/15 border-cyan-500/25",
    iconColor: "text-cyan-400",
    tagColor: "bg-cyan-500/10 text-cyan-300/80 border-cyan-500/15",
  },
];
