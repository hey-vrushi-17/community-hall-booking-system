import Link from 'next/link';
import {
  COMPLIANCE_CONTACTS,
  COMPLIANCE_VERSIONS,
  DATA_RETENTION_SCHEDULE,
  LEGAL_BASIS_MATRIX,
  OPEN_SOURCE_PACKAGES,
  SUB_PROCESSORS,
  SUBSCRIPTION_PLANS,
} from '@/lib/config/compliance-config';
import { SITE_CONFIG } from '@/lib/config/site-config';
import { Alert } from '@/components/ui/alert';

export function renderLegalDocumentBody(slug: string) {
  switch (slug) {
    case 'privacy-policy':
      return (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">1. Data Controller &amp; Scope</h2>
            <p>
              <strong>{COMPLIANCE_CONTACTS.dataController}</strong> operates the{' '}
              <strong>{SITE_CONFIG.portalName}</strong> community hall booking and municipal facilities
              management portal. This Privacy Policy explains how we collect, process, store, redact,
              and protect personal data when citizens, community groups, and staff interact with the portal.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">2. Personal Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Booking Request Details:</strong> Full name, email address, phone number,
                optional organization name, event title, event category, expected attendee count,
                date/time window, and special setup requirements.
              </li>
              <li>
                <strong>Citizen Account Credentials &amp; Profile:</strong> Email address, password
                (hashed via Supabase Auth), full name, phone, organization, and optional marketing
                opt-in status.
              </li>
              <li>
                <strong>Administrative &amp; Audit Logs:</strong> Reviewer identity, booking approval
                or rejection notes, cancellation timestamps, and consent receipts.
              </li>
              <li>
                <strong>Session &amp; Security Cookies:</strong> Strictly necessary authentication
                cookies (`sb-*` for Supabase Auth, `civic_admin_session` HMAC-signed cookie for staff)
                and your cookie consent preference (`civic_cookie_consent`).
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">3. Public Lookup PII Masking</h2>
            <p>
              When an unauthenticated visitor looks up a booking by reference number on{' '}
              <Link href="/track" className="text-[#1A3B2B] font-semibold underline">
                /track
              </Link>{' '}
              or `/request/confirmation`, our API redacts personal contact fields (`maskEmail` and
              `maskPhone`) before returning the response. Full unredacted details are visible only to
              the authenticated booking owner under Supabase Row Level Security (RLS) or authorized
              municipal facility staff.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">4. Your Rights &amp; DPO Contact</h2>
            <p>
              You have the right to access, export (JSON portability), rectify, restrict, or erase
              your personal data, and to withdraw marketing or cookie consent at any time via the{' '}
              <Link href="/privacy-center" className="text-[#1A3B2B] font-semibold underline">
                Privacy &amp; Data Rights Center
              </Link>{' '}
              or by contacting our Data Protection Officer at{' '}
              <span className="font-mono text-xs bg-[#F3EFE8] px-1.5 py-0.5 rounded">
                {COMPLIANCE_CONTACTS.dpoEmail}
              </span>
              .
            </p>
          </section>
        </>
      );

    case 'terms':
      return (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">1. Nature of Booking Requests</h2>
            <p>
              Submitting a reservation form on {SITE_CONFIG.portalName} creates a{' '}
              <strong>PENDING</strong> booking request. A submission does not guarantee venue
              availability or form a confirmed reservation until reviewed and explicitly{' '}
              <strong>APPROVED</strong> by an authorized municipal facility administrator.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">2. Capacity, Operating Hours &amp; Venue Rules</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Expected attendance must not exceed the published fire-safety capacity of the chosen hall.
              </li>
              <li>
                Events must start and conclude (including load-in and cleanup) strictly within the
                facility&apos;s published operating hours.
              </li>
              <li>
                Organizers must comply with municipal noise bylaws, waste-segregation rules, and
                specific hall policies displayed on each venue&apos;s detail page.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">3. Cancellations &amp; Maintenance Closures</h2>
            <p>
              Authenticated citizens may withdraw their own <strong>PENDING</strong> requests at any
              time from{' '}
              <Link href="/my-requests" className="text-[#1A3B2B] font-semibold underline">
                My Requests
              </Link>
              . For approved bookings, fee refunds follow the schedule published in our{' '}
              <Link href="/legal/payment-terms" className="text-[#1A3B2B] font-semibold underline">
                Payment &amp; Subscription Terms
              </Link>
              . The municipality reserves the right to reschedule or refund 100% of fees if emergency
              facility maintenance or civic necessity requires venue closure.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">4. Liability &amp; Governing Law</h2>
            <p>
              Organizers assume responsibility for guest safety, third-party equipment brought onto the
              premises, and physical damage beyond normal wear and tear. These terms are governed by
              applicable municipal bylaws ({SITE_CONFIG.bylawReference}) and local statutory law.
            </p>
          </section>
        </>
      );

    case 'gdpr':
      return (
        <>
          <Alert variant="info" title="Interactive GDPR Rights Available">
            Use the{' '}
            <Link href="/privacy-center" className="font-semibold underline">
              Privacy &amp; Data Rights Center
            </Link>{' '}
            to immediately export your data in JSON format (Art. 15/20) or submit an erasure request (Art. 17).
          </Alert>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">GDPR Articles 12–22 Implementation</h2>
            <div className="overflow-x-auto border border-[#E5DFD5] rounded-md">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FBF9F5] border-b border-[#E5DFD5] text-[#1C1917]">
                  <tr>
                    <th className="p-3 font-bold">GDPR Right</th>
                    <th className="p-3 font-bold">How CivicSpaces Implements It</th>
                    <th className="p-3 font-bold">Response SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD5]">
                  <tr>
                    <td className="p-3 font-semibold">Art. 15 — Right of Access</td>
                    <td className="p-3">Self-service export via `/api/privacy/export` and `/my-requests`.</td>
                    <td className="p-3">Immediate (Automated)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Art. 16 — Rectification</td>
                    <td className="p-3">Editable citizen profile in `/my-requests` + DPO correction desk.</td>
                    <td className="p-3">Immediate / ≤ 5 business days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Art. 17 — Right to Erasure</td>
                    <td className="p-3">Self-service &amp; admin-reviewed PII anonymization via `/api/privacy/deletion`.</td>
                    <td className="p-3">Immediate (verified) / ≤ 30 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Art. 20 — Data Portability</td>
                    <td className="p-3">Structured UTF-8 JSON export (`civicspaces-gdpr-data-export.json`).</td>
                    <td className="p-3">Immediate (Automated)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Art. 21 &amp; 7(3) — Objection / Withdrawal</td>
                    <td className="p-3">Cookie banner &amp; unbundled Marketing Consent opt-out controls.</td>
                    <td className="p-3">Immediate</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">Supervisory Authority (Art. 77)</h2>
            <p>
              If you believe your data protection rights have been infringed, you may lodge a complaint
              with {COMPLIANCE_CONTACTS.supervisoryAuthority} or contact our DPO at{' '}
              <span className="font-mono text-xs">{COMPLIANCE_CONTACTS.dpoEmail}</span>.
            </p>
          </section>
        </>
      );

    case 'cookies':
      return (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">1. Prior-Consent Cookie Architecture</h2>
            <p>
              CivicSpaces follows GDPR Art. 6(1)(a) and ePrivacy Directive Art. 5(3) strict prior-consent
              rules. Non-essential cookies (Analytics and optional Marketing) remain <strong>OFF</strong> by
              default until you affirmatively opt in via the cookie banner or Preferences modal. We also
              honor browser <strong>Global Privacy Control (GPC)</strong> signals.
            </p>
          </section>

          <div className="overflow-x-auto border border-[#E5DFD5] rounded-md">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FBF9F5] border-b border-[#E5DFD5] text-[#1C1917]">
                <tr>
                  <th className="p-3 font-bold">Cookie Name</th>
                  <th className="p-3 font-bold">Category</th>
                  <th className="p-3 font-bold">Purpose</th>
                  <th className="p-3 font-bold">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5]">
                <tr>
                  <td className="p-3 font-mono">sb-*-auth-token</td>
                  <td className="p-3 font-semibold">Strictly Necessary</td>
                  <td className="p-3">Maintains authenticated Supabase citizen session across requests.</td>
                  <td className="p-3">Session / Refresh</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono">civic_admin_session</td>
                  <td className="p-3 font-semibold">Strictly Necessary</td>
                  <td className="p-3">HttpOnly HMAC-SHA256 signed session cookie for staff portal access.</td>
                  <td className="p-3">7 days</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono">civic_cookie_consent</td>
                  <td className="p-3 font-semibold">Strictly Necessary</td>
                  <td className="p-3">Stores your selected cookie preferences (`SameSite=Lax`).</td>
                  <td className="p-3">180 days</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono">civic_ui_prefs</td>
                  <td className="p-3">Functional (Optional)</td>
                  <td className="p-3">Remembers directory filters and display preferences.</td>
                  <td className="p-3">180 days</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono">civic_demand_metrics</td>
                  <td className="p-3">Analytics (Opt-In)</td>
                  <td className="p-3">Aggregated hall utilization &amp; scheduling demand insights (no ad tracking).</td>
                  <td className="p-3">90 days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      );

    case 'legal-basis':
      return (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">
              Record of Processing Activities (GDPR Article 6 &amp; Article 30)
            </h2>
            <p>
              Every personal data operation performed by {SITE_CONFIG.portalName} maps to an explicit
              lawful basis under GDPR Article 6(1). We do not process personal data without a documented
              statutory ground.
            </p>
          </section>

          <div className="overflow-x-auto border border-[#E5DFD5] rounded-md">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FBF9F5] border-b border-[#E5DFD5] text-[#1C1917]">
                <tr>
                  <th className="p-3 font-bold">Processing Activity</th>
                  <th className="p-3 font-bold">Data Categories</th>
                  <th className="p-3 font-bold">Lawful Basis</th>
                  <th className="p-3 font-bold">GDPR Reference</th>
                  <th className="p-3 font-bold">Retention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5]">
                {LEGAL_BASIS_MATRIX.map((row) => (
                  <tr key={row.activity}>
                    <td className="p-3 font-semibold text-[#1C1917]">{row.activity}</td>
                    <td className="p-3">{row.dataCategories}</td>
                    <td className="p-3 font-medium text-[#1A3B2B]">{row.gdprBasis}</td>
                    <td className="p-3 font-mono text-[11px]">{row.statutoryReference}</td>
                    <td className="p-3">{row.retentionRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );

    case 'marketing-consent':
      return (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">1. Unbundled Opt-In Standard</h2>
            <p>
              Under GDPR Article 7(4), marketing consent is never bundled with booking Terms &amp;
              Conditions. All marketing checkboxes on Citizen Sign Up and Booking Request forms are{' '}
              <strong>unchecked by default</strong> and optional. Refusing marketing communications never
              affects your ability to book a community hall.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">2. What Opt-In Communications Include</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Seasonal municipal hall booking window openings (e.g. festival &amp; annual slots).</li>
              <li>Newly commissioned or renovated civic venues in your neighborhood.</li>
              <li>Municipal cultural workshops and public-interest fee concession announcements.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">3. Proof of Consent &amp; Instant Withdrawal</h2>
            <p>
              Every opt-in or withdrawal is timestamped in `consent_records` with policy version{' '}
              <span className="font-mono text-xs">v{COMPLIANCE_VERSIONS.privacyPolicy}</span>. You may
              withdraw consent anytime in{' '}
              <Link href="/privacy-center#marketing" className="text-[#1A3B2B] font-semibold underline">
                Privacy Center → Marketing Preferences
              </Link>{' '}
              or in your{' '}
              <Link href="/my-requests" className="text-[#1A3B2B] font-semibold underline">
                My Requests
              </Link>{' '}
              profile dashboard.
            </p>
          </section>
        </>
      );

    case 'data-deletion':
      return (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">1. How Erasure Works on CivicSpaces</h2>
            <p>
              Citizens may request deletion of their account profile, booking contact PII, or marketing
              records at any time via{' '}
              <Link href="/privacy-center#deletion" className="text-[#1A3B2B] font-semibold underline">
                Privacy Center → Data Deletion
              </Link>
              . Authenticated users and reference-verified requesters can trigger immediate PII
              anonymization, or submit a formal request to our DPO desk (`DEL-YYYY-XXXX`).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">2. Anonymization vs. Statutory Ledger Integrity</h2>
            <p>
              When executing a booking PII erasure (`BOOKING_PII` or `FULL_ACCOUNT`), CivicSpaces
              replaces `requester_name`, `requester_email`, `requester_phone`, `requester_org`, and
              `special_requests` with redacted placeholders and clears `user_id` links. Non-identifying
              hall schedule slots and financial audit totals are preserved solely where required by
              municipal public-audit law (GDPR Art. 17(3)(b)).
            </p>
          </section>
        </>
      );

    case 'data-retention':
      return (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">Retention &amp; Automated Disposal Schedule</h2>
            <p>
              Under GDPR Article 5(1)(e) (Storage Limitation), personal data is kept in identifiable form
              for no longer than necessary for municipal facility operations and statutory public-records
              compliance.
            </p>
          </section>

          <div className="overflow-x-auto border border-[#E5DFD5] rounded-md">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FBF9F5] border-b border-[#E5DFD5] text-[#1C1917]">
                <tr>
                  <th className="p-3 font-bold">Record Category</th>
                  <th className="p-3 font-bold">Data Elements</th>
                  <th className="p-3 font-bold">Retention Period</th>
                  <th className="p-3 font-bold">Trigger</th>
                  <th className="p-3 font-bold">End-of-Life Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5]">
                {DATA_RETENTION_SCHEDULE.map((row) => (
                  <tr key={row.category}>
                    <td className="p-3 font-semibold text-[#1C1917]">{row.category}</td>
                    <td className="p-3">{row.examples}</td>
                    <td className="p-3 font-semibold text-[#1A3B2B]">{row.retentionPeriod}</td>
                    <td className="p-3">{row.trigger}</td>
                    <td className="p-3">{row.disposalMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );

    case 'dpa':
      return (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">
              GDPR Article 28 Data Processing Agreement (Standard Municipal Schedule)
            </h2>
            <p>
              This Data Processing Agreement (<strong>DPA v{COMPLIANCE_VERSIONS.dpaVersion}</strong>)
              governs processing conducted by authorized technology sub-processors and partner municipal
              units acting on behalf of <strong>{COMPLIANCE_CONTACTS.dataController}</strong> (Data
              Controller).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">1. Subject Matter, Duration &amp; Categories</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Subject Matter &amp; Nature:</strong> Cloud database hosting, authentication,
                availability scheduling, and audit logging for community hall bookings.
              </li>
              <li>
                <strong>Duration:</strong> For the term of active municipal portal operation plus the
                statutory return/deletion window (30 days post-termination).
              </li>
              <li>
                <strong>Data Subjects:</strong> Citizens, event organizers, non-profit representatives,
                and municipal facility administrators.
              </li>
              <li>
                <strong>Personal Data Categories:</strong> Contact identifiers (name, email, phone,
                organization), booking schedules, and role/access audit logs. No special-category
                (Art. 9) health or biometric data is intentionally collected.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">2. Processor Obligations (Art. 28(3))</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Process personal data solely on documented instructions from the Controller.</li>
              <li>Ensure personnel processing personal data are bound by written confidentiality obligations.</li>
              <li>Implement technical and organizational security measures under Art. 32 (RLS, TLS, AES-256).</li>
              <li>Notify the Controller without undue delay (and within 24 hours of confirmation) upon becoming aware of any personal data breach.</li>
              <li>Assist the Controller in fulfilling Data Subject Requests (Arts. 15–22) and DPIAs (Art. 35).</li>
              <li>Maintain a written sub-processor list and provide 30 days prior notice before onboarding new sub-processors.</li>
            </ul>
          </section>
        </>
      );

    case 'third-party-disclosures':
      return (
        <>
          <Alert variant="success" title="Zero Data Sale Commitment">
            CivicSpaces and {COMPLIANCE_CONTACTS.dataController} <strong>never sell, rent, or trade</strong>{' '}
            citizen personal data to advertisers, data brokers, or commercial third parties.
          </Alert>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">1. Authorized Infrastructure Sub-Processors</h2>
            <div className="overflow-x-auto border border-[#E5DFD5] rounded-md">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FBF9F5] border-b border-[#E5DFD5] text-[#1C1917]">
                  <tr>
                    <th className="p-3 font-bold">Sub-Processor</th>
                    <th className="p-3 font-bold">Role</th>
                    <th className="p-3 font-bold">Data Processed</th>
                    <th className="p-3 font-bold">Safeguards</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD5]">
                  {SUB_PROCESSORS.map((sp) => (
                    <tr key={sp.name}>
                      <td className="p-3 font-semibold text-[#1C1917]">{sp.name}</td>
                      <td className="p-3">{sp.role}</td>
                      <td className="p-3">{sp.dataProcessed}</td>
                      <td className="p-3">{sp.safeguards}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">2. Statutory &amp; Public Safety Disclosures</h2>
            <p>
              Limited booking metadata (venue, date/time, event title, and approved status) is displayed
              on public availability schedules so residents can verify hall availability. Personal contact
              information is withheld from public schedules and only disclosed when required by valid
              judicial order, emergency first-responder coordination, or statutory audit law.
            </p>
          </section>
        </>
      );

    case 'data-security':
      return (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">
              Technical &amp; Organizational Security Controls (GDPR Article 32)
            </h2>
            <p>
              CivicSpaces enforces defense-in-depth across the database, server API layer, session
              management, and HTTP transport headers:
            </p>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] space-y-1.5">
              <h3 className="font-bold text-[#1C1917]">PostgreSQL Row Level Security (RLS)</h3>
              <p>
                Enabled across `profiles`, `halls`, `bookings`, `maintenance_windows`, `audit_events`,
                `consent_records`, `data_deletion_requests`, and `breach_incidents`. Citizens can query
                only their own rows.
              </p>
            </div>
            <div className="p-4 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] space-y-1.5">
              <h3 className="font-bold text-[#1C1917]">Privilege Escalation Prevention</h3>
              <p>
                Database triggers (`prevent_profile_role_escalation` and hardened `handle_new_user`)
                block client-supplied role tampering; public signups are always `CITIZEN`.
              </p>
            </div>
            <div className="p-4 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] space-y-1.5">
              <h3 className="font-bold text-[#1C1917]">Server-Side PII Redaction</h3>
              <p>
                Unauthenticated reference lookups (`/api/bookings?ref=...`) automatically mask email
                addresses and phone numbers before serialization.
              </p>
            </div>
            <div className="p-4 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] space-y-1.5">
              <h3 className="font-bold text-[#1C1917]">Signed Sessions &amp; Security Headers</h3>
              <p>
                Admin cookies use HMAC-SHA256 verified with `crypto.timingSafeEqual`. HTTP responses
                include `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and strict
                `Referrer-Policy` &amp; `Permissions-Policy`.
              </p>
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">Concurrency &amp; Integrity Protection</h2>
            <p>
              Transactional row-locking (`approve_booking_tx` RPC) paired with PostgreSQL `btree_gist`
              exclusion constraints (`no_overlapping_approved_bookings` and
              `no_overlapping_active_maintenance`) guarantees double-booking is impossible even under
              concurrent requests.
            </p>
          </section>
        </>
      );

    case 'data-breach':
      return (
        <>
          <Alert variant="warning" title="72-Hour GDPR Article 33 Reporting SLA">
            Suspected security incidents or unauthorized data exposures must be reported immediately to{' '}
            <span className="font-mono text-xs">{COMPLIANCE_CONTACTS.securityEmail}</span> and logged in
            the{' '}
            <Link href="/admin/compliance" className="font-semibold underline">
              Staff Breach Response Console
            </Link>
            .
          </Alert>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">Incident Response Phases</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Phase 1 — Detection &amp; Logging (Hour 0–2):</strong> Log the incident in the
                Breach Register (`INC-YYYY-XXX`), automatically starting the 72-hour GDPR Art. 33
                notification countdown clock.
              </li>
              <li>
                <strong>Phase 2 — Containment &amp; Token Revocation (Hour 2–12):</strong> Rotate
                compromised credentials (`ADMIN_SESSION_SECRET`, service keys), revoke affected Supabase
                Auth sessions, and isolate impacted endpoints.
              </li>
              <li>
                <strong>Phase 3 — Risk Assessment (Hour 12–48):</strong> Determine affected data
                categories, subject counts, and likelihood of risk to rights and freedoms using
                immutable `audit_events` logs.
              </li>
              <li>
                <strong>Phase 4 — Supervisory Authority Notification (≤ 72 Hours, Art. 33):</strong>{' '}
                If risk is non-trivial, submit statutory notification to{' '}
                {COMPLIANCE_CONTACTS.supervisoryAuthority} and record `authority_notified_at`.
              </li>
              <li>
                <strong>Phase 5 — Affected Citizen Notification (Without Undue Delay, Art. 34):</strong>{' '}
                If high risk exists, notify impacted citizens directly with actionable protective steps.
              </li>
            </ol>
          </section>
        </>
      );

    case 'intellectual-property':
      return (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">1. Platform Copyright &amp; Municipal Marks</h2>
            <p>
              All portal branding, CivicSpaces interface design, municipal civic seals, documentation,
              and original venue descriptions are the intellectual property of{' '}
              <strong>{COMPLIANCE_CONTACTS.dataController}</strong> or its licensors. Unauthorized
              reproduction of official municipal emblems or misrepresentation of municipal endorsement
              is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">2. Venue Photography &amp; Organizer Content</h2>
            <p>
              Hall imagery carries attribution metadata (`images[].credit`) where applicable. By
              submitting event titles, descriptions, or setup specifications, organizers warrant they
              hold necessary rights to any third-party event names or trademarks and grant the
              municipality a limited license to display approved event names on internal and public
              facility schedules.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">3. Copyright / IP Takedown Contact</h2>
            <p>
              To report an intellectual property concern, email{' '}
              <span className="font-mono text-xs">{SITE_CONFIG.supportEmail}</span> with the URL,
              description of the copyrighted work, and proof of authorization.
            </p>
          </section>
        </>
      );

    case 'open-source-licences':
      return (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">
              Open-Source Software Attributions (Verified from `package.json`)
            </h2>
            <p>
              CivicSpaces is built on open-source software. We gratefully acknowledge the authors and
              maintainers of the packages below under their respective MIT, ISC, and Apache-2.0
              licences.
            </p>
          </section>

          <div className="overflow-x-auto border border-[#E5DFD5] rounded-md">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FBF9F5] border-b border-[#E5DFD5] text-[#1C1917]">
                <tr>
                  <th className="p-3 font-bold">Package</th>
                  <th className="p-3 font-bold">Version</th>
                  <th className="p-3 font-bold">SPDX Licence</th>
                  <th className="p-3 font-bold">Category</th>
                  <th className="p-3 font-bold">Role in CivicSpaces</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD5]">
                {OPEN_SOURCE_PACKAGES.map((pkg) => (
                  <tr key={pkg.name}>
                    <td className="p-3 font-mono font-semibold text-[#1C1917]">{pkg.name}</td>
                    <td className="p-3 font-mono">{pkg.version}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-[#EBF3EE] text-[#1A3B2B] font-semibold text-[11px]">
                        {pkg.license}
                      </span>
                    </td>
                    <td className="p-3">{pkg.category}</td>
                    <td className="p-3">{pkg.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );

    case 'payment-terms':
      return (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">1. Hall Rental Fee Calculation &amp; Deposits</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>No Charge Upon Request Submission:</strong> Submitting a{' '}
                <strong>PENDING</strong> booking request incurs zero upfront charge. Payment becomes
                due only after facility administration issues formal <strong>APPROVED</strong>{' '}
                clearance.
              </li>
              <li>
                <strong>Hourly Rate &amp; Security Deposit:</strong> Estimated rental equals the
                hall&apos;s published hourly rate multiplied by reserved hours, plus a refundable
                civic security deposit (25% of base rental, minimum ₹500 for paid halls).
              </li>
              <li>
                <strong>Deposit Release:</strong> Security deposits are refunded within 7 business
                days following post-event hall inspection, subject to deductions only for documented
                property damage or overtime exceeding 30 minutes.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-[#1C1917]">
              2. Civic Organizer Subscription &amp; Concession Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="font-bold text-sm text-[#1C1917]">{plan.name}</div>
                    <div className="text-lg font-bold text-[#1A3B2B]">
                      {plan.priceInr === 0 ? 'Free / Per Booking' : `₹${plan.priceInr.toLocaleString('en-IN')}`}
                    </div>
                    <div className="text-[11px] text-[#615B52] font-medium">{plan.billingCycle}</div>
                    <p className="text-[11px] text-[#615B52]">
                      <strong>Eligible:</strong> {plan.eligibleFor}
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[#4D4841]">
                      {plan.benefits.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-[#E5DFD5] text-[11px] text-[#615B52]">
                    <strong>Cancellation:</strong> {plan.cancellationTerms}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">3. Booking Cancellation &amp; Refund Schedule</h2>
            <div className="overflow-x-auto border border-[#E5DFD5] rounded-md">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FBF9F5] border-b border-[#E5DFD5] text-[#1C1917]">
                  <tr>
                    <th className="p-3 font-bold">Cancellation Timing</th>
                    <th className="p-3 font-bold">Rental Fee Refund</th>
                    <th className="p-3 font-bold">Security Deposit Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD5]">
                  <tr>
                    <td className="p-3 font-semibold">While status is PENDING</td>
                    <td className="p-3">No fee charged</td>
                    <td className="p-3">No deposit charged</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">≥ 7 days before approved event</td>
                    <td className="p-3 text-[#1A3B2B] font-semibold">100% refund</td>
                    <td className="p-3">100% refund</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">3 to 6 days before approved event</td>
                    <td className="p-3">50% refund</td>
                    <td className="p-3">100% refund</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">&lt; 48 hours before approved event</td>
                    <td className="p-3">Non-refundable (deposit still returned)</td>
                    <td className="p-3">100% refund</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Municipal / Maintenance Cancellation</td>
                    <td className="p-3 text-[#1A3B2B] font-semibold">100% full refund</td>
                    <td className="p-3">100% refund</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[#1C1917]">4. Auto-Renewal, Invoicing &amp; Billing Disputes</h2>
            <p>
              Recurring Civic Partner Passes auto-renew at the end of each cycle with email notice sent
              at least 7 days (monthly) or 30 days (annual) prior to renewal. Price adjustments apply
              only to subsequent cycles after 30 days advance notice. Billing inquiries and tax/GST
              invoice requests can be directed to{' '}
              <span className="font-mono text-xs">{COMPLIANCE_CONTACTS.billingEmail}</span>.
            </p>
          </section>
        </>
      );

    default:
      return null;
  }
}
