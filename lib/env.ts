function clean(value?: string) {
  if (!value) return "";
  return value.trim().replace(/^['\"]|['\"]$/g, "");
}

export function getSupabaseUrl() {
  const value = clean(process.env.SUPABASE_URL) || clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!value) {
    throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  }
  return value;
}

export function getSupabaseAnonKey() {
  const value = clean(process.env.SUPABASE_ANON_KEY) || clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!value) {
    throw new Error("Missing SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return value;
}

export function getSupabaseServiceRoleKey() {
  const value = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!value) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return value;
}

export function getPublicSupabaseUrl() {
  const value = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return value;
}

export function getPublicSupabaseAnonKey() {
  const value = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return value;
}
