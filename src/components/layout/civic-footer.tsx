import * as React from 'react';
import Link from 'next/link';
import { Landmark, Mail, Phone, MapPin, Clock, ExternalLink } from 'lucide-react';

export function CivicFooter() {
  return (
    <footer className="border-t border-[#E5DFD5] bg-[#F5F2EB] text-[#1C1917] mt-auto">
      {/* Top Section */}
      <div className="civic-container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Organization */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#1A3B2B] text-white flex items-center justify-center">
                <Landmark className="h-4 w-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-[#1C1917]">
                CivicSpaces
              </span>
            </div>
            <p className="text-xs text-[#615B52] leading-relaxed">
              A transparent, equitable reservation platform for municipal community halls,
              assembly centers, and neighborhood gathering spaces.
            </p>
            <div className="pt-2 text-[11px] text-[#8A8275]">
              Operating under Municipal Civic Venue Bylaw No. 410-B.
            </div>
          </div>

          {/* Column 2: Public Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917] mb-4">
              Community Services
            </h4>
            <ul className="space-y-2.5 text-xs text-[#615B52]">
              <li>
                <Link href="/halls" className="hover:text-[#1A3B2B] transition-colors">
                  Browse All Community Halls
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-[#1A3B2B] transition-colors">
                  How Booking Requests Are Reviewed
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-[#1A3B2B] transition-colors">
                  Track Submitted Request Status
                </Link>
              </li>
              <li>
                <Link href="/#policies" className="hover:text-[#1A3B2B] transition-colors">
                  Rental Policies & Community Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Review & Availability Transparency */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917] mb-4">
              Booking Policy Notice
            </h4>
            <div className="text-xs text-[#615B52] space-y-2 leading-relaxed">
              <p>
                <strong>Request Queue:</strong> Submitted booking requests undergo verification by
                municipal facility administrators. Submitting a form does not guarantee reservation.
              </p>
              <p>
                <strong>Availability:</strong> Dates are blocked only when officially approved or
                designated for scheduled maintenance.
              </p>
            </div>
          </div>

          {/* Column 4: Contact & Facilities Desk */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917] mb-4">
              Facilities Division
            </h4>
            <div className="space-y-2.5 text-xs text-[#615B52]">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#C85A32] shrink-0 mt-0.5" />
                <span>Civic Facilities Office, Civic Plaza Sector 4</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#1A3B2B] shrink-0" />
                <span>Mon–Fri: 8:30 AM – 4:30 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#1A3B2B] shrink-0" />
                <span>(555) 019-4820 (Facilities Inquiries)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#1A3B2B] shrink-0" />
                <span>facilities-desk@civic.example</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#E5DFD5] bg-[#EAE4DB] py-4 text-xs text-[#615B52]">
        <div className="civic-container flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© 2026 Municipal Facilities Department. All rights reserved.</p>
          <div className="flex items-center gap-6 text-[11px]">
            <span>Accessibility (WCAG 2.1 AA)</span>
            <span>Privacy & Public Records</span>
            <span>Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
