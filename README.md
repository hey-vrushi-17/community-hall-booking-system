<p align="center">
  <img src="./public/banner-branded.png" alt="CivicSpaces Banner" width="100%" />
</p>

# CivicSpaces — Community Hall Booking & Management System

CivicSpaces is a full-stack community hall booking and facility management platform built with **Next.js App Router, React, TypeScript, Tailwind CSS, and Supabase (Postgres, Auth, Storage, and Row Level Security)**.

---

## Core Features

### Public Visitors & Requesters
- **Landing Page (`/`)**: Explains the reservation review workflow, public policies, featured venues, and configurable help desk details.
- **Hall Directory (`/halls`)**: Search active halls and filter by **available event date**, **guest capacity**, **city/location**, and **amenities**.
- **Hall Details & Live Schedule (`/halls/[slug]`)**: View capacity, amenities, operating hours, usage policies, and a real-time hourly availability calendar showing approved bookings and active maintenance closures.
- **Booking Request Flow (`/request` & in-page modal)**: Submit structured `PENDING` booking requests validated by Zod and server business rules (capacity limits, operating hours, date validity, and slot conflicts).
- **Confirmation & Status Tracking (`/request/confirmation`, `/track`)**: Review submitted requests by reference code (`REQ-YYYY-XXXX`) with privacy-masked contact fields for unauthenticated lookups.
- **Supabase Auth & Citizen Portal (`/my-requests`, `/auth/callback`, `/auth/update-password`)**: Sign up, sign in, sign out, reset forgotten passwords, update contact profile, view personal booking requests under RLS, and **cancel pending requests**.

### Administrators & Staff
- **Protected Portal (`/admin`, `/admin/login`)**: Role-based access control backed by Supabase Auth + `public.profiles.role IN ('STAFF', 'ADMIN')` and server-side guards on every `/admin/*` page and `/api/admin/*` route.
- **Dashboard (`/admin`)**: Pending requests count, confirmed events, active maintenance count, hall utilization metrics, active closures, and recent audit activity.
- **Booking Request Queue (`/admin/queue`)**: Filterable, paginated review queue with conflict detection and transactional approval/rejection (`approve_booking_tx` RPC + PostgreSQL `btree_gist` exclusion constraint).
- **Booking Records (`/admin/records`)**: Searchable, paginated registry with date-range, hall, and status filters plus CSV export.
- **Master Calendar (`/admin/calendar`)**: Month view and daily schedule inspector distinguishing approved bookings from maintenance windows.
- **Hall Management (`/admin/halls`)**: Create, edit, feature, activate/archive halls, manage amenities, operating hours, policies, and imagery.
- **Maintenance Management (`/admin/maintenance`)**: Schedule, edit, and cancel maintenance windows with overlap protection against confirmed events.
- **Audit History (`/admin/audit`)**: Filterable, paginated audit trail of approvals, rejections, cancellations, facility updates, and maintenance actions.

---

## Tech Stack & Requirements

- **Node.js**: `>= 20.x` (verified on Node v24)
- **Package Manager**: `npm`
- **Framework**: Next.js 16 (App Router, Turbopack), React 19, TypeScript 5
- **Styling**: Tailwind CSS v4, Lucide React
- **Validation**: Zod
- **Backend**: Supabase Postgres, Supabase Auth, Supabase Storage, SQL Migrations & RLS (`@supabase/supabase-js`, `@supabase/ssr`)

---

## Supabase Project Setup

1. **Create a Supabase Project**
   - Sign in at [supabase.com/dashboard](https://supabase.com/dashboard) and click **New Project**.
   - Choose your organization, project name, strong database password, and region.

2. **Collect API Credentials**
   - Go to **Project Settings → API** and copy:
     - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
     - **anon / public** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
     - **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`) — *Server-only; never expose in browser code or commit to git.*

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (required for server-side admin operations and bypassing strict PII RLS safely on trusted server routes)
   - `NEXT_PUBLIC_SITE_URL` (e.g., `http://localhost:3000` locally or your production domain for Auth email redirects)
   - `NEXT_PUBLIC_APP_TIMEZONE` (defaults to `Asia/Kolkata`; timestamps are stored in UTC in Postgres and rendered in this timezone)
   - Optional support contact overrides (`NEXT_PUBLIC_SUPPORT_OFFICE`, `NEXT_PUBLIC_SUPPORT_PHONE`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_HOURS`)

   > **Important:** If Supabase env vars are omitted, the app runs in an explicitly labeled **Development Sample Mode (Offline)**. If Supabase env vars are set but migrations have not been applied yet, the app surfaces an explicit setup-required state instead of pretending sample data is live.

4. **Configure Supabase Auth Redirect URLs**
   - In Supabase Dashboard → **Authentication → URL Configuration**:
     - Set **Site URL** to your `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000`).
     - Add `http://localhost:3000/auth/callback` (and your production `/auth/callback`) to **Redirect URLs** so email verification and password recovery links work.

---

## Applying Migrations & Seeding Development Data

Production schema migrations are separated from development sample data:
- **Migrations**: `supabase/migrations/`
  1. `20261116000001_initial_schema.sql` — Tables, `btree_gist` exclusion constraints, indexes, and base RLS policies.
  2. `20261126000003_security_audit_and_rules.sql` — Hardened `handle_new_user()` (prevents client role escalation), profile role-update trigger, owner pending-booking cancellation RLS, `created_by` on maintenance, `approve_booking_tx` RPC, public schedule RPC, and `hall-images` Storage bucket policies.
- **Development Seed Only**: `supabase/seed.sql` — 15 sample halls, sample bookings, and sample maintenance windows for local/staging testing. Do **not** run `seed.sql` in production if you want a clean catalog.

### Apply via Supabase CLI
```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```
To load development sample data locally or into a dev database, execute `supabase/seed.sql` via the Supabase Dashboard SQL Editor or `psql`.

### Apply via Supabase Dashboard SQL Editor
Run the migration files in order (`20261116000001_initial_schema.sql`, then `20261126000003_security_audit_and_rules.sql`), and optionally run `supabase/seed.sql` for development testing.

---

## Creating the First Administrator Securely

Public sign-ups always receive the `CITIZEN` role (`handle_new_user()` ignores any client-supplied role metadata, and a database trigger blocks non-admin role updates).

To promote your first administrator:
1. Create a user via **Supabase Dashboard → Authentication → Users → Add user** (or register via `/my-requests`).
2. In the **Supabase SQL Editor** (or via a trusted server migration), promote that specific user by email:
   ```sql
   UPDATE public.profiles
   SET role = 'ADMIN', full_name = 'Primary Facilities Administrator'
   WHERE id = (
     SELECT id FROM auth.users WHERE email = 'your-admin@example.org'
   );
   ```
3. Sign in at `/admin/login` using that user's email and password.

---

## Running Locally & Verification

```bash
npm install
npm run test:domain   # Domain rules, timezone, validation, and concurrency checks
npm run typecheck     # TypeScript strict check
npm run lint          # ESLint check
npm run dev           # Start development server at http://localhost:3000
npm run build         # Production Next.js build
```

---

## Deployment Notes & Known Limitations

- **Production Auth Secret**: Set `ENABLE_DEMO_ADMIN=false` (or omit it in `NODE_ENV=production`) and authenticate admins exclusively via Supabase Auth + `public.profiles`.
- **Service Role Key**: Keep `SUPABASE_SERVICE_ROLE_KEY` strictly on the server; never prefix it with `NEXT_PUBLIC_`.
- **No Payments or Email Dispatch**: Payment processing and outbound booking confirmation emails are intentionally out of scope; Supabase Auth handles account verification and password recovery emails.
- **Development Sample Mode**: In-memory mutations in unconfigured sample mode reset when the server process restarts.
