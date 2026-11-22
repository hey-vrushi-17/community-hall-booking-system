# Administrator Experience Guide — CivicSpaces

This document describes the administrator tools, screens, workflows, and security implementations in the Community Hall Booking & Management System.

---

## 1. Access & Authentication

- **Admin Login Route**: `/admin/login`
- **Protected Layout**: `src/app/admin/layout.tsx`
  - Validates session tokens via `src/lib/auth/admin-auth.ts`.
  - Redirects unauthenticated visitors to `/admin/login`.
  - Displays persistent civic administration navigation header with dynamic pending request counter.
- **Demo / Staff Credentials** (for development & staging):
  - Admin Account: `admin@civic.gov` (Role: `ADMIN`)
  - Staff Account: `staff@civic.gov` (Role: `STAFF`)
- **API Guard**: Every `/api/admin/*` route verifies session validity and requires `ADMIN` or `STAFF` role, responding with HTTP 401/403 for unauthorized requests.

---

## 2. Administrator Portal Modules

### 2.1 Executive Dashboard (`/admin`)
- **Summary Metrics**:
  - **Pending Requests**: Count of public submissions awaiting review with quick navigation to the queue.
  - **Upcoming Reservations**: Approved bookings scheduled within the next 30 days.
  - **Active Closures**: Ongoing or impending maintenance windows.
  - **Average Facility Utilization**: Calculated percentage of booked hours vs total operating hours.
- **Facility Utilization Cards**: Individual utilization metrics and capacity breakdowns for all municipal halls.
- **Recent Submissions Quickview**: Fast review of the latest booking requests.

### 2.2 Booking Request Queue (`/admin/queue`)
- **Filters & Search**:
  - Status filter tabs: `Pending Review`, `Approved`, `Rejected`, `All`.
  - Facility selector dropdown.
  - Search bar supporting reference number, event name, requester name, and email.
- **Detailed Request Inspection**:
  - Modal displaying full event details, attendee counts, contact information, requested time slots, and special requests.
- **Action Workflows**:
  - **Approve**: Invokes concurrency-checked approval. If another booking was approved in the interim, returns an explicit conflict warning.
  - **Reject**: Modal prompting for an administrative explanation (stored in `decisionNotes` and visible in audit logs).

### 2.3 Master Calendar (`/admin/calendar`)
- **Interactive Multi-Facility Calendar**:
  - Month navigation with visual day badges for approved bookings (green) and maintenance windows (amber/purple).
  - Facility filter to isolate individual halls or view all venues concurrently.
- **Daily Agenda Drawer**:
  - Hour-by-hour breakdown of scheduled events and maintenance windows for any selected date.

### 2.4 Booking Records & Historical Audit (`/admin/records`)
- **Comprehensive Registry**:
  - Tabulated overview of all historical booking submissions, regardless of status.
  - Date range filtering, status filtering, and venue filtering.
- **CSV Data Export**: One-click export for municipal reporting, revenue tracking, and council meetings.
- **Audit Details**: Shows reviewer email, decision timestamp, and rejection reasons.

### 2.5 Facility Halls Management (`/admin/halls`)
- **Facility Inventory**:
  - Visual cards with high-resolution photography, capacity, hourly rate, operating hours, and amenities.
  - Status indicator: `Active Public` vs `Archived`.
- **Add / Edit Facility**:
  - Modal form for name, tagline, description, capacity, rates, location, address, amenities, and operating hours.
- **Archival Protection**:
  - Confirmation modal warning that archiving hides the hall from citizens while preserving all historical contracts and financial audit trails.

### 2.6 Facility Maintenance & Closures (`/admin/maintenance`)
- **Closure Management**:
  - Track maintenance by status: `Upcoming & Active`, `Completed`, `Cancelled`, `All`.
- **Schedule Maintenance Modal**:
  - Select hall, scope of work/title, internal operational notes, start time, and end time.
  - **Conflict Prevention**: Rejects maintenance overlapping confirmed bookings and lists conflicting reference numbers and event names.
- **Cancellation**:
  - Cancelling a maintenance window immediately unblocks and restores the time slots on public booking search engines.

---

## 3. Verification & Automated Testing

Run domain logic, concurrency locks, and administrator workflow verification via:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path; npx tsx tests/verify-domain.mjs
```

All 32 automated tests verify:
- Slot availability calculation
- Pending request non-blocking behavior
- Concurrency conflict detection on approval
- Rejection notes recording
- Utilization metric computation
- Hall creation, updating, and archival filtering
- Maintenance scheduling overlap rejection and cancellation slot recovery.
