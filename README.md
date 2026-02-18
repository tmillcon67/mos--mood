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
  - `notification_tokens`
- API routes:
  - `POST /api/checkins`
  - `GET /api/checkins`
  - `POST /api/schedules`
  - `POST /api/email/checkin` (manual reminder trigger)
  - `POST /api/email/quote` (manual quote trigger + quote_log insert)
  - `POST /api/notifications/email` (daily Roman quote or mood reminder)
- Email sending with Resend
- SQL schema + phased row-level security migrations in `db/migrations`
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

## Manual email testing (no cron)

- `POST /api/email/checkin`: sends a reminder email to the authenticated user's email.
- `POST /api/email/quote`: picks a random active quote, sends it to the authenticated user, then inserts a `quote_log` row.
- Temporary testing buttons are available in `/settings` to trigger both endpoints.

## API auth pattern for checkins/schedules

The app uses Supabase session cookies (set by `/auth/confirm`) for API authentication.
Bearer token fallback is supported server-side, but not required for browser usage.

## RLS rollout (safe)

Run migrations in Supabase SQL Editor in this order:

1. Phase 1 (`checkins` only):

```sql
-- paste file contents:
-- db/migrations/20260217_001_checkins_rls.sql
```

2. Validate checkins:
- Login and save an entry on `/today`.
- Confirm users only read/write their own check-ins.

3. Phase 2 (remaining tables and quotes read-only):

```sql
-- paste file contents:
-- db/migrations/20260217_002_phase2_rls.sql
```

4. Refresh PostgREST schema cache:

```sql
select pg_notify('pgrst', 'reload schema');
```

Notes:
- `quotes` is read-only for authenticated users in Phase 2.
- No client insert/update/delete policy is created for `quotes`.
- In app code, `checkins.user_id` is always derived from authenticated session in `/api/checkins`.

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
