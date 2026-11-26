import { Metadata } from 'next';
import { getAllMaintenance } from '@/lib/services/booking-store';
import { getAllHallsAdmin } from '@/lib/services/hall-service';
import { MaintenanceManagementClient } from '@/components/admin/maintenance-management-client';

export const metadata: Metadata = {
  title: 'Facility Maintenance Coordination | CivicSpaces Admin',
  description: 'Schedule facility closures, coordinate maintenance windows, and prevent booking overlaps.',
};

export const instant = false;

export default async function AdminMaintenancePage() {
  const [maintenance, halls] = await Promise.all([
    getAllMaintenance(),
    getAllHallsAdmin(true),
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5DFD5] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
          Facility Maintenance &amp; Closures
        </h1>
        <p className="text-xs sm:text-sm text-[#615B52] mt-1">
          Coordinate facility closures and upkeep windows. Active maintenance windows automatically block overlapping public booking availability.
        </p>
      </div>

      <MaintenanceManagementClient initialMaintenance={maintenance} halls={halls} />
    </div>
  );
}
