import { NextRequest, NextResponse } from "next/server";
import { sendDailyQuoteEmail, sendMoodReminderEmail } from "@/lib/email";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAuthorized(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  return apiKey && apiKey === process.env.NOTIFICATION_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, to, userId } = await req.json();
  const { client: supabaseAdmin, error: clientError } = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: clientError || "Supabase server client is not configured" }, { status: 500 });
  }

  if (!["daily_quote", "mood_reminder"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (!to || typeof to !== "string") {
    return NextResponse.json({ error: "Missing recipient email" }, { status: 400 });
  }

  try {
    if (type === "daily_quote") {
      const { data: quoteList, error: quoteError } = await supabaseAdmin
        .from("quotes")
        .select("id, quote, author")
        .eq("is_active", true)
        .limit(100);

      if (quoteError || !quoteList?.length) {
        return NextResponse.json({ error: "No active quote found" }, { status: 404 });
      }

      const quote = quoteList[Math.floor(Math.random() * quoteList.length)];
      const sendResult = await sendDailyQuoteEmail(to, quote.quote, quote.author);

      if (userId) {
        await supabaseAdmin.from("quote_log").insert({
          user_id: userId,
          quote_id: quote.id,
          delivery_type: "daily_quote",
          status: "sent",
          metadata: { resend_id: sendResult.data?.id || null }
        });
      }

      return NextResponse.json({ ok: true, emailId: sendResult.data?.id || null });
    }

    const reminderResult = await sendMoodReminderEmail(to);
    if (userId) {
      await supabaseAdmin.from("quote_log").insert({
        user_id: userId,
        quote_id: null,
        delivery_type: "mood_reminder",
        status: "sent",
        metadata: { resend_id: reminderResult.data?.id || null }
      });
    }

    return NextResponse.json({ ok: true, emailId: reminderResult.data?.id || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
