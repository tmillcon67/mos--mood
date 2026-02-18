import { Resend } from "resend";

export type EmailKind = "daily_quote" | "mood_reminder";

function clean(value?: string) {
  if (!value) return "";
  return value.trim().replace(/^['\"]|['\"]$/g, "");
}

function getResendConfig() {
  const apiKey = clean(process.env.RESEND_API_KEY);
  const from = clean(process.env.RESEND_FROM_EMAIL);

  if (!apiKey) {
    return { resend: null, from: null, error: "Missing RESEND_API_KEY" };
  }
  if (!from) {
    return { resend: null, from: null, error: "Missing RESEND_FROM_EMAIL" };
  }

  return { resend: new Resend(apiKey), from, error: null as string | null };
}

export async function sendDailyQuoteEmail(to: string, quote: string, author: string) {
  const { resend, from, error } = getResendConfig();
  if (!resend || !from) {
    throw new Error(error || "Resend configuration is invalid");
  }

  return resend.emails.send({
    from,
    to,
    subject: "Your daily Roman quote",
    html: `<p>Daily reflection from Mos Mood:</p><blockquote>${quote}</blockquote><p>- ${author}</p>`
  });
}

export async function sendMoodReminderEmail(to: string) {
  const { resend, from, error } = getResendConfig();
  if (!resend || !from) {
    throw new Error(error || "Resend configuration is invalid");
  }

  return resend.emails.send({
    from,
    to,
    subject: "Mood check-in reminder",
    html: "<p>Take one minute to log your mood in Mos Mood today.</p>"
  });
}
