"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Search, Plus, Pencil, Trash2, X, Lock, Loader2,
  BookOpen, Tag as TagIcon, Droplets, Zap, Activity, Scale, Brain, Apple,
} from "lucide-react";
import type { Guide, GuideIcon } from "@/data/health/guides";
import {
  NOTE_CATEGORIES, categoryMeta, fmtNoteDate, type DbNote, type NoteCategory,
} from "@/lib/health/notes";

const GUIDE_ICONS: Record<GuideIcon, typeof Droplets> = {
  insulin: Droplets,
  hair: Zap,
  running: Activity,
  weight: Scale,
  brain: Brain,
  diet: Apple,
};

const inputCls =
  "rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/40 transition-colors w-full";

type FeedItem =
  | { kind: "guide"; id: string; category: string; guide: Guide }
  | { kind: "note"; id: string; category: string; note: DbNote };

export default function KnowledgeHubClient({
  guides,
  initialNotes,
  canEdit,
}: {
  guides: Guide[];
  initialNotes: DbNote[];
  canEdit: boolean;
}) {
  const [notes, setNotes] = useState<DbNote[]>(initialNotes);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<"All" | NoteCategory>("All");
  const [editing, setEditing] = useState<DbNote | "new" | null>(null);
  const [viewing, setViewing] = useState<DbNote | null>(null);

  // Build the unified feed: notes first (most recently edited), then guides.
  const feed: FeedItem[] = useMemo(() => {
    const noteItems: FeedItem[] = notes.map((n) => ({ kind: "note", id: n.id, category: n.category, note: n }));
    const guideItems: FeedItem[] = guides.map((g) => ({ kind: "guide", id: g.slug, category: g.category, guide: g }));
    return [...noteItems, ...guideItems];
  }, [notes, guides]);

  // Category counts across the whole feed (drives which chips to show).
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const it of feed) c[it.category] = (c[it.category] ?? 0) + 1;
    return c;
  }, [feed]);

  const visibleCats = NOTE_CATEGORIES.filter((c) => counts[c] > 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feed.filter((it) => {
      if (activeCat !== "All" && it.category !== activeCat) return false;
      if (!q) return true;
      if (it.kind === "guide") {
        const g = it.guide;
        return (
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      const n = it.note;
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [feed, query, activeCat]);

  function upsertNote(note: DbNote) {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === note.id);
      if (idx === -1) return [note, ...prev];
      const copy = [...prev];
      copy[idx] = note;
      return copy;
    });
  }

  function deleteNoteLocal(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Back + account */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-10"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-readable-soft hover:text-readable-strong transition-colors"
        >
          <ArrowLeft size={14} /> Back to Hub
        </Link>
        {!canEdit && (
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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <span className="text-lg">🫀</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Health Knowledge Hub</h1>
              <p className="text-sm text-readable-soft">My personal notebook on health & longevity</p>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => setEditing("new")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3.5 py-2 text-sm font-medium hover:bg-amber-500/30 transition-colors shrink-0"
            >
              <Plus size={15} /> New note
            </button>
          )}
        </div>
        <p className="text-readable-soft max-w-xl mt-2 text-sm leading-relaxed">
          Curated deep-dives alongside my own notes on nutrition, fitness, sleep, recovery, dental
          and hair health, lab results, and more — searchable and organized by topic.
        </p>
      </motion.div>

      {/* Search + filters */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-readable-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides and notes…"
            className={`${inputCls} pl-9`}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-readable-faint hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip label="All" count={feed.length} active={activeCat === "All"} onClick={() => setActiveCat("All")} />
          {visibleCats.map((c) => (
            <Chip
              key={c}
              label={`${categoryMeta(c).emoji} ${c}`}
              count={counts[c]}
              active={activeCat === c}
              onClick={() => setActiveCat(c)}
            />
          ))}
        </div>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl border border-white/10 p-12 text-center">
          <BookOpen size={26} className="text-readable-faint mx-auto mb-3" />
          <p className="text-sm text-readable-soft">
            {query || activeCat !== "All"
              ? "Nothing matches that filter."
              : canEdit
              ? "No notes yet — add your first one with “New note”."
              : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((it) =>
            it.kind === "guide" ? (
              <GuideCard key={`g-${it.id}`} guide={it.guide} />
            ) : (
              <NoteCard key={`n-${it.id}`} note={it.note} onOpen={() => setViewing(it.note)} />
            ),
          )}
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {viewing && (
          <NoteViewer
            note={viewing}
            canEdit={canEdit}
            onClose={() => setViewing(null)}
            onEdit={() => {
              const n = viewing;
              setViewing(null);
              setEditing(n);
            }}
            onDeleted={(id) => {
              deleteNoteLocal(id);
              setViewing(null);
            }}
          />
        )}
        {editing && (
          <NoteEditor
            note={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={(note) => {
              upsertNote(note);
              setEditing(null);
              setViewing(note);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Filter chip ──────────────────────────────────────────────────────────────
function Chip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
        active
          ? "bg-amber-500/20 text-amber-200 border-amber-500/40"
          : "glass border-white/10 text-readable-soft hover:text-readable-strong hover:border-white/20"
      }`}
    >
      {label}
      <span className={`text-[10px] ${active ? "text-amber-300/80" : "text-readable-faint"}`}>{count}</span>
    </button>
  );
}

// ── Guide card (links to the full deep-dive page) ──────────────────────────────
function GuideCard({ guide }: { guide: Guide }) {
  const Icon = GUIDE_ICONS[guide.icon];
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
      <Link href={guide.href} className="group block h-full">
        <div
          className={`glass rounded-2xl p-5 h-full border ${guide.border} transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl relative overflow-hidden`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${guide.gradient} opacity-50 pointer-events-none`} />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl border ${guide.iconBg}`}>
                <Icon size={18} className={guide.iconColor} />
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full glass border-white/10 text-readable-faint">
                Guide · {guide.readTime}
              </span>
            </div>
            <h3 className="text-base font-semibold text-white mb-2">{guide.title}</h3>
            <p className="text-sm text-readable-soft leading-relaxed mb-4 flex-1">{guide.description}</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {guide.tags.slice(0, 4).map((tag) => (
                <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full border ${guide.tagColor}`}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-readable-faint group-hover:text-readable-muted transition-colors">
              Read more <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Note card (opens the viewer modal) ─────────────────────────────────────────
function NoteCard({ note, onOpen }: { note: DbNote; onOpen: () => void }) {
  const meta = categoryMeta(note.category);
  const preview = note.content.replace(/[#*`>_~-]/g, "").trim();
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
      <button onClick={onOpen} className="group block w-full h-full text-left">
        <div className="glass rounded-2xl p-5 h-full border border-white/10 hover:border-white/20 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${meta.chip}`}>
              {meta.emoji} {note.category}
            </span>
            <span className="text-[10px] text-readable-faint">Note</span>
          </div>
          <h3 className="text-base font-semibold text-white mb-2">{note.title}</h3>
          {preview && (
            <p className="text-sm text-readable-soft leading-relaxed mb-4 flex-1 line-clamp-3">{preview}</p>
          )}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {note.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-readable-faint">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="text-[11px] text-readable-faint mt-auto">Updated {fmtNoteDate(note.updated_at)}</div>
        </div>
      </button>
    </motion.div>
  );
}

// ── Note viewer modal ──────────────────────────────────────────────────────────
function NoteViewer({
  note,
  canEdit,
  onClose,
  onEdit,
  onDeleted,
}: {
  note: DbNote;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDeleted: (id: string) => void;
}) {
  const meta = categoryMeta(note.category);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function del() {
    if (!confirm("Delete this note? This can't be undone.")) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/health/notes/${note.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDeleted(note.id);
    } catch {
      setErr("Couldn't delete the note.");
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border ${meta.chip}`}>
          {meta.emoji} {note.category}
        </span>
        <button onClick={onClose} aria-label="Close" className="text-readable-faint hover:text-white p-1">
          <X size={18} />
        </button>
      </div>
      <h2 className="text-2xl font-bold text-white tracking-tight mb-2">{note.title}</h2>
      <div className="text-[11px] text-readable-faint mb-5">
        Created {fmtNoteDate(note.created_at)} · Updated {fmtNoteDate(note.updated_at)}
      </div>
      {note.content.trim() && (
        <div className="text-sm text-readable-muted leading-relaxed whitespace-pre-wrap mb-6">{note.content}</div>
      )}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {note.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-white/10 text-readable-soft">
              <TagIcon size={10} /> {tag}
            </span>
          ))}
        </div>
      )}
      {canEdit && (
        <div className="flex items-center gap-2 pt-4 border-t border-white/10">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-readable-strong px-3.5 py-2 text-sm font-medium hover:bg-white/[0.1] transition-colors"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={del}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 text-red-300 px-3.5 py-2 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
          </button>
          {err && <span className="text-xs text-red-300/90">{err}</span>}
        </div>
      )}
    </Modal>
  );
}

// ── Note editor modal (create / edit) ──────────────────────────────────────────
function NoteEditor({
  note,
  onClose,
  onSaved,
}: {
  note: DbNote | null;
  onClose: () => void;
  onSaved: (note: DbNote) => void;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [category, setCategory] = useState<NoteCategory>((note?.category as NoteCategory) ?? NOTE_CATEGORIES[0]);
  const [content, setContent] = useState(note?.content ?? "");
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function commitTag() {
    const t = tagDraft.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagDraft("");
  }

  async function save() {
    const finalTitle = title.trim();
    if (!finalTitle) {
      setErr("A title is required.");
      return;
    }
    const finalTags = [...tags];
    const leftover = tagDraft.trim().replace(/^#/, "");
    if (leftover && !finalTags.includes(leftover)) finalTags.push(leftover);

    setBusy(true);
    setErr("");
    const payload = { title: finalTitle, content, category, tags: finalTags };
    try {
      const res = await fetch(
        note ? `/api/health/notes/${note.id}` : "/api/health/notes",
        {
          method: note ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Couldn't save the note.");
      onSaved(json.note as DbNote);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save the note.");
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">{note ? "Edit note" : "New note"}</h2>
        <button onClick={onClose} aria-label="Close" className="text-readable-faint hover:text-white p-1">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-readable-faint">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" className={inputCls} autoFocus />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-readable-faint">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as NoteCategory)}
            className={`${inputCls} appearance-none`}
          >
            {NOTE_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#15151a] text-white">
                {categoryMeta(c).emoji} {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-readable-faint">Note</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note… (supports plain text and line breaks)"
            rows={8}
            className={`${inputCls} resize-y leading-relaxed`}
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-readable-faint">Tags (optional)</span>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-white/10 text-readable-soft">
                  #{t}
                  <button onClick={() => setTags((prev) => prev.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="hover:text-red-300">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                commitTag();
              }
            }}
            onBlur={commitTag}
            placeholder="Type a tag and press Enter"
            className={inputCls}
          />
        </div>

        {err && <p className="text-xs text-red-300/90">{err}</p>}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-lg px-3.5 py-2 text-sm text-readable-soft hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy || !title.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-200 px-4 py-2 text-sm font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : null}
            {note ? "Save changes" : "Create note"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Shared modal shell ─────────────────────────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        className="relative z-10 w-full max-w-lg my-auto glass rounded-2xl border border-white/12 p-6 shadow-2xl"
        style={{ background: "rgba(20,20,26,0.92)" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
