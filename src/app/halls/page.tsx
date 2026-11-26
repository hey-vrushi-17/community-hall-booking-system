import { Metadata } from 'next';
import { getAllHallsSafe, getAllAmenities, getAllNeighborhoods } from '@/lib/services/hall-service';
import { HallFilterView } from '@/components/halls/hall-filter-view';
import { Landmark, AlertTriangle } from 'lucide-react';
import { DataSourceIndicator } from '@/components/ui/datasource-indicator';

export const metadata: Metadata = {
  title: 'Community Halls Directory | CivicSpaces',
  description:
    'Browse municipal community halls, filter by date, capacity, location, and amenities, and submit booking requests.',
};

export const instant = false;

export default async function HallsPage() {
  const { halls, dbError } = await getAllHallsSafe();
  const amenities = getAllAmenities(halls);
  const neighborhoods = getAllNeighborhoods(halls);

  return (
    <div className="py-10 md:py-14">
      <div className="civic-container space-y-8">
        <DataSourceIndicator />

        <div className="border-b border-[#E5DFD5] pb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EBF3EE] text-[#1A3B2B] text-xs font-semibold mb-3">
            <Landmark className="w-3.5 h-3.5" />
            <span>Public Facility Directory</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-[#1C1917] tracking-tight mb-3">
            Municipal Community Halls
          </h1>

          <p className="text-sm md:text-base text-[#615B52] max-w-2xl leading-relaxed">
            Explore public halls and neighborhood gathering spaces across our civic districts.
            Filter by event date, guest capacity, city, and amenities to begin your reservation request.
          </p>
        </div>

        {dbError ? (
          <div className="civic-card p-10 bg-white border border-[#FECDCA] text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-[#B42318] mx-auto" />
            <h2 className="text-lg font-bold text-[#1C1917]">
              Unable to Load Live Hall Listings
            </h2>
            <p className="text-xs text-[#615B52] max-w-lg mx-auto leading-relaxed">
              {dbError}
            </p>
          </div>
        ) : (
          <HallFilterView
            initialHalls={halls}
            availableAmenities={amenities}
            availableNeighborhoods={neighborhoods}
          />
        )}
      </div>
    </div>
  );
}
