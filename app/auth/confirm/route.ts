import { NextRequest, NextResponse } from "next/server";
import { createSSRClient } from "@/lib/supabase-ssr";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const authFailedRedirect = new URL("/login?error=auth_failed", request.url);

  if (!code) {
    console.error("Auth callback failed: missing code query param");
    return NextResponse.redirect(authFailedRedirect);
  }

  let supabase;
  try {
    supabase = createSSRClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initialize Supabase auth client";
    console.error(`Auth callback failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(`Auth callback failed: ${error.message}`);
    return NextResponse.redirect(authFailedRedirect);
  }

  return NextResponse.redirect(new URL("/today", request.url));
}
