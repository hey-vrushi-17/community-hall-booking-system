import { Metadata } from 'next';
import { getAllHallsAdmin } from '@/lib/services/hall-service';
import { HallManagementClient } from '@/components/admin/hall-management-client';

export const metadata: Metadata = {
  title: 'Facility Halls Management | CivicSpaces Admin',
  description: 'Create, update, and manage municipal hall inventory and operational availability.',
};

export const instant = false;

export default async function AdminHallsPage() {
  const halls = await getAllHallsAdmin(true);

  return (
    <div className="space-y-6">
      {/* Page Title & Scope */}
      <div className="border-b border-[#E5DFD5] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
          Facility Halls & Inventory
        </h1>
        <p className="text-xs sm:text-sm text-[#615B52] mt-1">
          Catalog municipal civic spaces, adjust operational hours, update amenities, and manage facility availability status.
        </p>
      </div>

      <HallManagementClient initialHalls={halls} />
    </div>
  );
}
