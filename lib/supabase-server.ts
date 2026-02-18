import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

function clean(value?: string) {
  if (!value) return "";
  return value.trim().replace(/^['\"]|['\"]$/g, "");
}

function readSupabaseServerEnv() {
  const url = clean(process.env.SUPABASE_URL) || clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url) {
    return { url: null, serviceRoleKey: null, error: "Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL" };
  }

  if (!serviceRoleKey) {
    return { url: null, serviceRoleKey: null, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  return { url, serviceRoleKey, error: null };
}

export function getSupabaseAdminClient() {
  if (cachedClient) {
    return { client: cachedClient, error: null as string | null };
  }

  const env = readSupabaseServerEnv();
  if (env.error || !env.url || !env.serviceRoleKey) {
    return { client: null, error: env.error || "Invalid Supabase server configuration" };
  }

  cachedClient = createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false }
  });

  return { client: cachedClient, error: null as string | null };
}
