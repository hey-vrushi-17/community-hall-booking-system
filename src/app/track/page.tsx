import { Metadata } from 'next';
import { Suspense } from 'react';
import { TrackRequestClient } from './track-client';

export const metadata: Metadata = {
  title: 'Track Booking Request | CivicSpaces',
  description:
    'Look up the real-time status of your municipal community hall booking request using your reference number.',
};

export default function TrackPage() {
  return (
    <div className="py-10 md:py-16">
      <div className="civic-container max-w-3xl space-y-8">
        <div className="border-b border-[#E5DFD5] pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1A3B2B] block mb-1">
            Citizen Public Services
          </span>
          <h1 className="text-3xl font-bold text-[#1C1917] tracking-tight">
            Track Booking Request Status
          </h1>
          <p className="text-sm text-[#615B52] mt-1.5 leading-relaxed">
            Enter the reference number assigned when your request was submitted (e.g.,{' '}
            <code className="font-mono bg-[#F3EFE8] px-1.5 py-0.5 rounded text-[#1C1917]">
              REQ-2026-8041
            </code>
            ) to review current review stage and administrative decision notes.
          </p>
        </div>

        <Suspense fallback={<div className="py-12 text-center text-xs text-[#615B52]">Loading tracking portal...</div>}>
          <TrackRequestClient />
        </Suspense>
      </div>
    </div>
  );
}
