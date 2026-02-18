import { NextRequest } from "next/server";
import { createSSRClient } from "@/lib/supabase-ssr";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function getUserFromAuthHeader(req: NextRequest) {
  const ssrClient = createSSRClient();
  const { data: cookieUserData, error: cookieUserError } = await ssrClient.auth.getUser();

  if (cookieUserData.user) {
    return { user: cookieUserData.user, error: null };
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return {
      user: null,
      error: cookieUserError?.message || "Missing authentication. No valid session cookie or bearer token."
    };
  }

  const token = auth.replace("Bearer ", "").trim();
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: error?.message || "Invalid token" };
  }

  return { user: data.user, error: null };
}
