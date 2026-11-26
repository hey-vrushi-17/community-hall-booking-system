import { Metadata } from 'next';
import { getAdminDashboardSummary, getAuditEvents } from '@/lib/services/booking-store';
import { DatabaseSetupError, getAllHallsAdmin } from '@/lib/services/hall-service';
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client';
import { AlertTriangle } from 'lucide-react';
import { rethrowNextControlFlowError } from '@/lib/supabase/config';

export const metadata: Metadata = {
  title: 'Administrative Dashboard | CivicSpaces',
  description: 'Overview of community hall reservations, utilization, maintenance, and audit activity.',
};

export const instant = false;

export default async function AdminDashboardPage() {
  let summary = null;
  let halls = null;
  let recentAudit = null;
  let dbError: string | null = null;

  try {
    const [s, h, a] = await Promise.all([
      getAdminDashboardSummary(),
      getAllHallsAdmin(true),
      getAuditEvents(),
    ]);
    summary = s;
    halls = h;
    recentAudit = a;
  } catch (err: unknown) {
    rethrowNextControlFlowError(err);
    dbError =
      err instanceof DatabaseSetupError
        ? err.message
        : 'Unable to load administrative overview from the database.';
  }

  if (dbError || !summary || !halls || !recentAudit) {
    return (
      <div className="civic-card p-10 bg-white border border-[#FECDCA] text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-[#B42318] mx-auto" />
        <h1 className="text-lg font-bold text-[#1C1917]">Database Unavailable</h1>
        <p className="text-xs text-[#615B52] max-w-lg mx-auto">{dbError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5DFD5] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
          Facilities Management Overview
        </h1>
        <p className="text-xs sm:text-sm text-[#615B52] mt-1">
          Review pending booking requests, track hall capacity utilization, inspect scheduled maintenance, and monitor recent audit activity.
        </p>
      </div>

      <AdminDashboardClient
        summary={summary}
        halls={halls}
        recentAuditEvents={recentAudit.slice(0, 6)}
      />
    </div>
  );
}
