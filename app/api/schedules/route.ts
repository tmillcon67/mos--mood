import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { user, error: userError } = await getUserFromAuthHeader(req);
  if (!user) {
    return NextResponse.json({ error: userError }, { status: 401 });
  }

  const { reminderTime, timezone, emailEnabled, quoteEnabled } = await req.json();

  if (typeof reminderTime !== "string" || !/^\d{2}:\d{2}$/.test(reminderTime)) {
    return NextResponse.json({ error: "Invalid reminderTime. Use HH:MM." }, { status: 400 });
  }

  if (typeof timezone !== "string" || timezone.length < 3) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("schedules")
    .upsert(
      {
        user_id: user.id,
        reminder_time: reminderTime,
        timezone,
        email_enabled: Boolean(emailEnabled),
        quote_enabled: Boolean(quoteEnabled)
      },
      { onConflict: "user_id" }
    )
    .select("id, reminder_time, timezone, email_enabled, quote_enabled")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ schedule: data }, { status: 200 });
}
