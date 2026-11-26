/**
 * Configurable Civic Portal & Booking Rules Configuration
 *
 * Reads optional environment variables so municipal deployments can customize
 * timezone, support contact details, and booking window rules without code changes.
 */

export const APP_TIMEZONE =
  process.env.NEXT_PUBLIC_APP_TIMEZONE?.trim() || 'Asia/Kolkata';

export const APP_TIMEZONE_LABEL =
  APP_TIMEZONE === 'Asia/Kolkata' ? 'IST (UTC+5:30)' : APP_TIMEZONE;

export const MAX_ADVANCE_BOOKING_DAYS = 365;

export const SITE_CONFIG = {
  portalName: process.env.NEXT_PUBLIC_PORTAL_NAME?.trim() || 'CivicSpaces',
  divisionName:
    process.env.NEXT_PUBLIC_DIVISION_NAME?.trim() ||
    'Municipal Facilities Division',
  bylawReference:
    process.env.NEXT_PUBLIC_BYLAW_REF?.trim() ||
    'Municipal Civic Venue Guidelines',
  supportOffice:
    process.env.NEXT_PUBLIC_SUPPORT_OFFICE?.trim() ||
    'Facilities Coordination Desk (Configured in Environment)',
  supportPhone:
    process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() ||
    'Configure NEXT_PUBLIC_SUPPORT_PHONE',
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    'facilities-desk@example.org',
  supportHours:
    process.env.NEXT_PUBLIC_SUPPORT_HOURS?.trim() ||
    'Monday – Friday, 9:00 AM – 5:00 PM',
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000',
};
