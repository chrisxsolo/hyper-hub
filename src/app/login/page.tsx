"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Email + password sign-in. No magic link, no email round-trip, no redirect —
// the session is established directly in the browser.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "signing" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus("signing");
    setErrorMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message || "Couldn't sign in. Check your email and password.");
      setStatus("error");
      return;
    }
    router.replace("/health/nutrition");
    router.refresh();
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
          <Lock size={20} className="text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Sign in</h1>
        <p className="text-sm text-readable-soft leading-relaxed mb-6">
          Enter your email and password to manage your private health and nutrition data.
        </p>

        <form onSubmit={signIn} className="space-y-4">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 transition-colors"
          />
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 pr-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-readable-faint hover:text-white transition-colors"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {status === "error" && <p className="text-xs text-red-400">{errorMsg}</p>}
          <button
            type="submit"
            disabled={status === "signing"}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 px-4 py-3 text-sm font-medium hover:bg-cyan-500/25 transition-colors disabled:opacity-60"
          >
            {status === "signing" ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Signing in…
              </>
            ) : (
              <>Sign in</>
            )}
          </button>
        </form>
        <p className="text-[11px] text-readable-faint mt-4">
          You can change your password anytime from Settings on the Nutrition page.
        </p>
      </motion.div>
    </div>
  );
}
