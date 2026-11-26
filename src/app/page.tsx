import Link from 'next/link';
import {
  Landmark,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';
import { getAllHallsSafe } from '@/lib/services/hall-service';
import { HallCard } from '@/components/halls/hall-card';
import { Button } from '@/components/ui/button';
import { DataSourceIndicator } from '@/components/ui/datasource-indicator';
import { SITE_CONFIG } from '@/lib/config/site-config';

export const instant = false;

export default async function HomePage() {
  const { halls: allHalls, dbError } = await getAllHallsSafe();
  const featuredHalls = allHalls.filter((h) => h.featured).slice(0, 3);
  const capacities = allHalls.map((h) => h.capacity);
  const minCapacity = capacities.length > 0 ? Math.min(...capacities) : 0;
  const maxCapacity = capacities.length > 0 ? Math.max(...capacities) : 0;
  const uniqueCities = new Set(allHalls.map((h) => h.neighborhood)).size;

  return (
    <div className="space-y-16 md:space-y-24 py-8 md:py-14">
      <div className="civic-container">
        <DataSourceIndicator />
      </div>

      {/* 1. Hero Section */}
      <section className="civic-container">
        <div className="bg-[#1A3B2B] text-white rounded-xl p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-sm">
          <div className="absolute right-[-40px] bottom-[-40px] opacity-10 pointer-events-none select-none text-white">
            <Landmark className="w-96 h-96" />
          </div>

          <div className="max-w-2xl relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#F5F2EB] text-xs font-medium border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>{SITE_CONFIG.divisionName} • Public Booking Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Community Venues for Gatherings, Meetings &amp; Celebrations
            </h1>

            <p className="text-sm sm:text-base text-[#D4E3D9] leading-relaxed">
              Explore public halls and multipurpose centers across our civic districts.
              Check live schedule availability, view transparent rental policies, and submit
              booking requests directly online.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href="/halls">
                <Button
                  variant="accent"
                  size="lg"
                  className="w-full sm:w-auto gap-2 text-sm font-semibold"
                >
                  <span>Browse Community Halls</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/request">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-sm text-white border-white/30 hover:bg-white/10 active:bg-white/20"
                >
                  Request a Booking
                </Button>
              </Link>
              <Link href="/track">
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto text-sm text-[#D4E3D9] hover:text-white hover:bg-white/10"
                >
                  Track Request
                </Button>
              </Link>
            </div>
          </div>

          {/* Civic Trust Stat Strip */}
          <div className="mt-12 pt-8 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
            <div>
              <span className="block text-2xl font-bold text-white">
                {dbError ? 'Setup Needed' : `${allHalls.length} Venues`}
              </span>
              <span className="text-xs text-[#D4E3D9]">
                {dbError ? 'Apply SQL migrations' : `Across ${uniqueCities} Cities & Districts`}
              </span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white">
                {allHalls.length > 0
                  ? `${minCapacity} – ${maxCapacity.toLocaleString('en-IN')}`
                  : '—'}
              </span>
              <span className="text-xs text-[#D4E3D9]">Guest Occupancy Capacities</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white">Verified Slots</span>
              <span className="text-xs text-[#D4E3D9]">Conflict-Checked Approvals</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white">2 Business Days</span>
              <span className="text-xs text-[#D4E3D9]">Standard Review Turnaround</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Community Halls */}
      <section className="civic-container space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5DFD5] pb-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#C85A32] mb-1">
              Featured Venues
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              Public Community Facilities
            </h2>
          </div>
          <Link href="/halls">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <span>View All {allHalls.length > 0 ? allHalls.length : ''} Halls</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {dbError ? (
          <div className="civic-card p-8 bg-white border border-[#FECDCA] text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-[#B42318] mx-auto" />
            <h3 className="text-base font-bold text-[#1C1917]">
              Database Initialization Required
            </h3>
            <p className="text-xs text-[#615B52] max-w-lg mx-auto leading-relaxed">
              Supabase environment credentials are configured, but the community hall tables are not yet initialized in your database. Run the SQL files in <code className="font-mono bg-[#F3EFE8] px-1 rounded">supabase/migrations/</code> (and optionally <code className="font-mono bg-[#F3EFE8] px-1 rounded">supabase/seed.sql</code> for sample venues) to activate live listings.
            </p>
          </div>
        ) : featuredHalls.length === 0 ? (
          <div className="civic-card p-8 bg-white border border-[#E5DFD5] text-center text-xs text-[#615B52]">
            No featured community halls are currently published. Browse the full directory or sign in as an administrator to add facilities.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredHalls.map((hall) => (
              <HallCard key={hall.id} hall={hall} />
            ))}
          </div>
        )}
      </section>

      {/* 3. How Booking Requests Are Reviewed */}
      <section id="how-it-works" className="bg-[#F5F2EB] border-y border-[#E5DFD5] py-16">
        <div className="civic-container space-y-12">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1A3B2B]">
              Transparency &amp; Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              How a Booking Request Is Reviewed
            </h2>
            <p className="text-sm text-[#615B52] leading-relaxed">
              We uphold an equitable, transparent reservation process for all civic residents and
              organizations. Submitting a request enters the review queue and does not lock a venue until approved:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="civic-card p-6 bg-white border border-[#E5DFD5] flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-full bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center font-bold text-sm mb-4">
                  1
                </div>
                <h3 className="text-base font-bold text-[#1C1917] mb-2">Browse &amp; Select</h3>
                <p className="text-xs text-[#615B52] leading-relaxed">
                  Filter halls by date, capacity, location, and amenities to find a suitable space for your gathering.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5DFD5] text-[11px] text-[#8A8275]">
                Inspect capacity &amp; transit access
              </div>
            </div>

            <div className="civic-card p-6 bg-white border border-[#E5DFD5] flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-full bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center font-bold text-sm mb-4">
                  2
                </div>
                <h3 className="text-base font-bold text-[#1C1917] mb-2">Check Schedule &amp; Submit</h3>
                <p className="text-xs text-[#615B52] leading-relaxed">
                  Verify availability against approved events and maintenance closures, then submit your event request as PENDING.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5DFD5] text-[11px] text-[#8A8275]">
                Generates a tracking reference code
              </div>
            </div>

            <div className="civic-card p-6 bg-white border border-[#E5DFD5] flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-full bg-[#FEF6EE] text-[#C85A32] flex items-center justify-center font-bold text-sm mb-4">
                  3
                </div>
                <h3 className="text-base font-bold text-[#1C1917] mb-2">Administrative Review</h3>
                <p className="text-xs text-[#615B52] leading-relaxed">
                  Facility coordinators verify capacity, rules, and prevent overlapping approvals via database-level locks.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5DFD5] text-[11px] text-[#8A8275]">
                Reviewed within 2 business days
              </div>
            </div>

            <div className="civic-card p-6 bg-white border border-[#E5DFD5] flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-full bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center font-bold text-sm mb-4">
                  4
                </div>
                <h3 className="text-base font-bold text-[#1C1917] mb-2">Approval &amp; Confirmation</h3>
                <p className="text-xs text-[#615B52] leading-relaxed">
                  Once approved, your slot is locked on the public calendar and recorded in your account and tracking page.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5DFD5] text-[11px] text-[#8A8275]">
                Approved slot blocks future requests
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Public Policy & Information */}
      <section id="policies" className="civic-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-3">
            <div className="w-8 h-8 rounded-md bg-[#FAEEE8] text-[#C85A32] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#1C1917]">Municipal Quiet Hours</h3>
            <p className="text-xs text-[#615B52] leading-relaxed">
              Community halls observe evening curfews and operating hours listed per venue. Amplified sound must conclude on schedule to respect nearby neighborhoods.
            </p>
          </div>

          <div className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-3">
            <div className="w-8 h-8 rounded-md bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#1C1917]">Cleaning &amp; Waste Protocols</h3>
            <p className="text-xs text-[#615B52] leading-relaxed">
              Venues are supplied clean and must be restored prior to handover. Waste sorting and zero single-use plastic policies apply where designated.
            </p>
          </div>

          <div className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-3">
            <div className="w-8 h-8 rounded-md bg-[#EDF3FA] text-[#18283E] flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#1C1917]">Non-Profit &amp; Civic Support</h3>
            <p className="text-xs text-[#615B52] leading-relaxed">
              Registered community organizations and neighborhood groups can note civic fee concessions in their booking request for coordinator review.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Configurable Support Help Desk */}
      <section className="civic-container">
        <div className="civic-card p-8 sm:p-10 bg-[#F5F2EB] border border-[#E5DFD5]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C85A32]">
                Need Assistance?
              </span>
              <h2 className="text-2xl font-bold text-[#1C1917] tracking-tight">
                {SITE_CONFIG.divisionName} Help Desk
              </h2>
              <p className="text-xs sm:text-sm text-[#615B52] leading-relaxed">
                Facility coordinators are available to answer questions about hall specifications,
                accessible entry, and community reservation policies. Contact details are configurable per deployment.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[#E5DFD5] space-y-3 text-xs text-[#1C1917]">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#C85A32] shrink-0" />
                <span>
                  <strong>Office:</strong> {SITE_CONFIG.supportOffice}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#1A3B2B] shrink-0" />
                <span>
                  <strong>Phone:</strong> {SITE_CONFIG.supportPhone}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#1A3B2B] shrink-0" />
                <span>
                  <strong>Email:</strong> {SITE_CONFIG.supportEmail}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#1A3B2B] shrink-0" />
                <span>
                  <strong>Hours:</strong> {SITE_CONFIG.supportHours}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
