import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type ApiError = { error: string };
type ApiSuccess = Record<string, unknown>;

function clean(value?: string) {
  if (!value) return "";
  return value.trim().replace(/^['\"]|['\"]$/g, "");
}

function readSupabaseConfig() {
  const url = clean(process.env.SUPABASE_URL);
  const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return { url, serviceRoleKey };
}

function createAdminClient() {
  const { url, serviceRoleKey } = readSupabaseConfig();
  if (!url) {
    return { client: null, error: "Missing SUPABASE_URL" };
  }
  if (!serviceRoleKey) {
    return { client: null, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false }
  });

  return { client, error: null as string | null };
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

function isLikelyJwt(value: string) {
  return value.split(".").length === 3;
}

function parseAccessTokenFromCookieValue(rawValue: string) {
  const candidates = [rawValue, decodeURIComponent(rawValue)];

  for (const candidate of candidates) {
    if (isLikelyJwt(candidate)) return candidate;

    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (typeof parsed === "string" && isLikelyJwt(parsed)) return parsed;

      if (Array.isArray(parsed)) {
        const token = parsed.find((v) => typeof v === "string" && isLikelyJwt(v));
        if (typeof token === "string") return token;
      }

      if (
        parsed &&
        typeof parsed === "object" &&
        "access_token" in parsed &&
        typeof (parsed as { access_token?: unknown }).access_token === "string"
      ) {
        const token = (parsed as { access_token: string }).access_token;
        if (isLikelyJwt(token)) return token;
      }
    } catch {
      // Ignore parse errors and try the next candidate.
    }
  }

  return null;
}

function getAccessTokenFromCookies(req: NextApiRequest) {
  const cookieEntries = Object.entries(req.cookies || {}).filter(([name]) =>
    /(?:^|-)auth-token(?:\.\d+)?$/.test(name)
  );

  if (!cookieEntries.length) return null;

  cookieEntries.sort(([a], [b]) => {
    const ai = Number(a.split(".").pop());
    const bi = Number(b.split(".").pop());
    if (Number.isNaN(ai) || Number.isNaN(bi)) return a.localeCompare(b);
    return ai - bi;
  });

  const combined = cookieEntries.map(([, value]) => value).join("");
  return parseAccessTokenFromCookieValue(combined);
}

async function getAuthenticatedUser(req: NextApiRequest) {
  const { client: adminClient, error: adminClientError } = createAdminClient();
  if (!adminClient) {
    return { user: null, error: adminClientError || "Supabase server client is not configured", status: 500 };
  }

  try {
    const authHeader = req.headers.authorization?.trim();
    let token: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    }

    if (!token) {
      token = getAccessTokenFromCookies(req);
    }

    if (!token) {
      return { user: null, error: "Missing authentication. No valid session cookie or bearer token.", status: 401 };
    }

    const { data, error } = await adminClient.auth.getUser(token);
    if (error || !data.user) {
      if (error) {
        logSupabaseError("Auth token verification failed", error);
      }
      return { user: null, error: error?.message || "Invalid token", status: 401 };
    }

    return { user: data.user, error: null, status: 200 };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initialize authentication client";
    return { user: null, error: message, status: 500 };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiError | ApiSuccess>) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user, error: userError, status } = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(status || 401).json({ error: userError || "Unauthorized" });
  }

  const { client: supabaseAdmin, error: clientError } = createAdminClient();
  if (!supabaseAdmin) {
    return res.status(500).json({ error: clientError || "Supabase server client is not configured" });
  }

  if (req.method === "POST") {
    const mood = req.body?.mood;
    const note = req.body?.note;

    if (!Number.isInteger(mood) || mood < 1 || mood > 10) {
      return res.status(400).json({ error: "Mood must be an integer between 1 and 10" });
    }

  const { data, error } = await supabaseAdmin
    .from("checkins")
    .insert({ user_id: user.id, mood, note: note || null })
      .select("id, mood, note, checkin_at")
      .single();

  if (error) {
    logSupabaseError("POST /api/checkins insert failed", error);
    return res.status(500).json({ error: error.message });
  }

    return res.status(201).json({ checkin: data });
  }

  const { data, error } = await supabaseAdmin
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
