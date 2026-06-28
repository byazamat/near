# Near

A private mood-tracking app with a REST API and admin panel, built for two users: an admin and one regular user.

## Stack

- Next.js 16 (App Router)
- Supabase (PostgreSQL)
- Custom JWT auth (`jose`, HttpOnly cookie)
- Tailwind CSS + shadcn/ui
- Telegram notifications (admin) + Firebase Cloud Messaging (push)
- Vercel Cron for the daily mood reminder

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env example and fill in real values:

   ```bash
   cp .env.local.example .env.local
   ```

   | Variable | Description |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
   | `JWT_SECRET` | Secret used to sign session JWTs |
   | `TELEGRAM_BOT_TOKEN` | Bot token for admin notifications |
   | `TELEGRAM_ADMIN_CHAT_ID` | Telegram chat ID that receives notifications |
   | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK service account, for push notifications |
   | `CRON_SECRET` | Bearer token required by `/api/cron/mood-reminder` |

3. Create a user in the `users` table (`role` is `admin` or `user`) with a bcrypt-hashed password:

   ```ts
   import bcrypt from "bcryptjs";
   console.log(await bcrypt.hash("your-password", 10));
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000/login](http://localhost:3000/login).

## Deployment

Deploy to Vercel. The cron schedule in `vercel.json` calls `/api/cron/mood-reminder` daily at 17:00 UTC (22:00 Tashkent time) — Vercel automatically sends the `Authorization: Bearer $CRON_SECRET` header for configured cron jobs.

## Project structure

- `app/api/*` — REST API routes (auth, mood, wishes, location, notifications, push, cron)
- `app/admin/*` — admin panel pages
- `app/login` — login page
- `lib/*` — Supabase clients, auth helpers, Telegram/Firebase integrations
- `proxy.ts` — auth gate for `/admin/*` and `/api/*` (Next.js 16 renamed `middleware` to `proxy`)
- `components/admin/*` — admin panel UI components
- `components/ui/*` — shadcn/ui primitives
