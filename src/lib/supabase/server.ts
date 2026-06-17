import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Server-side Supabase client (Server Components, Route Handlers).
// cookies() is async in Next 16, so this helper is async too.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore; the proxy
            // refreshes the session cookie on the next request.
          }
        },
      },
    },
  );
}

// Returns the server client plus the signed-in viewer's email, for page server
// components that only need to know "who is this / is it the owner".
//
// Uses getClaims() rather than getUser(): getClaims reads the session from the
// cookie and verifies the JWT *locally* using the project's signing keys (no
// round-trip to the Auth server). The proxy already refreshes the session
// cookie before the page renders, so the token read here is fresh. For legacy
// symmetric (HS256) keys getClaims transparently falls back to a network
// getUser(), so this is never slower than before — and much faster otherwise,
// which removes a per-navigation auth round-trip from every tool/health page.
export async function getViewer(): Promise<{
  supabase: SupabaseClient;
  email: string | null;
}> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = (data?.claims?.email as string | undefined) ?? null;
  return { supabase, email };
}
