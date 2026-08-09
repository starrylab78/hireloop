# HireLoop

A full-stack MERN job board with tiered recruiter subscriptions (Razorpay), a
free candidate experience, an ATS-style kanban pipeline, resume parsing,
TF-IDF "similar jobs", team seats, a candidate talent pool, an AI
job-description writer, interview scheduling with automatic candidate
emails, and Google/LinkedIn sign-in.

```
hireloop/
├── client/   React 18 + Vite + TypeScript + Tailwind
└── server/   Node + Express + MongoDB/Mongoose + Razorpay
```

## 1. Prerequisites

- Node.js 18+
- MongoDB running locally (or an Atlas connection string)
- A free [Razorpay](https://dashboard.razorpay.com/signup) account (test mode)
- For local webhook testing: [ngrok](https://ngrok.com) (or any tunnel tool) — Razorpay doesn't have a CLI like Stripe's for forwarding webhooks to localhost, so a tunnel is the standard way to test them during development
- Optional, for the newer features: an [Anthropic API key](https://console.anthropic.com), a [Sentry](https://sentry.io) project, and Google/LinkedIn OAuth apps (see §6)

## 2. Server setup

```bash
cd server
copy .env.example .env
npm install
```

Fill in `.env` — see inline comments for where to get each value. The **only
required** values to get the app running end-to-end are `MONGO_URI` and the
two JWT secrets; everything else (Razorpay, Sentry, Anthropic, OAuth, Resend)
degrades gracefully if left blank (see §7).

### Seed the database

```bash
npm run seed
```

Creates one recruiter per tier, 3 candidates, 5 jobs, and 2 in-flight applications.

| Account | Email | Password |
|---|---|---|
| Recruiter — Free | `free-recruiter@hireloop-demo.test` | `Password123!` |
| Recruiter — Growth | `growth-recruiter@hireloop-demo.test` | `Password123!` |
| Recruiter — Scale | `scale-recruiter@hireloop-demo.test` | `Password123!` |
| Candidates | `meera@`, `karan@`, `divya@hireloop-demo.test` | `Password123!` |

### Run the API

```bash
npm run dev      # nodemon, http://localhost:5000
```

### Run the tests

```bash
npm test              # unit + integration tests (Vitest)
```

Unit tests (resume matching, TF-IDF similarity, plan config) need nothing
extra. Integration tests spin up an in-memory MongoDB via
`mongodb-memory-server`, which downloads a MongoDB binary the first time you
run it — that requires outbound internet access. If your network blocks that
(as some sandboxed/corporate networks do), the unit suite
(`npx vitest run tests/unit`) still runs standalone.

## 3. Client setup

```bash
cd client
npm install
npm run dev       # http://localhost:5173, proxies /api to :5000
```

## 4. Setting up Razorpay

Razorpay's subscription flow is different from Stripe's — there's no hosted
checkout page to redirect to. Instead, the frontend opens Razorpay's
**Checkout.js** modal in-page, and the actual plan activation happens
asynchronously via webhook once payment is confirmed. Setup:

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com/signup),
   make sure you're in **Test Mode** (toggle top-right).
2. **API keys**: `Settings → API Keys → Generate Test Key` → copy the Key ID
   and Key Secret into `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
3. **Plans**: `Settings → Plans → + Create Plan` (or the "Subscriptions" product
   in the left nav, depending on your dashboard version) — create 4 plans:
   Growth Monthly (₹999, monthly), Growth Annual (₹9990, yearly), Scale
   Monthly (₹2999, monthly), Scale Annual (₹29990, yearly). Copy each `plan_id`
   into the matching `RAZORPAY_PLAN_*` variable in `.env`.
4. **Webhook**: `Settings → Webhooks → + Add New Webhook`. For local dev, run
   a tunnel first:
   ```bash
   ngrok http 5000
   ```
   Use the printed `https://...ngrok-free.app/api/billing/webhook` URL as the
   webhook URL. Enable these events: `subscription.activated`,
   `subscription.charged`, `subscription.cancelled`, `subscription.completed`,
   `subscription.halted`, `payment.failed`. Razorpay shows you a webhook
   secret when you save it — copy that into `RAZORPAY_WEBHOOK_SECRET`.
5. Restart the server after editing `.env`.

### Test card numbers (Razorpay test mode)

| Scenario | Card number |
|---|---|
| Successful payment | `4111 1111 1111 1111` |
| Successful (Mastercard) | `5267 3181 8797 5449` |

Any future expiry, any 3-digit CVC. For UPI in test mode, use the success VPA
`success@razorpay` (or `failure@razorpay` to simulate a decline).

### Trying it out

1. Log in as `growth-recruiter@hireloop-demo.test` → **Dashboard → Billing**
   → pick a plan. The Razorpay Checkout.js modal opens in-page.
2. Pay with the test card above. On success, the app polls briefly for the
   webhook-driven plan update (usually a couple of seconds) and shows your
   new plan.
3. **Cancel subscription** on the same page calls Razorpay's API directly —
   there's no separate hosted billing portal to redirect to the way Stripe
   has one; cancellation takes effect at the end of the current billing cycle.

## 5. Trying the newer features

- **AI job description writer** — on the "Post a job" page, click "Write with AI"
  in the description editor toolbar, add a title and a few rough bullet points.
  Falls back to a filled-in template if `ANTHROPIC_API_KEY` isn't set.
- **Interview scheduling** — optionally set a default interview format/link/venue
  when posting a job. When you drag a candidate into "Interviewed" on the
  kanban board, a modal collects date/time (pre-filled from the job's
  defaults) and automatically emails the candidate the details.
- **Team seats (Scale plan)** — from the dashboard, go to **Team**, invite a
  teammate by email. They accept from `/dashboard/team/accept/:token` after
  logging in with that exact email — they then see and manage the same jobs/pipeline.
- **Candidate talent pool** — from an applicant's kanban card, save them to your
  pool; re-contact them later from **Dashboard → Talent pool**, independent of
  any specific job posting.
- **Public company page** — set a company description from **Dashboard →
  Company page**; it's publicly visible at `/companies/:slug`.
- **Google/LinkedIn sign-in** — buttons appear on Login/Register automatically;
  they return a clear "not configured" error server-side until you add real
  OAuth credentials (§6).
- **Account settings** — click your name (top-right) → **Settings** to change
  name, email, or password, for either role.

## 6. Setting up OAuth (optional)

**Google**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials) →
Create OAuth client ID → Web application → Authorized redirect URI:
`http://localhost:5000/api/auth/google/callback`. Paste the client ID/secret into `.env`.

**LinkedIn**: [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) →
create an app → request the **"Sign In with LinkedIn using OpenID Connect"**
product → redirect URI `http://localhost:5000/api/auth/linkedin/callback`.

Both are additive — the app runs fine with these blank; the buttons just return
a 503 with a clear message until configured.

## 7. What degrades gracefully vs. what's simplified

**Degrades gracefully (safe to leave unset in `.env`):**
- `RAZORPAY_*` unset → billing checkout fails with a clear error; everything else works.
- `RESEND_API_KEY` unset → emails log to the console instead of sending.
- `SENTRY_DSN` unset → errors go to structured logs only, no external reporting.
- `ANTHROPIC_API_KEY` unset → AI job description writer falls back to a filled-in template.
- `GOOGLE_*` / `LINKEDIN_*` unset → OAuth buttons return a clear "not configured" error.

**Intentionally simplified (fine for a portfolio/demo build, flagged for anyone hardening further):**
- **Resume parsing** uses a curated keyword vocabulary + regex, not a hosted NLP API.
- **"Similar jobs"** uses hand-rolled TF-IDF + cosine similarity, recomputed on
  every job create/update — fine at demo scale; would move to a background job
  or vector DB at real scale.
- **Rate limiting / idempotency** use in-memory (`express-rate-limit`) and
  Mongo-backed stores — fine for a single server instance; a multi-instance
  deployment would move both to Redis.
- **Team seats** shares one pipeline across all org members with equal
  permissions (no per-member role granularity beyond owner/member yet).
- **Razorpay webhook idempotency** is keyed on a synthetic id (event type +
  resource id + payload timestamp) rather than one canonical event id, since
  Razorpay doesn't expose a single id the way Stripe's `event.id` does across
  every webhook type — good enough to dedupe retried deliveries in practice.

## Tech stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts, Tiptap, lucide-react
- **Backend**: Node.js, Express, MongoDB/Mongoose, Zod, DOMPurify, bcryptjs, jsonwebtoken, multer, pdf-parse, Razorpay, Resend, Anthropic SDK
- **Auth**: JWT access (15m) + refresh (30d) tokens in httpOnly cookies, rotation on refresh, per-role middleware, optional Google/LinkedIn OAuth
- **Observability**: structured JSON logging (pino) with per-request correlation IDs, optional Sentry error tracking
- **Testing**: Vitest + Supertest + mongodb-memory-server (unit + integration)
