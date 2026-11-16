import Link from 'next/link';
import {
  Landmark,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
  Clock,
  CheckCircle2,
  Users,
  MapPin,
  HelpCircle,
  Phone,
  Mail,
  FileCheck2,
} from 'lucide-react';
import { getAllHalls } from '@/lib/services/hall-service';
import { HallCard } from '@/components/halls/hall-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function HomePage() {
  const allHalls = await getAllHalls();
  const featuredHalls = allHalls.filter((h) => h.featured).slice(0, 3);

  return (
    <div className="space-y-16 md:space-y-24 py-8 md:py-14">
      {/* 1. Hero Section */}
      <section className="civic-container">
        <div className="bg-[#1A3B2B] text-white rounded-xl p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-sm">
          {/* Subtle architectural watermark motif */}
          <div className="absolute right-[-40px] bottom-[-40px] opacity-10 pointer-events-none select-none text-white">
            <Landmark className="w-96 h-96" />
          </div>

          <div className="max-w-2xl relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#F5F2EB] text-xs font-medium border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Municipal Facilities Division • Public Booking Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Community Venues for Gatherings, Meetings & Celebrations
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
              <Link href="/track">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-sm text-white border-white/30 hover:bg-white/10 active:bg-white/20"
                >
                  Track Existing Request
                </Button>
              </Link>
            </div>
          </div>

          {/* Civic Trust Stat Strip */}
          <div className="mt-12 pt-8 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
            <div>
              <span className="block text-2xl font-bold text-white">6 Venues</span>
              <span className="text-xs text-[#D4E3D9]">Across Municipal Districts</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white">40 – 350</span>
              <span className="text-xs text-[#D4E3D9]">Guest Occupancy Capacities</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white">100% ADA</span>
              <span className="text-xs text-[#D4E3D9]">Step-Free Accessible Entries</span>
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
              Popular Community Facilities
            </h2>
          </div>
          <Link href="/halls">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <span>View All 6 Halls</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredHalls.map((hall) => (
            <HallCard key={hall.id} hall={hall} />
          ))}
        </div>
      </section>

      {/* 3. How Booking Requests Are Reviewed (4 Concise Steps) */}
      <section id="how-it-works" className="bg-[#F5F2EB] border-y border-[#E5DFD5] py-16">
        <div className="civic-container space-y-12">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1A3B2B]">
              Transparency & Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              How a Booking Request Is Reviewed
            </h2>
            <p className="text-sm text-[#615B52] leading-relaxed">
              We uphold an equitable, transparent reservation process for all civic residents and
              organizations. Here is what happens from submission to venue keyhandover:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="civic-card p-6 bg-white border border-[#E5DFD5] relative flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-full bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center font-bold text-sm mb-4">
                  1
                </div>
                <h3 className="text-base font-bold text-[#1C1917] mb-2">
                  Browse & Select
                </h3>
                <p className="text-xs text-[#615B52] leading-relaxed">
                  Browse neighborhood halls, examine capacity restrictions, and inspect included
                  amenities such as commercial kitchens, stage sound, or projectors.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5DFD5] text-[11px] text-[#8A8275]">
                Check room layouts & transit access
              </div>
            </div>

            {/* Step 2 */}
            <div className="civic-card p-6 bg-white border border-[#E5DFD5] relative flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-full bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center font-bold text-sm mb-4">
                  2
                </div>
                <h3 className="text-base font-bold text-[#1C1917] mb-2">
                  Check Schedule & Submit
                </h3>
                <p className="text-xs text-[#615B52] leading-relaxed">
                  Verify date availability against existing approved bookings and maintenance
                  closures. Submit your event specifications and preferred time window.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5DFD5] text-[11px] text-[#8A8275]">
                Generates a tracking reference code
              </div>
            </div>

            {/* Step 3 */}
            <div className="civic-card p-6 bg-white border border-[#E5DFD5] relative flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-full bg-[#FEF6EE] text-[#C85A32] flex items-center justify-center font-bold text-sm mb-4">
                  3
                </div>
                <h3 className="text-base font-bold text-[#1C1917] mb-2">
                  Administrative Review
                </h3>
                <p className="text-xs text-[#615B52] leading-relaxed">
                  Facility coordinators verify insurance, ensure compliance with quiet hours, and
                  prevent any overlapping approval requests through strict server concurrency checks.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5DFD5] text-[11px] text-[#8A8275]">
                Reviewed within 2 business days
              </div>
            </div>

            {/* Step 4 */}
            <div className="civic-card p-6 bg-white border border-[#E5DFD5] relative flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-full bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center font-bold text-sm mb-4">
                  4
                </div>
                <h3 className="text-base font-bold text-[#1C1917] mb-2">
                  Approval & Confirmation
                </h3>
                <p className="text-xs text-[#615B52] leading-relaxed">
                  Upon approval, your date is locked on the municipal calendar. You receive an
                  official permit slip, invoice details, and access instructions.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5DFD5] text-[11px] text-[#8A8275]">
                Confirmed slot blocks future requests
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
            <h3 className="text-base font-bold text-[#1C1917]">
              Municipal Quiet Hours
            </h3>
            <p className="text-xs text-[#615B52] leading-relaxed">
              All community halls observe municipal evening curfews. Events must conclude music by
              10:00 PM and vacate the property by 11:00 PM to respect nearby neighborhoods.
            </p>
          </div>

          <div className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-3">
            <div className="w-8 h-8 rounded-md bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#1C1917]">
              Cleaning & Waste Protocols
            </h3>
            <p className="text-xs text-[#615B52] leading-relaxed">
              Venues are supplied clean and must be returned in the same condition. Standard kitchen
              checklists and mandatory recycling sorting apply to all rentals.
            </p>
          </div>

          <div className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-3">
            <div className="w-8 h-8 rounded-md bg-[#EDF3FA] text-[#18283E] flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#1C1917]">
              Non-Profit & Civic Discounts
            </h3>
            <p className="text-xs text-[#615B52] leading-relaxed">
              Registered community charities and recognized neighborhood groups can request fee
              subsidies through the municipal facilities coordinator during review.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Contact & Support Help Desk (Non-fabricated Placeholders) */}
      <section className="civic-container">
        <div className="civic-card p-8 sm:p-10 bg-[#F5F2EB] border border-[#E5DFD5]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C85A32]">
                Need Assistance?
              </span>
              <h2 className="text-2xl font-bold text-[#1C1917] tracking-tight">
                Facilities Division Support Desk
              </h2>
              <p className="text-xs sm:text-sm text-[#615B52] leading-relaxed">
                Our municipal venue coordinators are available to answer questions regarding hall
                specifications, insurance requirements, and community booking policies.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[#E5DFD5] space-y-3 text-xs text-[#1C1917]">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#C85A32] shrink-0" />
                <span>
                  <strong>Office:</strong> Civic Facilities Division, Sector 4, Civic Center Plaza
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#1A3B2B] shrink-0" />
                <span>
                  <strong>Phone:</strong> (555) 019-4820 (Inquiries & Dispatch)
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#1A3B2B] shrink-0" />
                <span>
                  <strong>Email:</strong> facilities-desk@civic.example
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#1A3B2B] shrink-0" />
                <span>
                  <strong>Hours:</strong> Monday – Friday, 8:30 AM – 4:30 PM (Closed Public Holidays)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
