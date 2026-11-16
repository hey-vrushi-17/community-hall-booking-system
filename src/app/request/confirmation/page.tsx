import { Metadata } from 'next';
import { getBookingByReference } from '@/lib/services/booking-store';
import { ConfirmationClient } from './confirmation-client';
import { Landmark } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Booking Request Confirmation | CivicSpaces',
  description: 'Review your submitted community hall booking reservation request details and status.',
};

interface PageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function RequestConfirmationPage({ searchParams }: PageProps) {
  const { ref } = await searchParams;
  const booking = ref ? await getBookingByReference(ref) : null;

  return (
    <div className="py-10 md:py-14">
      <div className="civic-container space-y-8">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#615B52]">
          <Link href="/" className="hover:text-[#1A3B2B] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/halls" className="hover:text-[#1A3B2B] transition-colors">
            Community Halls
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#1C1917]">Request Confirmation</span>
        </nav>

        {/* Client Interface */}
        <ConfirmationClient initialBooking={booking} refParam={ref} />
      </div>
    </div>
  );
}
