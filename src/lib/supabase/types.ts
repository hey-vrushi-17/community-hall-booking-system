import { Hall, Booking, MaintenanceWindow, BookingStatus, MaintenanceStatus, Role } from '@/types';
import { BookingFormData } from '@/lib/validation/booking-schema';

export interface DatabaseHallRow {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  hourly_rate: number | string;
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
  is_active: boolean;
  rules_and_policies: string[];
  operating_hours: {
    open: string;
    close: string;
    days: string;
  };
  created_at: string;
  updated_at: string;
}

export interface DatabaseBookingRow {
  id: string;
  reference_number: string;
  hall_id: string;
  user_id: string | null;
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  requester_org: string | null;
  event_name: string;
  event_type: string;
  expected_attendees: number;
  special_requests: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  decision_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  halls?: {
    name: string;
  } | null;
}

export interface DatabaseMaintenanceRow {
  id: string;
  hall_id: string;
  title: string;
  reason: string;
  start_time: string;
  end_time: string;
  status: MaintenanceStatus;
  created_at: string;
  updated_at: string;
  halls?: {
    name: string;
  } | null;
}

export interface DatabaseProfileRow {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
  organization: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Transform database snake_case row into client-friendly Hall entity
 */
export function mapHallFromDb(row: DatabaseHallRow): Hall {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    hourlyRate: Number(row.hourly_rate),
    capacity: row.capacity,
    location: row.location,
    address: row.address,
    neighborhood: row.neighborhood,
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    images: Array.isArray(row.images) ? row.images : [],
    featured: Boolean(row.featured),
    isActive: Boolean(row.is_active),
    rulesAndPolicies: Array.isArray(row.rules_and_policies) ? row.rules_and_policies : [],
    operatingHours: row.operating_hours || {
      open: '08:00',
      close: '22:00',
      days: 'Monday through Sunday',
    },
  };
}

/**
 * Transform database snake_case row into client-friendly Booking entity
 */
export function mapBookingFromDb(row: DatabaseBookingRow, fallbackHallName?: string): Booking {
  return {
    id: row.id,
    referenceNumber: row.reference_number,
    hallId: row.hall_id,
    hallName: row.halls?.name || fallbackHallName || 'Community Hall',
    userId: row.user_id,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    requesterPhone: row.requester_phone,
    requesterOrg: row.requester_org,
    eventName: row.event_name,
    eventType: row.event_type,
    expectedAttendees: row.expected_attendees,
    specialRequests: row.special_requests,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    decisionNotes: row.decision_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transform database snake_case row into client-friendly MaintenanceWindow entity
 */
export function mapMaintenanceFromDb(
  row: DatabaseMaintenanceRow,
  fallbackHallName?: string
): MaintenanceWindow {
  return {
    id: row.id,
    hallId: row.hall_id,
    hallName: row.halls?.name || fallbackHallName || 'Community Hall',
    title: row.title,
    reason: row.reason,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
