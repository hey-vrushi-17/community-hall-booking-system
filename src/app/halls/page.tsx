import { Metadata } from 'next';
import { getAllHalls, getAllAmenities, getAllNeighborhoods } from '@/lib/services/hall-service';
import { HallFilterView } from '@/components/halls/hall-filter-view';
import { Landmark, ShieldCheck } from 'lucide-react';
import { DataSourceIndicator } from '@/components/ui/datasource-indicator';

export const metadata: Metadata = {
  title: 'Community Halls Directory | CivicSpaces',
  description:
    'Browse municipal community halls, check capacity and amenities, and submit booking requests for public or private events.',
};

export default async function HallsPage() {
  const halls = await getAllHalls();
  const amenities = getAllAmenities(halls);
  const neighborhoods = getAllNeighborhoods(halls);

  return (
    <div className="py-10 md:py-14">
      <div className="civic-container space-y-8">
        {/* Data Source Configuration Banner */}
        <DataSourceIndicator />

        {/* Page Header */}
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
            Check capacity, available amenities, and live schedule availability to begin your reservation request.
          </p>
        </div>

        {/* Interactive Filter & Listing */}
        <HallFilterView
          initialHalls={halls}
          availableAmenities={amenities}
          availableNeighborhoods={neighborhoods}
        />
      </div>
    </div>
  );
}
