// Shared server-side helpers for owner-gated API routes: auth context, typed
// JSON responses with request IDs. Mirrors the pattern in lib/nutrition/server.ts
// so the health-notes and grocery routes use the same boundary. Never logs
// secrets or authorization headers.

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
  console.error(`[health] ${status} rid=${rid} ${message}`);
  return NextResponse.json(
    { error: message, requestId: rid, ...(extra ?? {}) },
    { status, headers: { "x-request-id": rid } },
  );
}

export function jsonOk(data: Record<string, unknown>, rid: string, status = 200) {
  return NextResponse.json({ ...data, requestId: rid }, { status, headers: { "x-request-id": rid } });
}
