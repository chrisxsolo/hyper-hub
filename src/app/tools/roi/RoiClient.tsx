"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut, Lock, Trophy, Crown, Package, ChevronRight, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  RANK_METRICS,
  partitionForMetric,
  dataGap,
  metricNeedsPrice,
  HIGHER_IS_BETTER,
  type RankMetric,
  type RankedProduct,
} from "@/lib/products/rankings";

// Display metadata for each ROI metric. The math lives in lib/products; this is
// purely how it reads to a human.
const METRIC_META: Record<
  RankMetric,
  { label: string; heading: string; blurb: string; suffix: string; fmt: (n: number) => string }
> = {
  proteinPerDollar: {
    label: "Protein / $",
    heading: "Best protein per dollar",
    blurb: "Grams of protein per dollar spent — your strongest protein ROI for recomp.",
    suffix: "g / $",
    fmt: (n) => n.toFixed(1),
  },
  proteinPer100Cal: {
    label: "Lean protein",
    heading: "Leanest protein",
    blurb: "Protein per 100 calories — lean density, not just total grams. No price needed.",
    suffix: "g / 100 cal",
    fmt: (n) => n.toFixed(1),
  },
  costPerServing: {
    label: "$ / serving",
    heading: "Cheapest per serving",
    blurb: "What one serving actually costs you — lower is better.",
    suffix: "per serving",
    fmt: (n) => `$${n.toFixed(2)}`,
  },
  caloriesPerDollar: {
    label: "Cal / $",
    heading: "Most calories per dollar",
    blurb: "Cheap energy — useful on a budget. Pair with protein density so it's not empty calories.",
    suffix: "cal / $",
    fmt: (n) => Math.round(n).toLocaleString(),
  },
};

// Short chip text for a metric's value, used to give context on each card.
function chipText(metric: RankMetric, v: number): string {
  if (metric === "proteinPerDollar") return `${v.toFixed(1)} g/$`;
  if (metric === "proteinPer100Cal") return `${v.toFixed(1)} g/100cal`;
  if (metric === "costPerServing") return `$${v.toFixed(2)}/srv`;
  return `${Math.round(v).toLocaleString()} cal/$`;
}

// Why a product can't be ranked for the selected metric — honest and actionable.
function unrankedReason(metric: RankMetric, rp: RankedProduct): string {
  const gap = dataGap(rp.product);
  if (gap.needsNutrition) return "Scan a nutrition label";
  if (metricNeedsPrice(metric) && gap.needsPrice) return "Add a price";
  return "Add a package or serving size";
}

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.035 } } };
const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function RoiClient({
  email,
  canEdit,
  ranked,
}: {
  email: string | null;
  canEdit: boolean;
  ranked: RankedProduct[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [metric, setMetric] = useState<RankMetric>("proteinPerDollar");
  const [showUnranked, setShowUnranked] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  const { ranked: rows, unranked } = useMemo(
    () => partitionForMetric(ranked, metric),
    [ranked, metric],
  );
  const meta = METRIC_META[metric];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Back + account */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-8"
      >
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-sm text-readable-soft hover:text-readable-strong transition-colors"
        >
          <ArrowLeft size={14} /> Back to Tools
        </Link>
        {email ? (
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 text-xs text-readable-faint hover:text-readable-strong transition-colors"
          >
            <LogOut size={13} /> Sign out
          </button>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-readable-faint hover:text-readable-strong transition-colors"
          >
            <Lock size={13} /> Sign in
          </Link>
        )}
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
            <Trophy size={20} className="text-violet-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Food ROI Rankings</h1>
            <p className="text-sm text-readable-soft">
              {canEdit
                ? "Which Costco products give you the best nutrition for the money"
                : "Rank your foods by nutrition value for the money"}
            </p>
          </div>
        </div>
      </motion.div>

      {!canEdit ? (
        <div className="glass rounded-2xl border border-white/10 p-10 text-center">
          <Lock size={28} className="text-readable-faint mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">These rankings are private</h2>
          <p className="text-sm text-readable-soft mb-6 max-w-sm mx-auto">
            Sign in to rank your scanned products by protein per dollar, lean-protein density, and
            cost per serving.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-200 px-4 py-2 text-sm font-medium hover:bg-violet-500/25 transition-colors"
          >
            <Lock size={14} /> Sign in
          </Link>
        </div>
      ) : ranked.length === 0 ? (
        <div className="glass rounded-2xl border border-white/10 p-10 text-center">
          <Package size={26} className="text-violet-300/70 mx-auto mb-3" />
          <p className="text-sm text-readable-soft mb-5">
            Nothing to rank yet. Scan a few products with prices and nutrition labels, and they&apos;ll
            be ranked here by value.
          </p>
          <Link
            href="/tools/products"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-200 px-4 py-2 text-sm font-medium hover:bg-violet-500/25 transition-colors"
          >
            <Package size={14} /> Go to my products
          </Link>
        </div>
      ) : (
        <>
          {/* Honest-data note */}
          <p className="flex items-start gap-2 text-xs text-readable-faint mb-5 leading-relaxed">
            <Info size={13} className="mt-0.5 shrink-0" />
            Ranked from each product&apos;s latest scanned price and current nutrition label. A product
            only appears once there&apos;s enough data to compute the metric — nothing is estimated.
          </p>

          {/* Metric selector */}
          <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto pb-1 px-1">
            {RANK_METRICS.map((m) => {
              const active = m === metric;
              return (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-violet-400/40 bg-violet-400/15 text-violet-200"
                      : "border-white/10 text-readable-soft hover:bg-white/[0.06]"
                  }`}
                >
                  {METRIC_META[m].label}
                </button>
              );
            })}
          </div>

          {/* Selected-metric heading + coverage */}
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">{meta.heading}</h2>
            <p className="text-xs text-readable-soft mt-0.5 leading-relaxed">{meta.blurb}</p>
            <p className="text-[11px] text-readable-faint mt-1.5">
              Ranking {rows.length} of {ranked.length} product{ranked.length === 1 ? "" : "s"}
              {HIGHER_IS_BETTER[metric] ? " · best at the top" : " · cheapest at the top"}
            </p>
          </div>

          {/* Ranked list */}
          {rows.length === 0 ? (
            <p className="text-sm text-readable-faint text-center py-8">
              No products have enough data for this metric yet.
            </p>
          ) : (
            <motion.ul
              key={metric}
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="space-y-2.5"
            >
              {rows.map((rp, i) => (
                <RankRow key={rp.product.id} rp={rp} metric={metric} rank={i + 1} />
              ))}
            </motion.ul>
          )}

          {/* Can't-rank-yet — actionable backlog of what to scan next */}
          {unranked.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowUnranked((v) => !v)}
                className="text-xs text-readable-faint hover:text-readable-soft transition-colors inline-flex items-center gap-1.5"
              >
                <ChevronRight
                  size={13}
                  className={`transition-transform ${showUnranked ? "rotate-90" : ""}`}
                />
                {unranked.length} product{unranked.length === 1 ? "" : "s"} can&apos;t be ranked yet
              </button>
              {showUnranked && (
                <ul className="mt-3 space-y-2">
                  {unranked.map((rp) => (
                    <li key={rp.product.id}>
                      <Link
                        href={`/tools/products/${rp.product.id}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 hover:bg-white/[0.05] transition-colors"
                      >
                        <span className="text-sm text-readable-soft truncate">{rp.product.name}</span>
                        <span className="shrink-0 inline-flex items-center gap-1 text-[11px] text-amber-300/80">
                          {unrankedReason(metric, rp)} <ChevronRight size={12} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RankRow({ rp, metric, rank }: { rp: RankedProduct; metric: RankMetric; rank: number }) {
  const meta = METRIC_META[metric];
  const value = rp.metrics[metric] as number;
  const p = rp.product;
  const top = rank <= 3;

  // Context chips: price first, then the other non-null metrics (not the headline).
  const chips: string[] = [];
  if (p.last_total_price != null) chips.push(`$${Number(p.last_total_price).toFixed(2)}`);
  for (const m of RANK_METRICS) {
    if (m === metric) continue;
    const v = rp.metrics[m];
    if (v != null && chips.length < 3) chips.push(chipText(m, v));
  }

  return (
    <motion.li variants={rowVariants}>
      <Link
        href={`/tools/products/${p.id}`}
        className="glass flex items-center gap-3 rounded-xl border border-white/8 p-3 hover:bg-white/[0.03] transition-colors"
      >
        {/* Rank badge */}
        <div
          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
            top
              ? "bg-amber-400/15 border border-amber-400/30 text-amber-300"
              : "bg-white/[0.04] border border-white/10 text-readable-faint"
          }`}
        >
          {rank === 1 ? <Crown size={14} /> : rank}
        </div>

        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg bg-white/[0.04] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <Package size={16} className="text-readable-faint" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{p.name}</p>
          <p className="text-xs text-readable-faint truncate">
            {[p.brand, p.category].filter(Boolean).join(" · ") || "—"}
          </p>
          {chips.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {chips.map((c, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-readable-soft"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Headline metric */}
        <div className="shrink-0 text-right">
          <p className={`text-lg font-bold leading-none ${top ? "text-amber-300" : "text-white"}`}>
            {meta.fmt(value)}
          </p>
          <p className="text-[10px] text-readable-faint mt-1">{meta.suffix}</p>
        </div>
      </Link>
    </motion.li>
  );
}
