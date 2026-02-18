import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/auth";
import { sendMoodReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const { user, error: userError, status } = await getUserFromAuthHeader(req);
  if (!user) {
    console.error(`POST /api/email/checkin auth failed: ${userError}`);
    return NextResponse.json({ error: userError }, { status: status || 401 });
  }

  if (!user.email) {
    console.error(`POST /api/email/checkin failed: user ${user.id} has no email`);
    return NextResponse.json({ error: "No email found for authenticated user" }, { status: 400 });
  }

  try {
    const { data, error } = await sendMoodReminderEmail(user.email);
    console.info("POST /api/email/checkin resend response", { data, error });

    if (!data?.id) {
      if (error) {
        console.error("POST /api/email/checkin resend error", {
          status: (error as { statusCode?: number }).statusCode ?? null,
          message: error.message,
          name: error.name
        });
      }
      console.error(`POST /api/email/checkin failed: user_id=${user.id} email send did not return data.id`);
      return NextResponse.json({ error: error?.message || "Failed to send check-in reminder email" }, { status: 500 });
    }

    console.info(`POST /api/email/checkin success: user_id=${user.id} email=${user.email} resend_id=${data.id}`);

    return NextResponse.json({
      ok: true,
      emailId: data.id,
      message: "Check-in reminder email sent"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error(`POST /api/email/checkin failed: user_id=${user.id} error=${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
