import * as React from 'react';
import Link from 'next/link';
import { Landmark, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config/site-config';
import { CookieSettingsButton } from '@/components/compliance/cookie-consent-banner';

export function CivicFooter() {
  return (
    <footer className="border-t border-[#E5DFD5] bg-[#F5F2EB] text-[#1C1917] mt-auto">
      <div className="civic-container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#1A3B2B] text-white flex items-center justify-center">
                <Landmark className="h-4 w-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-[#1C1917]">
                {SITE_CONFIG.portalName}
              </span>
            </div>
            <p className="text-xs text-[#615B52] leading-relaxed">
              A transparent, equitable reservation platform for municipal community halls,
              assembly centers, and neighborhood gathering spaces.
            </p>
            <div className="pt-2 text-[11px] text-[#8A8275]">
              {SITE_CONFIG.bylawReference}
            </div>
          </div>

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
                <Link href="/request" className="hover:text-[#1A3B2B] transition-colors">
                  Submit a Booking Request
                </Link>
              </li>
              <li>
                <Link href="/my-requests" className="hover:text-[#1A3B2B] transition-colors">
                  My Bookings &amp; Account
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-[#1A3B2B] transition-colors">
                  Track Request Status
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-[#1A3B2B] transition-colors">
                  How Booking Requests Are Reviewed
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917] mb-4">
              Booking Policy Notice
            </h4>
            <div className="text-xs text-[#615B52] space-y-2 leading-relaxed">
              <p>
                <strong>Request Queue:</strong> Submitted booking requests undergo verification by
                facility administrators. Submitting a request does not guarantee reservation.
              </p>
              <p>
                <strong>Availability:</strong> Dates are blocked only when officially approved or
                designated for scheduled maintenance.
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917] mb-4">
              {SITE_CONFIG.divisionName}
            </h4>
            <div className="space-y-2.5 text-xs text-[#615B52]">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#C85A32] shrink-0 mt-0.5" />
                <span>{SITE_CONFIG.supportOffice}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#1A3B2B] shrink-0" />
                <span>{SITE_CONFIG.supportHours}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#1A3B2B] shrink-0" />
                <span>{SITE_CONFIG.supportPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#1A3B2B] shrink-0" />
                <span>{SITE_CONFIG.supportEmail}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E5DFD5] bg-[#EAE4DB] py-4 text-xs text-[#615B52]">
        <div className="civic-container flex flex-col lg:flex-row items-center justify-between gap-3 text-center lg:text-left">
          <p>© 2026 {SITE_CONFIG.divisionName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px]">
            <Link href="/legal" className="hover:text-[#1A3B2B] transition-colors font-semibold">
              Compliance Center (01–15)
            </Link>
            <Link href="/legal/privacy-policy" className="hover:text-[#1A3B2B] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="hover:text-[#1A3B2B] transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/legal/gdpr" className="hover:text-[#1A3B2B] transition-colors">
              GDPR
            </Link>
            <Link href="/legal/payment-terms" className="hover:text-[#1A3B2B] transition-colors">
              Payment Terms
            </Link>
            <Link href="/legal/open-source-licences" className="hover:text-[#1A3B2B] transition-colors">
              Open-Source Licences
            </Link>
            <Link href="/privacy-center" className="hover:text-[#1A3B2B] transition-colors">
              Privacy Center
            </Link>
            <CookieSettingsButton />
            <Link href="/admin" className="hover:text-[#1A3B2B] transition-colors">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
