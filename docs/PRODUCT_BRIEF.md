# Community Hall Booking & Management System — Product Brief & Specification

## 1. Executive Summary

**CivicSpaces** is a modern, responsive, and accessible civic service web platform engineered for municipalities, local councils, and community trusts. The platform bridges public citizens seeking venues for community gatherings, cultural events, workshops, and private celebrations with municipal administrators responsible for facility scheduling, maintenance coordination, capacity governance, and regulatory compliance.

---

## 2. Target Personas & Primary Workflows

### 2.1 Citizen / Event Organizer (Public Persona)
- **Facility Discovery**: Search, filter, and compare community halls based on capacity, neighborhood, hourly rates, and amenities (audio systems, commercial kitchens, projectors, ADA accessibility).
- **Availability Verification**: Check live hourly availability for specific dates. Unavailable periods reflect confirmed reservations or scheduled maintenance closures. Pending booking submissions never artificially block dates for other citizens.
- **Booking Submission**: Submit structured booking requests with event metadata, attendee headcount, requested hours, and contact details. Requests enter `PENDING` status awaiting municipal review.
- **Request Tracking**: Look up request status via unique reference numbers (`REQ-YYYY-XXXX`) or inspect personal booking histories in an authenticated portal.

### 2.2 Facilities Administrator & Staff (Internal Persona)
- **Executive Dashboard**: Monitor high-level metrics including pending request volume, upcoming approved reservations, facility utilization rates, and active closures.
- **Booking Request Queue**: Review incoming booking submissions with detailed event information, requester contact details, and facility requirements.
- **Decision Engine (Approve / Reject)**:
  - Approve requests with server-side concurrency locks that re-verify availability to prevent race conditions.
  - Reject requests with mandatory or optional administrative notes explaining the rationale (e.g., policy conflicts, equipment unavailability).
- **Master Calendar**: Visual monthly and daily agenda view displaying all confirmed bookings and facility maintenance windows side-by-side.
- **Audit Records & Compliance**: Searchable, exportable historical log of all reservations, status transitions, reviewer identities, and audit trails.
- **Hall Inventory Management**: Add new facilities, update operating hours, pricing, capacity, and amenities. Archive halls while strictly preserving historical booking records and audit integrity.
- **Maintenance Coordination**: Schedule facility closures for renovations or repairs. Automatic conflict detection blocks maintenance overlapping confirmed bookings and immediately updates public availability.

---

## 3. Technology Stack & Architectural Principles

- **Framework**: Next.js 16 (App Router with Turbopack and Partial Prerendering)
- **Language**: TypeScript (strict mode, zero implicit `any`)
- **Database & Identity**: Supabase Postgres with Row Level Security (RLS) and Supabase Auth
- **Client Libraries**: `@supabase/supabase-js`, `@supabase/ssr`
- **Design System**: Warm neutral civic aesthetic (`#FBF9F5` background, `#1A3B2B` forest green, `#18283E` navy, `#C85A32` terracotta, `#E5DFD5` borders)
- **Testing & Verification**: Standalone domain verification suite (`tests/verify-domain.mjs`) testing concurrency locks, availability engines, status lifecycles, and archival behaviors.

---

## 4. Domain Rules & Concurrency Safeguards

1. **Pending Status Isolation**: A submitted booking request is strictly `PENDING` and does NOT block availability for other citizens until explicitly approved by an administrator.
2. **Double-Booking Prevention**: PostgreSQL `btree_gist` exclusion constraints enforce that no two `APPROVED` bookings can overlap for the same hall:
   ```sql
   CONSTRAINT no_overlapping_approved_bookings
   EXCLUDE USING gist (
     hall_id WITH =,
     tstzrange(start_time, end_time) WITH &&
   )
   WHERE (status = 'APPROVED');
   ```
3. **Approval Race-Condition Mitigation**: Both database stored procedures (`approve_booking_tx`) and application-level locks (`approveBookingWithConcurrencyCheck`) re-evaluate slot availability at the exact moment of approval, rejecting conflicting overlapping requests with detailed conflict payloads.
4. **Maintenance Precedence**: Active maintenance windows (`SCHEDULED` or `IN_PROGRESS`) immediately block slot availability on public search interfaces. Maintenance cannot be scheduled over existing confirmed reservations without prior cancellation/rescheduling.
5. **Historical Integrity**: Archiving a facility marks `isActive = false`, immediately removing it from public search and new booking requests while preserving all historical reservations, audit events, and financial records.
