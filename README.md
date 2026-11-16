# CivicSpaces — Community Hall Booking & Management System

CivicSpaces is a responsive, accessible web platform for municipal community hall reservations and civic facility management. The platform enables the public to discover community halls, verify live schedule availability against approved bookings and maintenance closures, and submit structured booking requests for administrative review.

---

## Key Features (Phase 1 Scope)

1. **Civic Landing Experience**
   - High-trust, welcoming civic service design adhering to taste-skill and municipal UX principles.
   - Clear 4-step explanation of the administrative review workflow.
   - Non-fabricated contact placeholders for the District Facilities Division.
   - Direct quick actions to browse halls and track submitted requests.

2. **Community Hall Directory**
   - 6 detailed civic facilities with occupancy capacities (40 to 350 guests), hourly rates, district locations, and amenity breakdowns.
   - Interactive search and multi-facet filtering by capacity tier, neighborhood, and equipment/amenities (e.g., Commercial Kitchen, Proscenium Stage, Wheelchair Accessible, Sound System, Wi-Fi, Parking).
   - Responsive grid with informative empty states and filter reset controls.

3. **Hall Details & Live Schedule Verification**
   - Detailed hall profiles with photography, architectural descriptions, usage rules, and municipal curfews.
   - **Real-Time Availability Engine:** Evaluates slot availability by date and hour.
     - *Approved Bookings* actively block availability.
     - *Maintenance Windows* actively block availability.
     - *Submitted Requests (Pending)* do not block availability (a submitted request is not an approved booking).
   - **Interactive Booking Request Flow:** Modal with comprehensive Zod form validation, guest capacity checks against venue limits, and clear submission receipts with unique tracking codes (`REQ-2026-XXXX`).

4. **Public Request Tracking**
   - Search submitted requests by reference number to view current status (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`).
   - Displays assigned facility, requested time window, and administrative decision notes.

---

## Domain Model & Availability Rules

The initial domain model is specified in `prisma/schema.prisma`:
- **User**: Identity, contact information, role (`CITIZEN`, `STAFF`, `ADMIN`).
- **Hall**: Slugs, capacities, district locations, amenities, hourly rates, operating hours, and usage policies.
- **Booking**: Hall relation, requester contact, event details, start/end time window, status, reviewer ID, and decision notes.
- **MaintenanceWindow**: Hall relation, start/end time, reason, and status (`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
- **AuditEvent**: Actor email, action, affected record, timestamp, and metadata for transparent civic recordkeeping.

### Core Booking Rule Engine
- **Statuses**: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
- **Availability Rule**: A submitted request is `PENDING` and does **not** block availability. Only `APPROVED` bookings and `SCHEDULED`/`IN_PROGRESS` maintenance windows block availability.
- **Concurrency Safeguard**: The service layer (`src/lib/services/booking-store.ts`) implements per-hall mutex locking during the approval step to prevent concurrent overlapping approvals.

---

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript throughout
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide React
- **Validation**: Zod 3
- **ORM / Schema**: Prisma 8 (PostgreSQL target)

---

## Getting Started

### Prerequisites
- Node.js LTS (v20+ or v26+)
- npm (v10+ or v11+)

### Installation

1. Clone or navigate to the repository:
   ```bash
   cd community-hall-booking
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   *(Populate `DATABASE_URL` with your PostgreSQL instance when ready for live database persistence).*

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Data Access Boundary & Persistence Notice

In Phase 1, the platform operates with an **isolated in-memory domain store** (`src/lib/services/booking-store.ts`) pre-seeded with sample civic facilities, approved bookings, pending requests, and maintenance windows.

- **No Pretend Live Availability**: The UI clearly states when data is served from the isolated sample store.
- **Transition to Live Database**: The Prisma schema in `prisma/schema.prisma` is ready for database migrations (`npx prisma db push` or `npx prisma migrate dev`). The service boundary (`src/lib/services/hall-service.ts` and `src/lib/services/availability-service.ts`) is cleanly decoupled from presentation logic, making database connection straightforward in Phase 2.
