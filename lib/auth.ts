import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function getUserFromAuthHeader(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return { user: null, error: "Missing bearer token" };
  }

  const token = auth.replace("Bearer ", "").trim();
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: "Invalid token" };
  }

  return { user: data.user, error: null };
}
