import { Metadata } from 'next';
import { getAuditEvents } from '@/lib/services/booking-store';
import { AuditHistoryClient } from '@/components/admin/audit-history-client';

export const metadata: Metadata = {
  title: 'Audit History | CivicSpaces Administration',
  description: 'Audit log of administrative decisions, hall updates, and maintenance changes.',
};

export const instant = false;

export default async function AdminAuditPage() {
  const events = await getAuditEvents();

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5DFD5] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
          Audit History &amp; Activity Registry
        </h1>
        <p className="text-xs sm:text-sm text-[#615B52] mt-1">
          Inspect a tamper-tracked log of booking approvals, rejections, cancellations, facility updates, and maintenance actions.
        </p>
      </div>

      <AuditHistoryClient initialEvents={events} />
    </div>
  );
}
