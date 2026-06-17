// Shared server-side helpers for the nutrition API boundary: owner auth, typed
// JSON responses with request IDs, and a best-effort rate limiter. Never logs
// API keys or authorization headers.

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const OWNER_EMAIL = "chrissolorzano118@gmail.com";

export function requestId(): string {
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
}

export async function getAuthContext(): Promise<{
  supabase: SupabaseClient;
  email: string | null;
  isOwner: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? null;
  return { supabase, email, isOwner: email === OWNER_EMAIL };
}

export function jsonError(status: number, message: string, rid: string, extra?: Record<string, unknown>) {
  // Structured server log (no secrets, no headers).
  console.error(`[nutrition] ${status} rid=${rid} ${message}`);
  return NextResponse.json(
    { error: message, requestId: rid, ...(extra ?? {}) },
    { status, headers: { "x-request-id": rid } },
  );
}

export function jsonOk(data: Record<string, unknown>, rid: string, status = 200) {
  return NextResponse.json({ ...data, requestId: rid }, { status, headers: { "x-request-id": rid } });
}

// In-memory token bucket — best-effort throttle for the expensive AI route.
// Resets on cold start; that's acceptable for a single-owner personal tool.
const buckets = new Map<string, { tokens: number; resetAt: number }>();
export function rateLimit(key: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { tokens: max - 1, resetAt: now + windowMs });
    return true;
  }
  if (b.tokens <= 0) return false;
  b.tokens -= 1;
  return true;
}
