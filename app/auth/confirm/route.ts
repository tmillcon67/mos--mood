import { NextRequest, NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabase-ssr";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") || "/today";
  const allowedTypes = new Set(["signup", "invite", "magiclink", "recovery", "email", "email_change"]);

  if (token_hash && type && allowedTypes.has(type)) {
    const supabase = createSSRClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "invite" | "magiclink" | "recovery" | "email" | "email_change",
      token_hash
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
}
