import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { MyRequestsClient } from './my-requests-client';

export const metadata: Metadata = {
  title: 'My Booking Requests | CivicSpaces',
  description: 'View your submitted community hall booking requests and track their review status.',
};

export default function MyRequestsPage() {
  return (
    <div className="py-10 md:py-14">
      <div className="civic-container space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#615B52]">
          <Link href="/" className="hover:text-[#1A3B2B] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#1C1917]">My Booking Requests</span>
        </nav>

        {/* Header */}
        <div className="border-b border-[#E5DFD5] pb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EBF3EE] text-[#1A3B2B] text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Citizen Portal</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-[#1C1917] tracking-tight mb-2">
            My Booking Requests
          </h1>

          <p className="text-sm md:text-base text-[#615B52] max-w-2xl leading-relaxed">
            Review your active community hall reservation submissions, check administrative review decisions, and access venue documents.
          </p>
        </div>

        {/* Client Portal */}
        <MyRequestsClient />
      </div>
    </div>
  );
}
