# Ten

> You get 10 chances a day. Choose wisely.

**Live**: https://ten-dating-app.vercel.app  
**Repo**: https://github.com/braxsimmons/ten-dating-app

Seeded admin login: `admin@ten.app` / `admin1234`. Sample users: `ava0@ten.app` … `henry19@ten.app`, all with `password123`.

Ten is a dating app built around scarcity, intention, and higher-stakes
decisions. Every user gets 10 free swipes per day. Out of swipes? Wait until
midnight, or buy a small pack. No subscriptions. No infinite scroll.

This repo is a pnpm monorepo with a Next.js 15 web app, a Prisma database
package, and a shared types/schemas/products package. Mobile (React Native +
Expo) is scoped for a future phase — the web API and shared packages are
designed so it can plug in.

## Stack

- **Web**: Next.js 15 (App Router) · TypeScript · Tailwind CSS · React 19
- **Auth**: Custom JWT cookie sessions (jose + bcrypt). Easy to swap for
  Clerk/NextAuth.
- **Database**: PostgreSQL · Prisma 6
- **Payments**: Stripe Checkout + webhook → credits a `CreditWallet`. Falls
  back to dev fulfillment when `STRIPE_SECRET_KEY` is unset.
- **Image storage**: pluggable (`local` disk by default; Cloudinary/S3 stubs
  ready in `apps/web/src/lib/storage.ts`).
- **Messaging**: server actions + lightweight client polling. Drop-in for
  Pusher/Supabase Realtime later.

## Quick start

```bash

cp .env.example .env


pnpm install


pnpm db:push      # creates tables
pnpm db:seed      # admin + 20 sample users + prompts + 1 sample match


pnpm dev          # http://localhost:3000
```

### Seeded credentials

- `admin@ten.app` / `admin1234` (admin role → goes to `/admin`)
- `ava0@ten.app` / `password123` (regular user)
- Any of the 20 seeded `firstname0..N@ten.app` accounts use `password123`.

## Repo layout

```
apps/
  web/                    Next.js app (landing, auth, /app, /admin, API)
packages/
  database/               Prisma schema, generated client, seed script
  shared/                 zod schemas, products catalog, constants, prompts
```

## Where to look

| What | File |
| --- | --- |
| Daily swipe budget logic | `apps/web/src/lib/swipe.ts` |
| Swipe / match / rewind transactions | `apps/web/src/lib/actions/swipe.ts` |
| Feed candidate query (block/swipe/interest filters) | `apps/web/src/lib/feed.ts` |
| Stripe checkout session + fulfillment | `apps/web/src/lib/actions/purchases.ts` |
| Stripe webhook | `apps/web/src/app/api/stripe/webhook/route.ts` |
| Auth (JWT cookie) | `apps/web/src/lib/auth.ts` |
| Image storage abstraction | `apps/web/src/lib/storage.ts` |
| Product catalog (extras, rewinds, double downs) | `packages/shared/src/products.ts` |
| Schema | `packages/database/prisma/schema.prisma` |
| Seed | `packages/database/prisma/seed.ts` |

## Core flows

### Daily swipes (the whole point)

- Every user gets a configurable daily free limit (default 10, changeable in
  `/admin/config`).
- Viewing a profile is **free** — only `like`/`pass` consumes a swipe.
- Free swipes are consumed first; purchased `extraSwipes` only after.
- Resets at the user's local midnight (we key `DailySwipeUsage` by
  `YYYY-MM-DD` from the server clock — swap for per-user TZ later).
- Out of swipes → purchase modal opens with three packs (5 / 15 / 40).

### Matching

- A `like` checks for a reciprocal `like` (not rewound) and creates a `Match`
  in a single transaction. Pair is normalized so `userAId < userBId`.
- Match modal shows the hidden trait the recipient chose for after-match
  reveal.

### Rewind

- Rewinds the last non-rewound swipe, refunds the swipe (free or extra),
  refunds Double Down if used, and unmatches if the rewind reverses a like
  that had created a match.

### Double Down

- A premium "like" that flags `isDoubleDown=true` on the swipe. The recipient
  sees a "They doubled down" badge, and they get pushed to the front of the
  recipient's feed.

### Reporting / blocking

- Available from the profile sheet. Blocking unmatches an active match and
  filters both directions out of the feed.

## Admin (`/admin`)

- Overview: counts of users, banned, active matches, open reports, paid
  purchases, swipes today.
- Users: search, ban/unban, shadow-ban.
- User detail: wallet view, grant credits, remove photos.
- Reports: ban-and-resolve / resolve / dismiss.
- Config: edit `daily_free_swipe_limit` etc. and toggle feature flags
  (`delayed_match_reveal`, `streaks`, etc.).

## API endpoints

Most flows go through server actions, but a few JSON endpoints exist for
mobile / external use:

- `GET /api/me` — current user + swipe budget
- `GET /api/feed` — candidate cards
- `POST /api/stripe/webhook` — Stripe webhook receiver

Server actions live in `apps/web/src/lib/actions/*.ts` and are typed
end-to-end.

## Stripe setup

Set the three keys in `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Local webhook forwarding:

```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

If `STRIPE_SECRET_KEY` is **not** set, `createCheckoutSession` will mark the
purchase paid immediately so the rest of the app can be developed without
Stripe.

## Image storage

Default: `IMAGE_STORAGE_PROVIDER=local` writes to `apps/web/public/uploads/`.
For production, replace `LocalDiskStorage` in `apps/web/src/lib/storage.ts`
with a Cloudinary or S3 implementation — the interface (`ImageStorage`) is
already defined.

## Mobile (TODO)

The PRD calls for a React Native + Expo client. Recommended next steps:

1. `apps/mobile` workspace with `expo`, `expo-router`, `nativewind`.
2. Reuse `@ten/shared` for schemas/constants/products.
3. Hit the same JSON endpoints (`/api/me`, `/api/feed`) and add JSON variants
   of swipe / message / purchase actions.
4. RevenueCat for IAP — keep `Purchase.provider` enum-friendly so
   `provider="revenuecat"` plugs in alongside `provider="stripe"`.

## Tests (TODO)

Unit/integration tests called for in the PRD are scaffolded as TODOs:

- Daily swipe limit consumption (`getSwipeBudget` / `consumeSwipe`)
- Rewind restores the right credit and unmatches if needed
- Match creation, dedupe, and self-swipe prevention
- Block / unmatch hides the conversation
- Stripe webhook → wallet credit

Add a `vitest` package to the workspace and seed a separate test database
with the existing `prisma/seed.ts` shape.

## Scripts

```
pnpm dev          start the web app
pnpm build        build the web app
pnpm db:push      apply schema (dev)
pnpm db:migrate   create a migration
pnpm db:seed      seed sample data
pnpm db:studio    open Prisma Studio
```

## What's intentionally not built yet

These are scoped out of the MVP per the PRD and clearly stubbed:

- AI moderation / matchmaking
- Subscriptions
- Streaks rewards (model + flag exists; logic TODO)
- Daily Reveal at 8 PM (flag + reveal-now product exist; reveal scheduling
  logic TODO)
- Mobile app
- WebSockets for messaging (we poll the server every 8s — fine for MVP, swap
  for Pusher when scaling)
