import { NextRequest, NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabase-ssr";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const authFailedRedirect = new URL("/login?error=auth_failed", request.url);

  if (!code) {
    console.error("Auth callback failed: missing code query param");
    return NextResponse.redirect(authFailedRedirect);
  }

  const supabase = createSSRClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(`Auth callback failed: ${error.message}`);
    return NextResponse.redirect(authFailedRedirect);
  }

  return NextResponse.redirect(new URL("/today", request.url));
}
