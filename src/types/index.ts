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
  entityType: 'Booking' | 'Hall' | 'MaintenanceWindow' | 'Profile';
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
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
