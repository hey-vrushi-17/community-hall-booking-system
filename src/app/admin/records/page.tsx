import { Metadata } from 'next';
import { getAllBookings } from '@/lib/services/booking-store';
import { getAllHalls } from '@/lib/services/hall-service';
import { BookingRecordsClient } from '@/components/admin/booking-records-client';

export const metadata: Metadata = {
  title: 'Booking Records Archive | CivicSpaces Administration',
  description: 'Historical archive and registry of community hall bookings.',
};

export const instant = false;

export default async function AdminRecordsPage() {
  const [bookings, halls] = await Promise.all([
    getAllBookings(),
    getAllHalls(),
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-[#E5DFD5] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
          Municipal Booking Records
        </h1>
        <p className="text-xs sm:text-sm text-[#615B52] mt-1">
          Search historical reservation records by date range, facility location, and administrative status.
        </p>
      </div>

      <BookingRecordsClient initialBookings={bookings} halls={halls} />
    </div>
  );
}
