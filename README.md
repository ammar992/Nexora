# Nexora

A multi-vendor marketplace for **products and bookable services**. Customers shop and book, vendors run their storefront from a dashboard, and admins run the platform.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, MongoDB/Mongoose, Framer Motion, GSAP ScrollTrigger and React Three Fiber.

---

## Quick start

```bash
npm install
cp .env.example .env.local      # then fill in the values (see below)
npm run seed:admin              # creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD
npm run seed:demo               # optional: demo categories, vendors, listings and reviews
npm run dev                     # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint (Next.js + React Compiler rules) |
| `npm run seed:admin` | Create the first admin. Safe to re-run, never duplicates |
| `npm run seed:demo` | Load demo data (`-- --reset` removes it) |
| `npm run test:e2e` | End-to-end API test against a running server (see below) |

### Demo accounts (after `seed:demo`)

Password for all: `DemoPass123` (override with `DEMO_PASSWORD` before seeding).

- Customer: `customer@demo.nexora.local`
- Vendors: `tidewater@`, `saddle@`, `lumen@`, `hearth@`, `quiet@`, `nook@`, `signal@`, `atelier@` + `demo.nexora.local`

---

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | yes | Include the database name, e.g. `…mongodb.net/nexora?retryWrites=true` |
| `NEXTAUTH_SECRET` | yes | ≥ 32 chars. Signs session cookies. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `NEXTAUTH_URL` | yes | Public base URL, used in email links and payment redirects |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | for uploads | Without them, image uploads return a clear 503 |
| `CLOUDINARY_FOLDER` | no | Folder prefix for uploads (default `nexora`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | for email | Without `SMTP_HOST`, emails are **printed to the server console** (handy in dev: verification links appear there) |
| `SMTP_FROM` | no | e.g. `"Nexora <hello@yourdomain.com>"` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | for `seed:admin` | Password needs 8+ chars with a letter and a number |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | optional | Enables card payments via Stripe Checkout |
| `REQUIRE_EMAIL_VERIFICATION` | no | `true` (default) blocks checkout/booking until email is verified |

Secrets are only read on the server. Nothing in `src/server` is importable from client components (`server-only` guards).

---

## What's included

**Public site**: animated 3D hero (with a lighter scene on phones and low-power devices, and a static one for reduced motion), search by keyword / category / city, explore with filters, sort, grid/list views and pagination, listing pages with gallery + lightbox, live booking calendar, cart drawer, checkout, vendor storefronts, become-a-vendor flow, contact form, legal pages.

**Customer account**: overview, orders (with timeline, tracking and cancellation before shipping), bookings (cancel), saved listings, payments, reviews, notifications, profile with avatar upload and address, password change and email preferences.

**Vendor studio**: overview with earnings chart, listing editor (products or services, drag-to-reorder photos, inventory, weekly availability, slot length, capacity, notice period, days off), inline stock edits, orders and bookings with status workflows, cash payment recording, customers list, review replies, earnings ledger, store settings with logo/cover and payout details.

**Admin console**: KPIs and charts, activity feed, users (roles, activate/deactivate, verify), vendor applications (approve/reject/suspend/feature), listing moderation (approve/reject/feature/archive/edit/delete), categories CRUD with icons and images, review moderation, all orders and bookings with refunds, finance (volume, commission, vendor earnings, transactions), platform settings (branding, logo/favicon, homepage copy, commission, auto-approval, contact, social links, email sender + test email).

### How the core flows work

- **Orders**: one checkout creates one order per vendor. Stock is reserved atomically (`$inc` guarded by `stock >= qty`) and released if the checkout fails, an order is cancelled, or an online payment window expires.
- **Bookings**: the server checks the day, opening hours, slot grid, notice period and remaining capacity, then re-checks capacity after insert to close race conditions. Unpaid online holds stop counting after 30 minutes.
- **Payments** (`src/server/payments`): a provider registry. `manual` (pay on delivery / at the appointment) is always available, and the vendor or an admin records the payment. `stripe` is enabled by `STRIPE_SECRET_KEY` and confirmed **only** by the signed webhook, never by the redirect. Refunds go through the provider. To add a gateway, implement `PaymentProvider` and register it.
- **Reviews**: only customers with a delivered order or completed booking can review, one review per listing. Ratings are recomputed on every change.
- **Notifications**: in-app notifications plus email for registration/verification, password reset, order and booking confirmations, status changes, vendor application decisions and vendor sales.

### Security

bcrypt (12 rounds) password hashing · HS256 signed, httpOnly, SameSite=Lax session cookie, re-validated against the database on every request (deactivation, role changes and password resets revoke sessions via `tokenVersion`) · role checks in the proxy, layouts and every API route · Yup validation with unknown keys stripped · MongoDB-backed rate limits on login, registration, password reset, checkout, uploads, reviews and contact · upload type checking by magic bytes, plus size limits · single-use, hashed, expiring tokens for verification and reset · security headers in `next.config.ts`.

---

## Project structure

```
src/
  app/                 routes: (web) public, (auth), account, vendor, admin, api
  components/          atoms → molecules → organisms → templates (atomic design)
  formik/schema/       Yup schemas shared by forms and API routes
  interceptor/         axios client + error normalisation
  store/               Redux Toolkit (cart, persisted to localStorage)
  context/             session + theme providers
  resources/           hooks and pure utilities
  server/              db, models, auth, payments, email, services (server-only)
  proxy.ts             route protection (Next 16 "proxy", formerly middleware)
scripts/               seed:admin, seed:demo, test:e2e
```

---

## Testing

`npm run test:e2e` runs about 50 checks against a running server: auth, verification, stock reservation, fulfilment transitions, review eligibility, booking availability and double-booking protection, vendor onboarding, moderation, RBAC, session revocation, rate limiting and forged tokens. It needs `seed:admin` and `seed:demo` first. Everything it creates uses `@e2e.nexora.local` and is cleaned up afterwards. Set `E2E_BASE_URL` to test another deployment.

---

## Deployment

### Vercel (recommended)

1. Push the repo and import it in Vercel (framework: Next.js).
2. Add every variable from `.env.example` in **Project → Settings → Environment Variables**. Set `NEXTAUTH_URL` to your production URL.
3. In MongoDB Atlas, **Network Access**: allow Vercel's egress (`0.0.0.0/0`, or use Atlas' Vercel integration).
4. Deploy, then run `npm run seed:admin` once from your machine with production env vars.
5. Stripe (optional): add a webhook endpoint `https://<domain>/api/webhooks/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired` and `checkout.session.async_payment_failed`, then set `STRIPE_WEBHOOK_SECRET`.

### Any Node host / Docker

```bash
npm ci && npm run build
NODE_ENV=production npm start   # listens on $PORT (default 3000)
```

Run it behind HTTPS (cookies are `Secure` in production) and make sure the proxy forwards `X-Forwarded-For` so rate limits apply per client.

### Before going live

- Configure SMTP (Postmark, SES, Resend SMTP, Mailgun…) and send a test from **Admin → Settings → Email**.
- Review the template Terms and Privacy pages for your jurisdiction.
- Set your commission rate, currency, branding and contact details in **Admin → Settings**.
- Remove demo data with `npm run seed:demo -- --reset`.
