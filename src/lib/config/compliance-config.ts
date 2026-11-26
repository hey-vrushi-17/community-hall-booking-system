import { BookingFeeSummary } from '@/types';

export const COMPLIANCE_VERSIONS = {
  privacyPolicy: '2026.1',
  termsAndConditions: '2026.1',
  gdprNotice: '2026.1',
  cookiePolicy: '2026.1',
  paymentTerms: '2026.1',
  dpaVersion: '2026.1',
  effectiveDate: '26 November 2026',
  lastReviewedDate: '26 November 2026',
} as const;

export const COOKIE_CONSENT_COOKIE_NAME = 'civic_cookie_consent';

export const COMPLIANCE_CONTACTS = {
  dataController:
    process.env.NEXT_PUBLIC_DIVISION_NAME?.trim() || 'Municipal Facilities Division',
  dpoEmail:
    process.env.NEXT_PUBLIC_DPO_EMAIL?.trim() || 'dpo-privacy@civic.example',
  securityEmail:
    process.env.NEXT_PUBLIC_SECURITY_EMAIL?.trim() || 'security-incident@civic.example',
  billingEmail:
    process.env.NEXT_PUBLIC_BILLING_EMAIL?.trim() || 'facilities-billing@civic.example',
  supervisoryAuthority:
    'Data Protection Board of India / EU EEA Lead Supervisory Authority (where applicable under GDPR Art. 3(2))',
} as const;

export interface LegalDocumentMeta {
  number: string;
  slug: string;
  title: string;
  shortTitle: string;
  category:
    | 'Privacy & Data Rights'
    | 'Governance & Security'
    | 'Legal & Commercial';
  summary: string;
  interactivePath?: string;
  interactiveLabel?: string;
}

export const LEGAL_DOCUMENTS: LegalDocumentMeta[] = [
  {
    number: '01',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    shortTitle: 'Privacy Policy',
    category: 'Privacy & Data Rights',
    summary:
      'How CivicSpaces collects, uses, masks, protects, and shares personal data across bookings, citizen accounts, and staff operations.',
    interactivePath: '/privacy-center',
    interactiveLabel: 'Open Privacy Center',
  },
  {
    number: '02',
    slug: 'terms',
    title: 'Terms & Conditions',
    shortTitle: 'Terms & Conditions',
    category: 'Legal & Commercial',
    summary:
      'Rules governing community hall booking requests, pending review status, venue conduct, capacity compliance, and cancellations.',
  },
  {
    number: '03',
    slug: 'gdpr',
    title: 'GDPR Compliance',
    shortTitle: 'GDPR Compliance',
    category: 'Privacy & Data Rights',
    summary:
      'Implementation of GDPR Articles 12–22 data subject rights including automated JSON data export, rectification, and erasure.',
    interactivePath: '/privacy-center',
    interactiveLabel: 'Export Your Data',
  },
  {
    number: '04',
    slug: 'cookies',
    title: 'Cookie Consent & Tracking Policy',
    shortTitle: 'Cookie Consent',
    category: 'Privacy & Data Rights',
    summary:
      'Inventory of strictly necessary authentication cookies, functional storage, opt-in analytics, and consent preference controls.',
    interactivePath: '/privacy-center#cookies',
    interactiveLabel: 'Manage Cookie Settings',
  },
  {
    number: '05',
    slug: 'legal-basis',
    title: 'Legal Basis for Data Processing',
    shortTitle: 'Legal Basis',
    category: 'Privacy & Data Rights',
    summary:
      'Article 6(1) lawful basis mapping (Contract, Public Task, Legal Obligation, Consent, Legitimate Interests) for every processing activity.',
  },
  {
    number: '06',
    slug: 'marketing-consent',
    title: 'Marketing Consent & Communications',
    shortTitle: 'Marketing Consent',
    category: 'Privacy & Data Rights',
    summary:
      'Unbundled, opt-in civic updates and seasonal availability communications with instant one-click withdrawal.',
    interactivePath: '/privacy-center#marketing',
    interactiveLabel: 'Update Marketing Preferences',
  },
  {
    number: '07',
    slug: 'data-deletion',
    title: 'Data Deletion & Right to Erasure',
    shortTitle: 'Data Deletion',
    category: 'Privacy & Data Rights',
    summary:
      'Self-service and administrator-verified erasure workflows under GDPR Art. 17, including PII anonymization and statutory exceptions.',
    interactivePath: '/privacy-center#deletion',
    interactiveLabel: 'Request Data Deletion',
  },
  {
    number: '08',
    slug: 'data-retention',
    title: 'Data Retention Schedule',
    shortTitle: 'Data Retention',
    category: 'Governance & Security',
    summary:
      'Defined retention durations, archival triggers, and anonymization methods for bookings, profiles, audit logs, and security records.',
  },
  {
    number: '09',
    slug: 'dpa',
    title: 'Data Processing Agreements (DPA)',
    shortTitle: 'Data Processing Agreements',
    category: 'Governance & Security',
    summary:
      'GDPR Article 28 Data Processing Agreement terms for municipal agencies, partner civic organizers, and sub-processors.',
  },
  {
    number: '10',
    slug: 'third-party-disclosures',
    title: 'Third-Party Disclosures & Sub-Processors',
    shortTitle: 'Third-Party Disclosures',
    category: 'Governance & Security',
    summary:
      'Complete registry of authorized infrastructure sub-processors, public-records disclosure rules, and strict zero-sale commitment.',
  },
  {
    number: '11',
    slug: 'data-security',
    title: 'Data Security & Technical Controls',
    shortTitle: 'Data Security',
    category: 'Governance & Security',
    summary:
      'PostgreSQL Row Level Security (RLS), PII masking, HMAC-signed admin sessions, exclusion constraints, and HTTP security headers.',
  },
  {
    number: '12',
    slug: 'data-breach',
    title: 'Data Breach Procedures',
    shortTitle: 'Data Breach Procedures',
    category: 'Governance & Security',
    summary:
      '72-hour GDPR Articles 33–34 incident detection, containment, supervisory authority reporting, and affected citizen notification protocol.',
    interactivePath: '/admin/compliance',
    interactiveLabel: 'Staff Breach Console',
  },
  {
    number: '13',
    slug: 'intellectual-property',
    title: 'Intellectual Property Notice',
    shortTitle: 'Intellectual Property',
    category: 'Legal & Commercial',
    summary:
      'Ownership of CivicSpaces portal software, municipal seals, venue photography credits, and user-submitted event content licensing.',
  },
  {
    number: '14',
    slug: 'open-source-licences',
    title: 'Open-Source Licences & Attributions',
    shortTitle: 'Open-Source Licences',
    category: 'Legal & Commercial',
    summary:
      'Full SPDX licence attributions for Next.js, React, Supabase JS/SSR, Tailwind CSS, Zod, Lucide, Base UI, and build tooling.',
  },
  {
    number: '15',
    slug: 'payment-terms',
    title: 'Payment & Subscription Terms',
    shortTitle: 'Payment & Subscription Terms',
    category: 'Legal & Commercial',
    summary:
      'Hall hourly fee calculations, security deposits, municipal/NGO waivers, refund windows, and Civic Organizer recurring pass terms.',
  },
];

export interface LegalBasisEntry {
  activity: string;
  dataCategories: string;
  gdprBasis: string;
  statutoryReference: string;
  retentionRef: string;
}

export const LEGAL_BASIS_MATRIX: LegalBasisEntry[] = [
  {
    activity: 'Booking Request Submission & Schedule Review',
    dataCategories: 'Requester name, email, phone, organization, event details, time slot',
    gdprBasis: 'Contract / Pre-contractual Steps & Public Task',
    statutoryReference: 'GDPR Art. 6(1)(b) & Art. 6(1)(e)',
    retentionRef: '12 months (rejected/cancelled) / 7 years fee ledger (approved)',
  },
  {
    activity: 'Citizen Account Authentication & Profile Management',
    dataCategories: 'Email, salted password hash, full name, phone, organization, session cookies',
    gdprBasis: 'Contract Performance',
    statutoryReference: 'GDPR Art. 6(1)(b)',
    retentionRef: 'Active account lifetime + 30 days after deletion request',
  },
  {
    activity: 'Public Reference Lookup Redaction & Anti-Enumeration',
    dataCategories: 'Booking reference number, masked email/phone',
    gdprBasis: 'Legitimate Interests (Data Minimization & Security)',
    statutoryReference: 'GDPR Art. 6(1)(f) & Art. 32',
    retentionRef: 'Transient API response (not stored separately)',
  },
  {
    activity: 'Tamper-Tracked Administrative Audit Logging',
    dataCategories: 'Actor ID/email, action type, entity reference, timestamp, decision notes',
    gdprBasis: 'Legal Obligation & Legitimate Interests (Governance)',
    statutoryReference: 'GDPR Art. 6(1)(c) & Art. 6(1)(f)',
    retentionRef: '7 years (pseudonymized upon user erasure)',
  },
  {
    activity: 'Optional Marketing & Civic Event Updates',
    dataCategories: 'Email address, opt-in timestamp, preference flag',
    gdprBasis: 'Explicit Consent (Opt-in, withdrawable anytime)',
    statutoryReference: 'GDPR Art. 6(1)(a) & Art. 7',
    retentionRef: 'Until withdrawn + 5 years proof of consent log',
  },
  {
    activity: 'Non-Essential Analytics & Preference Cookies',
    dataCategories: 'Pseudonymous preference flags, consent receipt',
    gdprBasis: 'Explicit Consent (Prior opt-in)',
    statutoryReference: 'GDPR Art. 6(1)(a) & ePrivacy Directive Art. 5(3)',
    retentionRef: '180 days cookie / 5 years consent receipt',
  },
  {
    activity: 'Data Breach & Erasure Compliance Records',
    dataCategories: 'Incident metadata, deletion reference code, verification timestamp',
    gdprBasis: 'Legal Obligation (Accountability)',
    statutoryReference: 'GDPR Art. 6(1)(c), Art. 5(2), Art. 33(5)',
    retentionRef: '7 years regulatory accountability log',
  },
];

export interface DataRetentionEntry {
  category: string;
  examples: string;
  retentionPeriod: string;
  trigger: string;
  disposalMethod: string;
}

export const DATA_RETENTION_SCHEDULE: DataRetentionEntry[] = [
  {
    category: 'Pending, Rejected & Cancelled Booking PII',
    examples: 'Requester name, email, phone, special setup notes',
    retentionPeriod: '12 months',
    trigger: 'Date of rejection, cancellation, or lapsed event date',
    disposalMethod: 'Automated PII redaction / anonymization while preserving hall demand metrics',
  },
  {
    category: 'Approved Booking & Fee Records',
    examples: 'Booking reference, hall ID, event schedule, fee summary, decision notes',
    retentionPeriod: '7 years (PII anonymized after 24 months)',
    trigger: 'Completion of scheduled event & fiscal year close',
    disposalMethod: 'Contact PII scrubbed at 24 months; anonymized financial/audit ledger kept 7 years',
  },
  {
    category: 'Citizen Accounts & Profiles',
    examples: 'Supabase auth user record, full name, phone, organization',
    retentionPeriod: 'Active + 24 months inactivity (or immediate upon Art. 17 request)',
    trigger: 'User deletion request or 24-month inactivity notice expiration',
    disposalMethod: 'Cascade deletion of profile + session revocation within 30 days',
  },
  {
    category: 'Administrative Audit Events',
    examples: 'APPROVE_BOOKING, REJECT_BOOKING, CREATE_HALL, CANCEL_MAINTENANCE',
    retentionPeriod: '7 years',
    trigger: 'Event timestamp',
    disposalMethod: 'Immutable governance archive; actor email replaced with anonymized token if erased',
  },
  {
    category: 'Consent & Cookie Preference Receipts',
    examples: 'Marketing opt-in/out logs, cookie category timestamps, policy version',
    retentionPeriod: '5 years',
    trigger: 'Consent grant or withdrawal date',
    disposalMethod: 'Purged or aggregated after 5-year compliance verification window',
  },
  {
    category: 'Security & Data Breach Incident Registers',
    examples: 'Incident timeline, containment steps, notification timestamps',
    retentionPeriod: '7 years',
    trigger: 'Incident closure date',
    disposalMethod: 'Encrypted regulatory archive; no raw citizen PII stored in incident summaries',
  },
];

export interface SubProcessorEntry {
  name: string;
  role: string;
  dataProcessed: string;
  location: string;
  safeguards: string;
  purpose: string;
}

export const SUB_PROCESSORS: SubProcessorEntry[] = [
  {
    name: 'Supabase Inc.',
    role: 'Primary Database, Authentication & Object Storage',
    dataProcessed: 'Profiles, bookings, hall imagery, audit events, auth sessions',
    location: 'Configurable Region (EU / India / US via Supabase Project Region)',
    safeguards: 'SOC 2 Type II, ISO 27001, Encryption at rest (AES-256) & TLS 1.2+, DPA & SCCs',
    purpose: 'Core PostgreSQL persistence, Row Level Security (RLS), and citizen auth',
  },
  {
    name: 'Application Hosting & Edge Runtime Provider',
    role: 'Web Application Compute & TLS Termination',
    dataProcessed: 'HTTP request metadata, transient server-rendered payloads, session cookies',
    location: 'Primary deployment region configured by operator',
    safeguards: 'HTTPS/TLS enforcement, HTTP security headers, DDoS mitigation',
    purpose: 'Serving Next.js App Router pages and authenticated API routes',
  },
  {
    name: 'Municipal Payment Gateway (Optional / When Enabled)',
    role: 'Fee & Subscription Settlement Processor',
    dataProcessed: 'Booking reference, invoice amount, payer settlement token (no raw card PAN stored by CivicSpaces)',
    location: 'Domestic / PCI-DSS compliant clearing region',
    safeguards: 'PCI-DSS Level 1 tokenization, 3D Secure / UPI mandate verification',
    purpose: 'Collecting approved hall rental deposits and recurring organizer pass fees',
  },
  {
    name: 'Static Media & Font Delivery (Geist / Venue Imagery)',
    role: 'Visual Assets & Typography',
    dataProcessed: 'Public asset requests only (no user PII transmitted)',
    location: 'Self-hosted Next.js static bundle / Configured Storage bucket',
    safeguards: 'No tracking pixels or third-party ad cookies attached',
    purpose: 'Rendering accessible UI typography and hall photography',
  },
];

export interface OpenSourcePackage {
  name: string;
  version: string;
  license: string;
  category: string;
  purpose: string;
}

export const OPEN_SOURCE_PACKAGES: OpenSourcePackage[] = [
  { name: 'next', version: '16.4.6', license: 'MIT', category: 'Framework', purpose: 'React full-stack App Router framework & server components' },
  { name: 'react', version: '19.3.0', license: 'MIT', category: 'UI Runtime', purpose: 'Declarative component UI library' },
  { name: 'react-dom', version: '19.3.0', license: 'MIT', category: 'UI Runtime', purpose: 'DOM renderer for React 19' },
  { name: '@supabase/supabase-js', version: '^2.119.0', license: 'MIT', category: 'Database & Auth', purpose: 'Supabase Postgres, Auth, RPC, and Storage client' },
  { name: '@supabase/ssr', version: '^0.12.7', license: 'MIT', category: 'Database & Auth', purpose: 'Cookie-based server-side Supabase session management' },
  { name: 'zod', version: '^4.6.7', license: 'MIT', category: 'Validation', purpose: 'Runtime schema validation for bookings, halls, and compliance forms' },
  { name: 'lucide-react', version: '^1.73.0', license: 'ISC', category: 'Iconography', purpose: 'Accessible vector icon set' },
  { name: '@base-ui/react', version: '^1.9.0', license: 'MIT', category: 'UI Primitives', purpose: 'Unstyled accessible UI primitives' },
  { name: 'tailwindcss', version: '4.3.3', license: 'MIT', category: 'Styling', purpose: 'Utility-first CSS engine' },
  { name: 'shadcn', version: '^4.23.0', license: 'MIT', category: 'UI System', purpose: 'Composable accessible component tokens' },
  { name: 'class-variance-authority', version: '^0.7.1', license: 'Apache-2.0', category: 'Styling', purpose: 'Type-safe component style variants' },
  { name: 'clsx', version: '^2.1.1', license: 'MIT', category: 'Styling', purpose: 'Conditional className utility' },
  { name: 'tailwind-merge', version: '^3.7.0', license: 'MIT', category: 'Styling', purpose: 'Conflict-free Tailwind class merging' },
  { name: 'tw-animate-css', version: '^1.4.0', license: 'MIT', category: 'Styling', purpose: 'CSS animation utilities for Tailwind v4' },
  { name: 'typescript', version: '^5', license: 'Apache-2.0', category: 'Tooling', purpose: 'Static type checking across client and server' },
  { name: 'tsx', version: '^4.23.15', license: 'MIT', category: 'Tooling', purpose: 'TypeScript script & domain verification runner' },
  { name: 'eslint', version: '^9', license: 'MIT', category: 'Tooling', purpose: 'Static code quality & accessibility linting' },
];

export interface SubscriptionPlanTier {
  id: string;
  name: string;
  billingCycle: string;
  priceInr: number;
  eligibleFor: string;
  benefits: string[];
  cancellationTerms: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanTier[] = [
  {
    id: 'pay-per-booking',
    name: 'Standard Pay-Per-Booking',
    billingCycle: 'Per approved reservation',
    priceInr: 0,
    eligibleFor: 'Individual citizens, families & one-time cultural gatherings',
    benefits: [
      'No recurring platform subscription fee',
      'Pay only published hall hourly rate upon administrator approval',
      '100% refundable security deposit released within 7 business days post-event',
    ],
    cancellationTerms: 'Cancel free while PENDING; tiered refund after approval (see Schedule below).',
  },
  {
    id: 'civic-partner-monthly',
    name: 'Civic Partner Pass (Monthly)',
    billingCycle: 'Monthly recurring (auto-renews unless cancelled)',
    priceInr: 2500,
    eligibleFor: 'Resident Welfare Associations, neighborhood clubs & recurring workshops',
    benefits: [
      '15% concession on standard municipal hall hourly rates',
      'Waived booking processing fee across up to 4 monthly reservations',
      'Priority 48-hour hold notice for recurring community series',
    ],
    cancellationTerms: 'Cancel anytime in My Requests or via billing desk; remains active until end of paid billing cycle.',
  },
  {
    id: 'registered-ngo-annual',
    name: 'Registered Non-Profit & Cultural Trust (Annual)',
    billingCycle: 'Annual recurring (with 30-day renewal reminder)',
    priceInr: 18000,
    eligibleFor: 'Verified 80G/12A NGOs, public schools & civic arts trusts',
    benefits: [
      '30% municipal public-interest concession on eligible auditoriums',
      'Reduced 50% refundable security deposit threshold',
      'Dedicated annual consolidated GST & municipal tax invoice pack',
    ],
    cancellationTerms: 'Full refund within 14 days of initial purchase if no discounted booking has been approved.',
  },
];

export function calculateBookingFeeSummary(
  hourlyRate: number,
  startTime: string,
  endTime: string
): BookingFeeSummary | null {
  if (!startTime || !endTime || endTime <= startTime) {
    return null;
  }
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) {
    return null;
  }
  const durationMinutes = eh * 60 + em - (sh * 60 + sm);
  if (durationMinutes <= 0) {
    return null;
  }
  const durationHours = Math.round((durationMinutes / 60) * 100) / 100;
  const baseRentalFee = Math.round(hourlyRate * durationHours);
  // Refundable civic security deposit: 25% of base rental fee (minimum ₹500 when hourlyRate > 0)
  const securityDeposit =
    hourlyRate > 0 ? Math.max(500, Math.round(baseRentalFee * 0.25)) : 0;

  return {
    hourlyRate,
    durationHours,
    baseRentalFee,
    securityDeposit,
    estimatedTotalDueOnApproval: baseRentalFee + securityDeposit,
    currency: 'INR',
  };
}
