import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { user, error: userError } = await getUserFromAuthHeader(req);
  if (!user) {
    return NextResponse.json({ error: userError }, { status: 401 });
  }

  const body = await req.json();
  const mood = body?.mood;
  const note = body?.note;

  if (!Number.isInteger(mood) || mood < 1 || mood > 10) {
    return NextResponse.json({ error: "Mood must be an integer between 1 and 10" }, { status: 400 });
  }

  // Never trust user_id from client input; ownership comes from authenticated session.
  const { data, error } = await supabaseAdmin
    .from("checkins")
    .insert({ user_id: user.id, mood, note: note || null })
    .select("id, mood, note, checkin_at")
    .single();

  if (error) {
    console.error(`POST /api/checkins insert failed: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ checkin: data }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { user, error: userError } = await getUserFromAuthHeader(req);
  if (!user) {
    return NextResponse.json({ error: userError }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("checkins")
    .select("id, mood, note, checkin_at")
    .eq("user_id", user.id)
    .order("checkin_at", { ascending: false });

  if (error) {
    console.error(`GET /api/checkins query failed: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ checkins: data }, { status: 200 });
}
