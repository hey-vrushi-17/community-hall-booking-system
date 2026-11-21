import { Metadata } from 'next';
import { getAdminDashboardSummary } from '@/lib/services/booking-store';
import { getAllHalls } from '@/lib/services/hall-service';
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client';

export const metadata: Metadata = {
  title: 'Administrative Dashboard | CivicSpaces',
  description: 'Overview of community hall reservations, utilization, and maintenance.',
};

export const instant = false;

export default async function AdminDashboardPage() {
  const [summary, halls] = await Promise.all([
    getAdminDashboardSummary(),
    getAllHalls(),
  ]);

  return (
    <div className="space-y-6">
      {/* Title & Scope */}
      <div className="border-b border-[#E5DFD5] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
          Facilities Management Overview
        </h1>
        <p className="text-xs sm:text-sm text-[#615B52] mt-1">
          Review pending public booking submissions, track venue capacity utilization, and inspect scheduled facility closures.
        </p>
      </div>

      <AdminDashboardClient summary={summary} halls={halls} />
    </div>
  );
}
