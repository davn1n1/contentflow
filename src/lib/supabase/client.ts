import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build/prerender, env vars may be empty. Provide fallback so the
  // module can be evaluated without throwing. No real queries execute at build time.
  return createBrowserClient(
    url || "https://placeholder.supabase.co",
    key || "placeholder-key"
  );
}
