import { createBrowserClient } from "@supabase/ssr";

function clean(value?: string) {
  if (!value) return "";
  return value.trim().replace(/^['\"]|['\"]$/g, "");
}

export function createClient() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL) || "http://localhost:54321";
  const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || "public-anon-key";
  return createBrowserClient(url, anonKey);
}
