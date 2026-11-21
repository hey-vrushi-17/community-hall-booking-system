import { Metadata } from 'next';
import { getAllBookings, getAllMaintenance } from '@/lib/services/booking-store';
import { getAllHalls } from '@/lib/services/hall-service';
import { AdminCalendarClient } from '@/components/admin/admin-calendar-client';

export const metadata: Metadata = {
  title: 'Master Facility Calendar | CivicSpaces Administration',
  description: 'Master calendar showing confirmed events and scheduled maintenance.',
};

export const instant = false;

export default async function AdminCalendarPage() {
  const [bookings, maintenance, halls] = await Promise.all([
    getAllBookings(),
    getAllMaintenance(),
    getAllHalls(),
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-[#E5DFD5] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
          Master Facility Calendar
        </h1>
        <p className="text-xs sm:text-sm text-[#615B52] mt-1">
          Review upcoming confirmed community reservations and scheduled municipal maintenance closures across all civic venues.
        </p>
      </div>

      <AdminCalendarClient
        bookings={bookings}
        maintenance={maintenance}
        halls={halls}
      />
    </div>
  );
}
