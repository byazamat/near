@AGENTS.md

# Near — Backend + Admin Panel

Private mood-tracking app for exactly two users: **admin** (role `admin`) and one **regular user** (role `user`). No public signup, no multi-tenancy — don't add abstractions for more users/roles than that.

## Tech stack

- Next.js 16 (App Router, Turbopack) — see `AGENTS.md` / `node_modules/next/dist/docs/` for breaking changes vs. Next 15 you may know (e.g. `middleware.ts` → `proxy.ts`, async `cookies()`/`headers()`/route `params`).
- Supabase (PostgreSQL) via `@supabase/supabase-js` — no ORM. Tables already exist in Supabase; **never** generate `schema.sql` or migrations.
- Auth: custom JWT (`jose`), HttpOnly cookie named `token`, bcrypt (`bcryptjs`) for password hashing.
- Styling: Tailwind CSS v4 + shadcn/ui (style `radix-nova`, base color `neutral`). Font is **Nunito** (`--font-sans`, latin+cyrillic) — UI copy is in Russian (`<html lang="ru">`).
- Telegram (`node-telegram-bot-api`) for admin notifications, Firebase Admin SDK (FCM) for push to the mobile app. Both helpers swallow errors (`console.log` only, never throw).
- Deploy target: Vercel free tier + Supabase free tier. Cron via `vercel.json` (`/api/cron/mood-reminder`, `0 17 * * *` = 22:00 Tashkent).

## Auth model

- `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`) gates:
  - `/admin/*` — redirects to `/login` unless the JWT cookie is valid **and** `role === "admin"`.
  - `/api/*` except `/api/auth/*` and `/api/cron/*` — 401 JSON if no valid JWT.
  - Forwards `x-user-id` / `x-user-role` / `x-user-username` headers downstream (not currently read by route handlers — they re-verify via `getAuthUser(request)` from `lib/auth.ts`, which is the single source of truth).
- `/api/cron/*` uses `Authorization: Bearer $CRON_SECRET` instead of the cookie — excluded from the proxy's JWT check, checked inside the route itself.
- `lib/auth.ts`: `signJWT`, `verifyJWT`, `getAuthUser(request)`, `hashPassword`, `verifyPassword`.

## Database tables (Supabase, already created — do not modify schema)

- `users` (id, username, password_hash, role, fcm_token, created_at)
- `mood_entries` (id, user_id, score, comment, date, created_at) — unique `(user_id, date)`, upserted via `onConflict: "user_id,date"`
- `wishes` (id, user_id, title, description, category, status, admin_note, created_at, updated_at)
- `location_calls` (id, user_id, latitude, longitude, address, status, created_at)
- `notifications` (id, user_id, title, body, type, is_read, metadata, created_at)

Dates are stored in UTC; Tashkent = UTC+5.

## Wishes: status state machine

Enforced server-side in `app/api/wishes/[id]/status/route.ts` — never trust client-provided transitions.

| Status | Who can change it | Allowed next |
|---|---|---|
| `waiting` | admin | `in_progress`, `cancelled` |
| `in_progress` | admin | `pending_confirmation`, `cancelled` |
| `pending_confirmation` | user | `fulfilled`, `waiting` |
| `fulfilled` / `cancelled` | — | terminal |

- For role `user`, API responses mask `in_progress` as the string `"🤫 Сюрприз в процессе"` (see `maskWish` in `app/api/wishes/route.ts`). `admin_note` is stripped from non-admin responses there too.
- `admin_note` itself is updated via a separate `PATCH /api/wishes/[id]` (admin-only) — not part of the status endpoint.
- Categories: `sparkle` → "✨ Маленькие радости", `dream` → "🌙 Большие мечты", `desire` → "🔥 Страстные желания" (labels live in `components/admin/WishCard.tsx`, not in the DB).

## Notifications + external integrations

- `lib/notifications.ts`: `createAndSendNotification()` inserts a row and optionally fetches the target user's `fcm_token` and calls `sendPush`.
- Telegram (`sendToAdmin`) fires on: mood entry saved, wish created, wish confirmed fulfilled, location call created.
- FCM push fires on: admin wish-status changes (via notifications), location call marked `on_the_way`, daily mood-reminder cron (skips users who already logged today).

## Project structure notes

- `app/admin/page.tsx` and `app/admin/mood/page.tsx` are Server Components reading Supabase directly and **must** keep `export const dynamic = "force-dynamic"` — without it Next statically prerenders them at build time with stale data.
- `app/admin/wishes/page.tsx` and `app/admin/location/page.tsx` are client components that fetch from the REST API and poll/optimistically update — keep that pattern for consistency rather than mixing server-fetched + client-fetched data on the same page.
- `components/admin/*` are UI pieces specific to the admin panel; `components/ui/*` are shadcn primitives — add new shadcn pieces with `npx shadcn@latest add <name>` rather than hand-rolling Radix wrappers.
- `hooks/useAuth.ts` is the client-side session hook (`/api/auth/me`), used for `logout()` in the admin layout.
- Known intentional `eslint-disable` usages: `react-hooks/set-state-in-effect` on the three mount-time poll effects (`NotificationBell`, `admin/location/page.tsx`, `admin/wishes/page.tsx`) — this is the standard fetch-on-mount-and-poll pattern, not a bug.

## Conventions to keep

1. Every API route checks auth via `getAuthUser(request)` → 401 if missing, 403 if role insufficient. No route should trust client-forwarded headers for authorization.
2. Telegram/FCM calls are always wrapped in try/catch inside `lib/telegram.ts` / `lib/firebase-admin.ts` — call sites never need their own try/catch around them.
3. Use `supabaseAdmin` (service role) in all server-side code (API routes, server components). Only use the anon `supabase` client if something genuinely needs to run client-side under RLS — nothing currently does.
4. Status transitions, masking, and `admin_note` visibility are enforced in the route handlers, not in the UI — the UI hides things for UX but the API is the actual security boundary.
