import { NextRequest } from "next/server";
import { createSSRClient } from "@/lib/supabase-ssr";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export async function getUserFromAuthHeader(req: NextRequest) {
  let cookieUserError: string | null = null;
  try {
    const ssrClient = createSSRClient();
    const { data: cookieUserData, error } = await ssrClient.auth.getUser();
    cookieUserError = error?.message || null;

    if (cookieUserData.user) {
      return { user: cookieUserData.user, error: null, status: 200 };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initialize auth session client";
    return { user: null, error: message, status: 500 };
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return {
      user: null,
      error: cookieUserError || "Missing authentication. No valid session cookie or bearer token.",
      status: 401
    };
  }

  const { client, error: adminClientError } = getSupabaseAdminClient();
  if (!client) {
    return { user: null, error: adminClientError || "Supabase server client is not configured", status: 500 };
  }

  const token = auth.replace("Bearer ", "").trim();
  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: error?.message || "Invalid token", status: 401 };
  }

  return { user: data.user, error: null, status: 200 };
}
