import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/auth";
import { sendDailyQuoteEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { user, error: userError } = await getUserFromAuthHeader(req);
  if (!user) {
    console.error(`POST /api/email/quote auth failed: ${userError}`);
    return NextResponse.json({ error: userError }, { status: 401 });
  }

  if (!user.email) {
    console.error(`POST /api/email/quote failed: user ${user.id} has no email`);
    return NextResponse.json({ error: "No email found for authenticated user" }, { status: 400 });
  }

  try {
    const { data: quoteList, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .select("id, quote, author")
      .eq("is_active", true)
      .limit(100);

    if (quoteError || !quoteList?.length) {
      const message = quoteError?.message || "No active quote found";
      console.error(`POST /api/email/quote failed: user_id=${user.id} error=${message}`);
      return NextResponse.json({ error: message }, { status: 404 });
    }

    const quote = quoteList[Math.floor(Math.random() * quoteList.length)];
    const { data, error } = await sendDailyQuoteEmail(user.email, quote.quote, quote.author);
    console.info("POST /api/email/quote resend response", { data, error });

    if (!data?.id) {
      if (error) {
        console.error("POST /api/email/quote resend error", {
          status: (error as { statusCode?: number }).statusCode ?? null,
          message: error.message,
          name: error.name
        });
      }
      console.error(`POST /api/email/quote failed: user_id=${user.id} email send did not return data.id`);
      return NextResponse.json({ error: error?.message || "Failed to send quote email" }, { status: 500 });
    }

    const { error: logError } = await supabaseAdmin.from("quote_log").insert({
      user_id: user.id,
      quote_id: quote.id,
      delivery_type: "daily_quote",
      status: "sent",
      metadata: { resend_id: data.id, source: "manual_trigger" }
    });

    if (logError) {
      console.error(`POST /api/email/quote log insert failed: user_id=${user.id} error=${logError.message}`);
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    console.info(
      `POST /api/email/quote success: user_id=${user.id} email=${user.email} quote_id=${quote.id} resend_id=${data.id}`
    );

    return NextResponse.json({
      ok: true,
      emailId: data.id,
      quoteId: quote.id,
      message: "Quote email sent"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error(`POST /api/email/quote failed: user_id=${user.id} error=${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
