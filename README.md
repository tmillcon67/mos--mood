# Mos Mood (v1)

Next.js app for daily mood tracking with Supabase magic-link auth, check-in history/reports, scheduling preferences, and Resend email notifications.

## Features in v1

- Routes: `/login`, `/today`, `/history`, `/reports`, `/settings`
- Supabase magic-link auth flow
- Supabase-backed data model:
  - `checkins`
  - `schedules`
  - `quotes`
  - `quote_log`
- API routes:
  - `POST /api/checkins`
  - `GET /api/checkins`
  - `POST /api/schedules`
  - `POST /api/notifications/email` (daily Roman quote or mood reminder)
- Email sending with Resend
- SQL schema + row-level security policies in `db/schema.sql`
- No SMS or push notifications (intentionally omitted)

## Tech stack

- Next.js App Router + TypeScript
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- Resend

## Local development

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Configure Supabase:
- Create a Supabase project.
- In Supabase SQL Editor, run `db/schema.sql`.
- In Supabase Auth settings, set site URL to `http://localhost:3000`.
- Add `http://localhost:3000/auth/confirm` as an auth redirect URL.

4. Configure Resend:
- Create a Resend API key.
- Verify a sending domain/address.
- Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `.env.local`.

5. Start dev server:

```bash
npm run dev
```

## Email API usage

Endpoint: `POST /api/notifications/email`

Headers:
- `Content-Type: application/json`
- `x-api-key: <NOTIFICATION_API_KEY>`

Body options:

```json
{
  "type": "daily_quote",
  "to": "user@example.com",
  "userId": "optional-user-uuid"
}
```

```json
{
  "type": "mood_reminder",
  "to": "user@example.com"
}
```

## API auth pattern for checkins/schedules

For user-authenticated routes, pass the Supabase access token:

`Authorization: Bearer <access_token>`

## Prepare for GitHub

A git repository already exists locally. To publish to GitHub:

```bash
git add .
git commit -m "feat: scaffold Mos Mood v1"
git branch -M main
git remote add origin git@github.com:<your-user>/<your-repo>.git
git push -u origin main
```

## Notes

- This v1 focuses on email notifications only.
- SMS and push notification channels are not implemented by design.
