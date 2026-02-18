import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

type ApiError = { error: string };
type ApiSuccess = Record<string, unknown>;

function clean(value?: string) {
  if (!value) return "";
  return value.trim().replace(/^['\"]|['\"]$/g, "");
}

function readSupabaseConfig() {
  const url = clean(process.env.SUPABASE_URL) || clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = clean(process.env.SUPABASE_ANON_KEY) || clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return { url, anonKey, serviceRoleKey };
}

function createAdminClient() {
  const { url, serviceRoleKey } = readSupabaseConfig();
  if (!url) {
    return { client: null, error: "Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL" };
  }
  if (!serviceRoleKey) {
    return { client: null, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false }
  });

  return { client, error: null as string | null };
}

async function getAuthenticatedUser(req: NextApiRequest) {
  const { url, anonKey } = readSupabaseConfig();
  if (!url) {
    return { user: null, error: "Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL", status: 500 };
  }
  if (!anonKey) {
    return { user: null, error: "Missing SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY", status: 500 };
  }

  try {
    const ssrClient = createServerClient(url, anonKey, {
      cookies: {
        get(name: string) {
          return req.cookies?.[name];
        },
        set() {
          // Token refresh cookie writes are ignored in this pages API handler.
        },
        remove() {
          // Token refresh cookie removal is ignored in this pages API handler.
        }
      }
    });

    const { data: cookieUserData, error: cookieUserError } = await ssrClient.auth.getUser();
    if (cookieUserData.user) {
      return { user: cookieUserData.user, error: null, status: 200 };
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return {
        user: null,
        error: cookieUserError?.message || "Missing authentication. No valid session cookie or bearer token.",
        status: 401
      };
    }

    const { client: adminClient, error: adminClientError } = createAdminClient();
    if (!adminClient) {
      return { user: null, error: adminClientError || "Supabase server client is not configured", status: 500 };
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data, error } = await adminClient.auth.getUser(token);
    if (error || !data.user) {
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
      console.error(`POST /api/checkins insert failed: ${error.message}`);
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
    console.error(`GET /api/checkins query failed: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ checkins: data });
}
