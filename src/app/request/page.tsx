import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { CalendarPlus, AlertTriangle } from 'lucide-react';
import { getAllHallsSafe } from '@/lib/services/hall-service';
import { StandaloneBookingForm } from '@/components/halls/standalone-booking-form';
import { DataSourceIndicator } from '@/components/ui/datasource-indicator';

export const metadata: Metadata = {
  title: 'Submit Booking Request | CivicSpaces',
  description: 'Submit a community hall booking request for administrative review.',
};

export const instant = false;

interface PageProps {
  searchParams: Promise<{ hallId?: string; date?: string }>;
}

async function RequestFormContent({ searchParams }: PageProps) {
  const { hallId, date } = await searchParams;
  const { halls, dbError } = await getAllHallsSafe();

  if (dbError) {
    return (
      <div className="civic-card p-10 bg-white border border-[#FECDCA] text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-[#B42318] mx-auto" />
        <h2 className="text-base font-bold text-[#1C1917]">Booking Intake Unavailable</h2>
        <p className="text-xs text-[#615B52] max-w-md mx-auto">{dbError}</p>
      </div>
    );
  }

  return <StandaloneBookingForm halls={halls} initialHallId={hallId} initialDate={date} />;
}

export default function RequestBookingPage({ searchParams }: PageProps) {
  return (
    <div className="py-10 md:py-14">
      <div className="civic-container max-w-3xl space-y-8">
        <Suspense fallback={null}>
          <DataSourceIndicator />
        </Suspense>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#615B52]">
          <Link href="/" className="hover:text-[#1A3B2B] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/halls" className="hover:text-[#1A3B2B] transition-colors">
            Community Halls
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#1C1917]">Request Booking</span>
        </nav>

        <div className="border-b border-[#E5DFD5] pb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EBF3EE] text-[#1A3B2B] text-xs font-semibold mb-3">
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Preliminary Reservation Intake</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1C1917] tracking-tight">
            Request a Community Hall Booking
          </h1>
          <p className="text-sm text-[#615B52] mt-1.5 leading-relaxed">
            Provide your event details and preferred schedule. Every submitted request is checked against approved bookings and maintenance windows before entering the review queue.
          </p>
        </div>

        <Suspense fallback={<div className="py-12 text-center text-xs text-[#615B52]">Loading booking intake form...</div>}>
          <RequestFormContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
