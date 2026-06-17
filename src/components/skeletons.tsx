import { ArrowLeft } from "lucide-react";

// Loading skeletons rendered by route-level loading.tsx files while a page's
// server component resolves. Next.js shows these the instant a card is tapped
// (before any data is fetched), so navigation feels immediate and the real
// content swaps in when ready. They mirror each page's container width and
// header so the layout doesn't jump. Server components — no client JS.

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />;
}

function Box({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />;
}

// Static (non-clickable) stand-in for the "Back to …" link each page renders.
function BackLink({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-readable-faint mb-10">
      <ArrowLeft size={14} /> {label}
    </span>
  );
}

function PageHeader({ titleWidth = "w-56" }: { titleWidth?: string }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-3">
        <Box className="w-10 h-10 shrink-0" />
        <div className="flex flex-col gap-2">
          <Bar className={`h-7 ${titleWidth}`} />
          <Bar className="h-3.5 w-40" />
        </div>
      </div>
      <Bar className="h-3.5 w-full max-w-xl mt-4" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 border border-white/10 flex flex-col gap-4">
      <Box className="w-11 h-11" />
      <Bar className="h-5 w-2/3" />
      <div className="flex flex-col gap-2">
        <Bar className="h-3.5 w-full" />
        <Bar className="h-3.5 w-4/5" />
      </div>
      <Bar className="h-3 w-24 mt-2" />
    </div>
  );
}

/** /tools — the Personalized Tools hub (3 tiles). */
export function ToolsHubSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <BackLink label="Back to Hub" />
      <PageHeader titleWidth="w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** /tools/nutrition — Calorie Tracker (day summary + logger + timeline). */
export function TrackerSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <BackLink label="Back to Tools" />
      <PageHeader titleWidth="w-52" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} className="h-24" />
        ))}
      </div>
      <Box className="h-28 mb-8" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <Box key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}

/** /tools/metrics — My Metrics dashboard (tab bar + chart + stat cards). */
export function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <BackLink label="Back to Tools" />
      <PageHeader titleWidth="w-48" />
      <div className="flex flex-wrap gap-2 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Bar key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <Box className="h-72 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}

/** /tools/grocery — Costco Grocery List (rows). */
export function ListSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <BackLink label="Back to Tools" />
      <PageHeader titleWidth="w-56" />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i} className="h-14" />
        ))}
      </div>
    </div>
  );
}

/** /health — Knowledge Hub (search + guide cards). */
export function KnowledgeHubSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <BackLink label="Back to Hub" />
      <PageHeader titleWidth="w-72" />
      <Bar className="h-11 w-full max-w-md rounded-xl mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
