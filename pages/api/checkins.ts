import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type ApiError = { error: string };
type ApiSuccess = Record<string, unknown>;

function clean(value?: string) {
  if (!value) return "";
  return value.trim().replace(/^['\"]|['\"]$/g, "");
}

function logSupabaseError(context: string, error: unknown) {
  const err = error as
    | {
        message?: string;
        code?: string;
        details?: string;
        hint?: string;
        status?: number;
        statusCode?: number;
      }
    | undefined;

  console.error(context, {
    status: err?.status ?? err?.statusCode ?? null,
    message: err?.message ?? "unknown",
    code: err?.code ?? null,
    details: err?.details ?? null,
    hint: err?.hint ?? null
  });
}

function createAnonClient() {
  const url = clean(process.env.SUPABASE_URL);
  const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url) {
    return { client: null, error: "Missing SUPABASE_URL" };
  }
  if (!anonKey) {
    return { client: null, error: "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY" };
  }

  return {
    client: createClient(url, anonKey, {
      auth: { persistSession: false }
    }),
    error: null as string | null
  };
}

function createServiceRoleClient() {
  const url = clean(process.env.SUPABASE_URL);
  const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url) {
    return { client: null, error: "Missing SUPABASE_URL" };
  }
  if (!serviceRoleKey) {
    return { client: null, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  return {
    client: createClient(url, serviceRoleKey, {
      auth: { persistSession: false }
    }),
    error: null as string | null
  };
}

async function getVerifiedUserFromBearerToken(req: NextApiRequest) {
  const authHeader = req.headers.authorization?.trim();
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, error: "Missing Authorization Bearer token", status: 401 };
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return { user: null, error: "Missing Authorization Bearer token", status: 401 };
  }

  const { client: supabaseAnon, error: anonClientError } = createAnonClient();
  if (!supabaseAnon) {
    return { user: null, error: anonClientError || "Supabase anon client is not configured", status: 500 };
  }

  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data.user) {
    if (error) {
      logSupabaseError("Auth token verification failed", error);
    }
    return { user: null, error: error?.message || "Invalid token", status: 401 };
  }

  return { user: data.user, error: null, status: 200 };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiError | ApiSuccess>) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user, error: authError, status: authStatus } = await getVerifiedUserFromBearerToken(req);
  if (!user) {
    return res.status(authStatus || 401).json({ error: authError || "Unauthorized" });
  }

  const { client: supabaseServiceRole, error: serviceRoleClientError } = createServiceRoleClient();
  if (!supabaseServiceRole) {
    return res.status(500).json({ error: serviceRoleClientError || "Supabase service role client is not configured" });
  }

  if (req.method === "POST") {
    const mood = req.body?.mood;
    const note = req.body?.note;

    if (!Number.isInteger(mood) || mood < 1 || mood > 10) {
      return res.status(400).json({ error: "Mood must be an integer between 1 and 10" });
    }

    const { data, error } = await supabaseServiceRole
      .from("checkins")
      .insert({ user_id: user.id, mood, note: note || null })
      .select("id, mood, note, checkin_at")
      .single();

    if (error) {
      logSupabaseError("POST /api/checkins insert failed", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ checkin: data });
  }

  const { data, error } = await supabaseServiceRole
    .from("checkins")
    .select("id, mood, note, checkin_at")
    .eq("user_id", user.id)
    .order("checkin_at", { ascending: false });

  if (error) {
    logSupabaseError("GET /api/checkins query failed", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ checkins: data });
}
