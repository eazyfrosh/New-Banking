# Novaofficial — Modern Digital Banking Platform

A full-featured, premium fintech demo built with Next.js 15, React 19, TypeScript,
Tailwind CSS, Shadcn UI, Framer Motion, Firebase and Recharts. Fully serverless —
deploys straight to Vercel with no custom backend.

> This is a demo application. All balances, cards and transactions are simulated.
> No real money is held or transferred.

## Tech stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript (strict)
- **UI:** Tailwind CSS v4, Shadcn UI (hand-rolled from Radix primitives), Lucide icons, Framer Motion
- **Data:** Firebase Authentication, Firestore, Firebase Storage
- **Server logic:** Next.js Server Actions + Route Handlers, running on Vercel serverless functions, using the Firebase Admin SDK for privileged writes
- **Forms:** React Hook Form + Zod
- **Client data/cache:** TanStack Query (admin lists) + Firestore real-time listeners (customer dashboard)
- **Charts:** Recharts
- **Exports:** jsPDF + PapaParse for statement PDF/CSV export

No Express, no custom Node server, no Docker, no Cloud Functions — everything
runs as Next.js Server Actions/Route Handlers on Vercel.

## Project structure

```
app/                    Routes (App Router)
  (auth)/               Login, register, forgot password, verify email
  dashboard/            Customer dashboard + all customer features
  admin/                Admin dashboard + platform management
components/
  ui/                   Shadcn-style primitives (button, card, dialog, ...)
  landing/              Marketing site sections
  dashboard/             Customer dashboard widgets & feature UIs
  admin/                Admin widgets, tables & charts
  auth/                 Auth forms + route guards
  providers/            Auth/Query/Theme context providers
  shared/               Cross-cutting UI (logo, empty state, animated counter)
lib/
  firebase/             Client + Admin SDK initialization
  services/             Firestore read helpers (client SDK)
  actions/              Server Actions (Admin SDK, privileged writes)
  validations/          Zod schemas
hooks/                  Realtime Firestore hooks + TanStack Query hooks
types/                  Shared domain types
firestore.rules         Firestore security rules
storage.rules           Storage security rules
```

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Firebase project credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Firebase setup guide

1. **Create a project** at [console.firebase.google.com](https://console.firebase.google.com).
2. **Enable Authentication** → Sign-in method → enable **Email/Password**.
3. **Create a Firestore database** (production mode) in a region close to your users.
4. **Enable Storage**.
5. **Register a Web App** (Project settings → General → Your apps → Web) and copy
   the config values into `NEXT_PUBLIC_FIREBASE_*` in `.env.local`.
6. **Generate a service account key** (Project settings → Service accounts →
   Generate new private key) and copy `project_id`, `client_email` and
   `private_key` into `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and
   `FIREBASE_PRIVATE_KEY`. Keep the `\n` sequences in the private key intact.
7. **Deploy security rules** using the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore storage   # point at this repo, reuse firestore.rules / storage.rules
   firebase deploy --only firestore:rules,storage:rules
   ```
8. **Create your first admin user**: register a normal account through the app,
   then in the Firestore console open that user's document under `users/{uid}`
   and change `role` from `customer` to `admin`.

### Data model

All application data lives in Firestore under top-level collections: `users`,
`accounts`, `transactions`, `cards`, `savingsPlans`, `loans`, `investments`,
`billPayments`, `notifications`, `supportTickets`, `fraudAlerts`. See
`types/index.ts` for the full shape of each document.

Reads happen directly from the client SDK (subject to `firestore.rules`).
Every write that touches balances, limits, roles, or another user's data goes
through a Server Action in `lib/actions/*` using the Firebase Admin SDK, so
sensitive logic (PIN verification, balance checks, rate limiting) never runs
on the client.

## Vercel deployment guide

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com/new), import the repository.
3. Add the environment variables from `.env.example` in **Project Settings →
   Environment Variables** (both `NEXT_PUBLIC_*` client config and the
   server-only `FIREBASE_*` admin credentials).
4. Deploy — Vercel auto-detects Next.js and runs `next build`.
5. In Firebase Console → Authentication → Settings → Authorized domains, add
   your `*.vercel.app` domain (and any custom domain) so sign-in works in
   production.

No additional infrastructure, containers, or servers are required.

## Security notes

- Firebase client config (`NEXT_PUBLIC_*`) is safe to expose — access is
  controlled by `firestore.rules` / `storage.rules`, not by hiding the config.
- Server-only secrets (`FIREBASE_PRIVATE_KEY`, etc.) are never sent to the
  client and are only read inside Server Actions (`"use server"` files).
- Transfers and card PIN reveals require a transaction PIN, hashed with
  `scrypt` and rate-limited (5 attempts / 15 minutes) via a Firestore-backed
  limiter in `lib/actions/rate-limit.ts`.
- All forms are validated with Zod on both the client and inside Server
  Actions before any privileged write occurs.

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build (type-checks + lints)
npm run start    # run the production build locally
npm run lint     # ESLint
```
