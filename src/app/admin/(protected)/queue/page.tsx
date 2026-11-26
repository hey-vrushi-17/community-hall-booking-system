import { Metadata } from 'next';
import { getAllBookings } from '@/lib/services/booking-store';
import { getAllHallsAdmin } from '@/lib/services/hall-service';
import { RequestQueueClient } from '@/components/admin/request-queue-client';

export const metadata: Metadata = {
  title: 'Booking Request Queue | CivicSpaces Administration',
  description: 'Review, approve, and decline community hall reservation requests.',
};

export const instant = false;

export default async function AdminQueuePage() {
  const [bookings, halls] = await Promise.all([
    getAllBookings(),
    getAllHallsAdmin(true),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5DFD5] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
          Booking Request Queue
        </h1>
        <p className="text-xs sm:text-sm text-[#615B52] mt-1">
          Evaluate submitted citizen reservations, verify facility capacity compliance, and issue administrative approval decisions.
        </p>
      </div>

      <RequestQueueClient initialBookings={bookings} halls={halls} />
    </div>
  );
}
