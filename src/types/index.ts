export type Role = 'CITIZEN' | 'STAFF' | 'ADMIN';

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  organization: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Hall {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  hourlyRate: number;
  capacity: number;
  location: string;
  address: string;
  neighborhood: string;
  amenities: string[];
  images: {
    url: string;
    alt: string;
    credit?: string;
  }[];
  featured: boolean;
  isActive: boolean;
  rulesAndPolicies: string[];
  operatingHours: {
    open: string;
    close: string;
    days: string;
  };
}

export interface Booking {
  id: string;
  referenceNumber: string;
  hallId: string;
  hallName?: string;
  userId?: string | null;
  
  // Requester
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  requesterOrg?: string | null;
  
  // Event
  eventName: string;
  eventType: string;
  expectedAttendees: number;
  specialRequests?: string | null;
  
  // Schedule
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  
  // Decision details
  status: BookingStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  decisionNotes?: string | null;
  
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceWindow {
  id: string;
  hallId: string;
  hallName?: string;
  title: string;
  reason: string;
  startTime: string; // ISO 8601 UTC
  endTime: string;   // ISO 8601 UTC
  status: MaintenanceStatus;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  actorId?: string | null;
  actorEmail: string;
  action: string;
  entityType:
    | 'Booking'
    | 'Hall'
    | 'MaintenanceWindow'
    | 'Profile'
    | 'Consent'
    | 'DeletionRequest'
    | 'BreachIncident';
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export type ConsentType =
  | 'COOKIE_ESSENTIAL'
  | 'COOKIE_FUNCTIONAL'
  | 'COOKIE_ANALYTICS'
  | 'MARKETING_EMAIL'
  | 'TERMS_AND_PRIVACY'
  | 'PAYMENT_TERMS';

export interface CookiePreferences {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  version: string;
  updatedAt: string;
}

export interface ConsentRecord {
  id: string;
  userId?: string | null;
  subjectEmail?: string | null;
  consentType: ConsentType;
  granted: boolean;
  policyVersion: string;
  source: string;
  legalBasis: string;
  recordedAt: string;
  metadata?: Record<string, unknown>;
}

export type DeletionRequestStatus = 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED';

export interface DataDeletionRequest {
  id: string;
  referenceCode: string;
  userId?: string | null;
  requesterEmail: string;
  requesterName?: string | null;
  bookingReference?: string | null;
  scope: 'FULL_ACCOUNT' | 'BOOKING_PII' | 'MARKETING_DATA';
  reason?: string | null;
  status: DeletionRequestStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  resolutionNotes?: string | null;
  anonymizedRecordsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type BreachSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type BreachStatus =
  | 'DETECTED'
  | 'CONTAINED'
  | 'ASSESSING'
  | 'NOTIFIED_AUTHORITY'
  | 'NOTIFIED_SUBJECTS'
  | 'RESOLVED';

export interface BreachIncident {
  id: string;
  incidentCode: string;
  title: string;
  severity: BreachSeverity;
  status: BreachStatus;
  affectedDataCategories: string[];
  estimatedAffectedSubjects: number;
  summary: string;
  containmentActions: string;
  detectedAt: string;
  notificationDeadlineAt: string; // 72 hours after detectedAt (GDPR Art. 33)
  authorityNotifiedAt?: string | null;
  subjectsNotifiedAt?: string | null;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFeeSummary {
  hourlyRate: number;
  durationHours: number;
  baseRentalFee: number;
  securityDeposit: number;
  estimatedTotalDueOnApproval: number;
  currency: 'INR';
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  conflictReason?: 'APPROVED_BOOKING' | 'MAINTENANCE_WINDOW' | 'OUTSIDE_HOURS';
  conflictDetails?: string;
  bookingStatus?: BookingStatus;
}

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  hallId: string;
  requestedStart: string;
  requestedEnd: string;
  conflictingBookings: Booking[];
  conflictingMaintenance: MaintenanceWindow[];
  message: string;
  dataSource: 'ISOLATED_SAMPLE_STORE' | 'LIVE_DATABASE';
}

export interface HallFilters {
  search?: string;
  minCapacity?: number;
  maxCapacity?: number;
  amenities?: string[];
  date?: string;
}

export interface HallUtilization {
  hallId: string;
  hallName: string;
  capacity: number;
  totalBookings: number;
  approvedHours: number;
  utilizationRate: number; // percentage (0-100)
}

export interface AdminDashboardSummary {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  activeMaintenanceCount: number;
  totalBookingsCount: number;
  hallUtilization: HallUtilization[];
  recentPendingRequests: Booking[];
  upcomingApprovedBookings: Booking[];
  activeMaintenance: MaintenanceWindow[];
}
