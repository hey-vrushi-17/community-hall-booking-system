'use client';

import * as React from 'react';
import { Search, Filter, RotateCcw, Building2, Check, Users } from 'lucide-react';
import { Hall } from '@/types';
import { HallCard } from './hall-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface HallFilterViewProps {
  initialHalls: Hall[];
  availableAmenities: string[];
  availableNeighborhoods: string[];
}

export function HallFilterView({
  initialHalls,
  availableAmenities,
  availableNeighborhoods,
}: HallFilterViewProps) {
  const [search, setSearch] = React.useState('');
  const [capacityRange, setCapacityRange] = React.useState<string>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = React.useState<string>('all');
  const [selectedAmenities, setSelectedAmenities] = React.useState<string[]>([]);

  // Capacity filtering helper
  const matchesCapacity = (hallCapacity: number, range: string) => {
    switch (range) {
      case 'small':
        return hallCapacity <= 70;
      case 'medium':
        return hallCapacity > 70 && hallCapacity <= 180;
      case 'large':
        return hallCapacity > 180;
      default:
        return true;
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const resetFilters = () => {
    setSearch('');
    setCapacityRange('all');
    setSelectedNeighborhood('all');
    setSelectedAmenities([]);
  };

  const filteredHalls = React.useMemo(() => {
    return initialHalls.filter((hall) => {
      // 1. Text search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = hall.name.toLowerCase().includes(q);
        const matchesDesc = hall.description.toLowerCase().includes(q);
        const matchesLoc = hall.location.toLowerCase().includes(q);
        const matchesNeigh = hall.neighborhood.toLowerCase().includes(q);
        const matchesAmenity = hall.amenities.some((a) => a.toLowerCase().includes(q));

        if (!matchesName && !matchesDesc && !matchesLoc && !matchesNeigh && !matchesAmenity) {
          return false;
        }
      }

      // 2. Capacity range
      if (!matchesCapacity(hall.capacity, capacityRange)) {
        return false;
      }

      // 3. Neighborhood
      if (selectedNeighborhood !== 'all' && hall.neighborhood !== selectedNeighborhood) {
        return false;
      }

      // 4. Amenities
      if (selectedAmenities.length > 0) {
        const hasAllAmenities = selectedAmenities.every((selAmenity) =>
          hall.amenities.some((a) => a.toLowerCase().includes(selAmenity.toLowerCase()))
        );
        if (!hasAllAmenities) {
          return false;
        }
      }

      return true;
    });
  }, [initialHalls, search, capacityRange, selectedNeighborhood, selectedAmenities]);

  const hasActiveFilters =
    search.trim() !== '' ||
    capacityRange !== 'all' ||
    selectedNeighborhood !== 'all' ||
    selectedAmenities.length > 0;

  // Selected top 8 key amenities for filter chips
  const keyAmenities = [
    'Commercial Kitchen',
    'Stage',
    'Wheelchair Accessible',
    'Sound System',
    'Projector',
    'Parking',
    'Wi-Fi',
    'Terrace',
  ];

  return (
    <div className="space-y-8">
      {/* Search & Filter Control Panel */}
      <div className="civic-card p-5 bg-white border border-[#E5DFD5]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Main Keyword Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#8A8275] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by hall name, feature, or district..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-[#E5DFD5] bg-[#FBF9F5] placeholder:text-[#8A8275] focus:ring-1 focus:ring-[#1A3B2B] focus:border-[#1A3B2B]"
            />
          </div>

          {/* Capacity Dropdown */}
          <div className="md:col-span-3">
            <select
              value={capacityRange}
              onChange={(e) => setCapacityRange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B] focus:border-[#1A3B2B]"
              aria-label="Filter by guest capacity"
            >
              <option value="all">Any Guest Capacity</option>
              <option value="small">Small (Up to 70 guests)</option>
              <option value="medium">Medium (70 – 180 guests)</option>
              <option value="large">Large (180+ guests)</option>
            </select>
          </div>

          {/* Neighborhood Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B] focus:border-[#1A3B2B]"
              aria-label="Filter by neighborhood"
            >
              <option value="all">All Neighborhoods & Sectors</option>
              {availableNeighborhoods.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Action */}
          <div className="md:col-span-1 flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              title="Reset all filters"
              aria-label="Reset all filters"
              className="p-2 text-[#615B52] hover:text-[#1C1917] hover:bg-[#F3EFE8] disabled:opacity-30 disabled:pointer-events-none rounded-md transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Amenity Filter Chips */}
        <div className="mt-4 pt-3.5 border-t border-[#E5DFD5]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-semibold text-[#8A8275] uppercase tracking-wider shrink-0">
              Filter by Amenities:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {keyAmenities.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      isSelected
                        ? 'bg-[#1A3B2B] text-white border-[#1A3B2B] font-medium'
                        : 'bg-[#FBF9F5] text-[#615B52] border-[#E5DFD5] hover:border-[#CDC5B7] hover:text-[#1C1917]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 mr-1" />}
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#615B52] px-1">
        <span>
          Showing <strong className="text-[#1C1917]">{filteredHalls.length}</strong> of{' '}
          <strong>{initialHalls.length}</strong> municipal community facilities
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-[#C85A32] hover:text-[#AF4924] font-semibold underline decoration-dotted"
          >
            Clear active filters
          </button>
        )}
      </div>

      {/* Hall Grid */}
      {filteredHalls.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHalls.map((hall) => (
            <HallCard key={hall.id} hall={hall} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="civic-card p-12 text-center bg-white border border-[#E5DFD5]">
          <div className="w-12 h-12 rounded-full bg-[#F3EFE8] text-[#8A8275] flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1C1917] mb-1">
            No Community Halls Match Your Filter Criteria
          </h3>
          <p className="text-xs text-[#615B52] max-w-sm mx-auto mb-6 leading-relaxed">
            Try adjusting your guest capacity, removing specific amenity requirements, or broadening your district search.
          </p>
          <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
            Reset Filters & View All Halls
          </Button>
        </div>
      )}
    </div>
  );
}
