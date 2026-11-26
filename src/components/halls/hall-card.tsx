import * as React from 'react';
import Link from 'next/link';
import { Users, MapPin, CheckCircle, ArrowRight, Clock, CalendarCheck } from 'lucide-react';
import { Hall } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface HallCardProps {
  hall: Hall;
  dateContext?: {
    date: string;
    availableHours: number;
  };
}

export function HallCard({ hall, dateContext }: HallCardProps) {
  const primaryImage = hall.images[0] || {
    url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
    alt: hall.name,
  };

  return (
    <article className="civic-card civic-card-hover flex flex-col h-full overflow-hidden group">
      <div className="relative aspect-16/10 w-full overflow-hidden bg-[#EAE4DB]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryImage.url}
          alt={primaryImage.alt || hall.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge variant="default" className="bg-white/95 text-[#1C1917] backdrop-blur-xs font-semibold shadow-xs">
            <Users className="w-3 h-3 mr-1 text-[#1A3B2B]" />
            Cap. {hall.capacity}
          </Badge>
          {hall.featured && (
            <Badge variant="success" className="shadow-xs font-medium">
              Featured Hall
            </Badge>
          )}
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="bg-[#18283E]/90 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-xs font-semibold shadow-xs">
            ₹{hall.hourlyRate}/hr
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 text-xs text-[#615B52] mb-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#C85A32] shrink-0" />
          <span>{hall.location}</span>
          <span>•</span>
          <span>{hall.neighborhood}</span>
        </div>

        <h3 className="text-lg font-bold text-[#1C1917] tracking-tight group-hover:text-[#1A3B2B] transition-colors mb-2">
          <Link href={`/halls/${hall.slug}`} className="focus:outline-none">
            {hall.name}
          </Link>
        </h3>

        <p className="text-xs text-[#615B52] line-clamp-2 leading-relaxed mb-4 flex-1">
          {hall.tagline || hall.description}
        </p>

        {dateContext && (
          <div className="mb-3 px-2.5 py-1.5 rounded bg-[#EBF3EE] border border-[#CDE3D5] text-[11px] font-medium text-[#1A3B2B] flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
            <span>
              {dateContext.availableHours} open hrs on {dateContext.date}
            </span>
          </div>
        )}

        <div className="border-t border-[#E5DFD5] pt-3.5 mb-4">
          <div className="text-[11px] font-semibold text-[#8A8275] uppercase tracking-wider mb-2">
            Key Amenities
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hall.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-[#F3EFE8] text-[#4D4841]"
              >
                <CheckCircle className="w-2.5 h-2.5 mr-1 text-[#1A3B2B]" />
                {amenity}
              </span>
            ))}
            {hall.amenities.length > 3 && (
              <span className="text-[11px] text-[#8A8275] self-center pl-1">
                +{hall.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-[#E5DFD5]">
          <div className="flex items-center text-xs text-[#615B52]">
            <Clock className="w-3.5 h-3.5 mr-1 text-[#8A8275]" />
            <span>{hall.operatingHours.open} – {hall.operatingHours.close}</span>
          </div>

          <Link href={dateContext ? `/halls/${hall.slug}?date=${dateContext.date}` : `/halls/${hall.slug}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs group-hover:bg-[#1A3B2B] group-hover:text-white group-hover:border-[#1A3B2B] transition-colors">
              <span>View Details</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
