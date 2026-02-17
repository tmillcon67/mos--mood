import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailKind = "daily_quote" | "mood_reminder";

export async function sendDailyQuoteEmail(to: string, quote: string, author: string) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: "Your daily Roman quote",
    html: `<p>Daily reflection from Mos Mood:</p><blockquote>${quote}</blockquote><p>- ${author}</p>`
  });
}

export async function sendMoodReminderEmail(to: string) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: "Mood check-in reminder",
    html: "<p>Take one minute to log your mood in Mos Mood today.</p>"
  });
}
