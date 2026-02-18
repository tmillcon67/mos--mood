import { createBrowserClient } from "@supabase/ssr";

function clean(value?: string) {
  if (!value) return "";
  return value.trim().replace(/^['\"]|['\"]$/g, "");
}

export function createClient() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment.");
  }
  if (!anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment.");
  }

  return createBrowserClient(url, anonKey);
}
