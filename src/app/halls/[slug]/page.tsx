import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { Suspense } from 'react';
import { DatabaseSetupError, getHallBySlug } from '@/lib/services/hall-service';
import { HallDetailsInteractive } from '@/components/halls/hall-details-interactive';
import { DataSourceIndicator } from '@/components/ui/datasource-indicator';
import { SITE_CONFIG } from '@/lib/config/site-config';
import { rethrowNextControlFlowError } from '@/lib/supabase/config';

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const hall = await getHallBySlug(slug);
    if (!hall) {
      return { title: 'Hall Not Found | CivicSpaces' };
    }
    return {
      title: `${hall.name} | CivicSpaces Community Hall Booking`,
      description: hall.description.slice(0, 160),
    };
  } catch {
    return { title: 'Community Hall | CivicSpaces' };
  }
}

async function HallDetailContent({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { date } = await searchParams;

  let hall = null;
  let dbError: string | null = null;
  try {
    hall = await getHallBySlug(slug);
  } catch (err: unknown) {
    rethrowNextControlFlowError(err);
    if (err instanceof DatabaseSetupError) {
      dbError = err.message;
    } else {
      dbError = 'Unable to retrieve community hall details from the database.';
    }
  }

  if (dbError) {
    return (
      <div className="py-12">
        <div className="civic-container space-y-6">
          <DataSourceIndicator />
          <div className="civic-card p-10 bg-white border border-[#FECDCA] text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-[#B42318] mx-auto" />
            <h1 className="text-xl font-bold text-[#1C1917]">Database Availability Unavailable</h1>
            <p className="text-xs text-[#615B52] max-w-lg mx-auto leading-relaxed">{dbError}</p>
            <Link href="/halls" className="inline-block text-xs font-semibold text-[#1A3B2B] hover:underline pt-2">
              ← Return to Halls Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!hall) {
    notFound();
  }

  const primaryImage = hall.images[0] || {
    url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
    alt: hall.name,
    credit: 'Civic Venues',
  };

  return (
    <div className="py-8 md:py-12">
      <div className="civic-container space-y-8">
        <DataSourceIndicator />

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#615B52]">
          <Link href="/" className="hover:text-[#1A3B2B] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8A8275]" />
          <Link href="/halls" className="hover:text-[#1A3B2B] transition-colors">
            Community Halls
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#8A8275]" />
          <span className="font-semibold text-[#1C1917] truncate">{hall.name}</span>
        </nav>

        <div className="border-b border-[#E5DFD5] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF3EE] text-[#1A3B2B]">
                {hall.location}
              </span>
              <span className="text-xs text-[#8A8275]">•</span>
              <span className="text-xs text-[#615B52]">{hall.address}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1C1917] tracking-tight">
              {hall.name}
            </h1>
            <p className="text-sm text-[#615B52] max-w-2xl">{hall.tagline}</p>
          </div>

          <div className="flex items-center gap-4 bg-white p-3.5 rounded-lg border border-[#E5DFD5] self-start md:self-auto shrink-0">
            <div>
              <span className="block text-[11px] text-[#8A8275] uppercase font-semibold">Public Rate</span>
              <span className="text-xl font-bold text-[#1C1917]">₹{hall.hourlyRate}</span>
              <span className="text-xs text-[#615B52]"> / hour</span>
            </div>
            <div className="h-8 w-px bg-[#E5DFD5]" />
            <div>
              <span className="block text-[11px] text-[#8A8275] uppercase font-semibold">Max Guests</span>
              <span className="text-xl font-bold text-[#1A3B2B]">{hall.capacity}</span>
              <span className="text-xs text-[#615B52]"> people</span>
            </div>
          </div>
        </div>

        <div className="relative aspect-16/9 md:aspect-21/9 w-full rounded-lg overflow-hidden border border-[#E5DFD5] bg-[#EAE4DB]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primaryImage.url}
            alt={primaryImage.alt || hall.name}
            className="w-full h-full object-cover"
          />
          {primaryImage.credit && (
            <div className="absolute bottom-2 right-2 text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
              Photo: {primaryImage.credit}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="civic-card p-4 bg-white text-center">
            <Users className="w-5 h-5 text-[#1A3B2B] mx-auto mb-1.5" />
            <span className="block text-[11px] text-[#8A8275] uppercase font-medium">Capacity</span>
            <span className="text-sm font-bold text-[#1C1917]">{hall.capacity} Occupants</span>
          </div>
          <div className="civic-card p-4 bg-white text-center">
            <Clock className="w-5 h-5 text-[#1A3B2B] mx-auto mb-1.5" />
            <span className="block text-[11px] text-[#8A8275] uppercase font-medium">Daily Hours</span>
            <span className="text-sm font-bold text-[#1C1917]">
              {hall.operatingHours.open} – {hall.operatingHours.close}
            </span>
          </div>
          <div className="civic-card p-4 bg-white text-center">
            <MapPin className="w-5 h-5 text-[#C85A32] mx-auto mb-1.5" />
            <span className="block text-[11px] text-[#8A8275] uppercase font-medium">City / District</span>
            <span className="text-sm font-bold text-[#1C1917]">{hall.neighborhood}</span>
          </div>
          <div className="civic-card p-4 bg-white text-center">
            <ShieldCheck className="w-5 h-5 text-[#1A3B2B] mx-auto mb-1.5" />
            <span className="block text-[11px] text-[#8A8275] uppercase font-medium">Civic Status</span>
            <span className="text-sm font-bold text-[#1A3B2B]">
              {hall.isActive ? 'Active Public Facility' : 'Archived'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-4">
              <h2 className="text-lg font-bold text-[#1C1917] tracking-tight">
                About {hall.name}
              </h2>
              <p className="text-sm text-[#4D4841] leading-relaxed">{hall.description}</p>
            </section>

            <section className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-4">
              <h2 className="text-lg font-bold text-[#1C1917] tracking-tight">
                Facility Amenities &amp; Equipment
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {hall.amenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-md bg-[#FBF9F5] border border-[#E5DFD5] text-xs text-[#1C1917]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#1A3B2B] shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-4">
              <h2 className="text-lg font-bold text-[#1C1917] tracking-tight flex items-center gap-2">
                <Info className="w-5 h-5 text-[#C85A32]" />
                Facility Usage Guidelines &amp; Municipal Policies
              </h2>
              <ul className="space-y-2 text-xs text-[#615B52] list-disc list-inside leading-relaxed">
                {hall.rulesAndPolicies.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </section>
          </div>

          <div className="space-y-6">
            <div className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-4">
              <h3 className="text-base font-bold text-[#1C1917]">Facility Location &amp; Access</h3>
              <div className="space-y-2.5 text-xs text-[#615B52]">
                <p>
                  <strong>Physical Address:</strong>
                  <br />
                  {hall.address}
                </p>
                <p>
                  <strong>Accessible Access:</strong>
                  <br />
                  Step-free entry, ramps, and accessible seating/restrooms where available.
                </p>
                <p>
                  <strong>Operating Days:</strong>
                  <br />
                  {hall.operatingHours.days}
                </p>
              </div>
            </div>

            <div className="civic-card p-6 bg-[#F5F2EB] border border-[#E5DFD5] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                Facilities Desk Contact
              </h3>
              <p className="text-xs text-[#615B52] leading-relaxed">
                Have specific room configuration needs or seeking a community fee waiver?
              </p>
              <div className="text-xs font-medium text-[#1C1917] space-y-1">
                <div>Phone: {SITE_CONFIG.supportPhone}</div>
                <div>Email: {SITE_CONFIG.supportEmail}</div>
                <div>Hours: {SITE_CONFIG.supportHours}</div>
              </div>
            </div>
          </div>
        </div>

        <section id="availability-section" className="pt-4 border-t border-[#E5DFD5]">
          <Suspense fallback={<div className="py-12 text-center text-sm text-[#615B52]">Loading availability schedule...</div>}>
            <HallDetailsInteractive hall={hall} initialDateParam={date} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

export default function HallDetailPage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<div className="py-16 text-center text-xs text-[#615B52]">Loading facility details...</div>}>
      <HallDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
