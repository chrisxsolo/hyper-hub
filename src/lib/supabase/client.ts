import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Reads the session from cookies set by the
// server client / proxy, so RLS runs as the logged-in user.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
  );
}
