"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <Link
          href="/health"
          className="inline-flex items-center gap-1.5 text-sm text-readable-soft hover:text-readable-strong transition-colors mb-10"
        >
          <ArrowLeft size={14} /> Back to Health
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass rounded-2xl border border-cyan-500/20 p-8 bg-gradient-to-br from-cyan-500/6 to-transparent"
      >
        <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center mb-5">
          <Mail size={20} className="text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Sign in</h1>
        <p className="text-sm text-readable-soft leading-relaxed mb-6">
          Your health metrics are private. Enter your email and I&apos;ll send you a
          one-time magic link — no password needed.
        </p>

        {status === "sent" ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
            <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-sm text-readable-soft">
              Check <span className="text-white font-medium">{email}</span> for a
              sign-in link. You can close this tab once you click it.
            </div>
          </div>
        ) : (
          <form onSubmit={sendLink} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 transition-colors"
            />
            {status === "error" && (
              <p className="text-xs text-red-400">{errorMsg || "Something went wrong."}</p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 px-4 py-3 text-sm font-medium hover:bg-cyan-500/25 transition-colors disabled:opacity-60"
            >
              {status === "sending" ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Sending…
                </>
              ) : (
                <>Send magic link</>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
