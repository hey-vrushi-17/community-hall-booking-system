import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { PrivacyCenterClient } from '@/components/compliance/privacy-center-client';

export const metadata: Metadata = {
  title: 'Privacy & Data Rights Center | CivicSpaces',
  description:
    'Exercise your GDPR rights: manage cookie consent, toggle marketing preferences, export your personal data in JSON, or request data deletion.',
};

export default function PrivacyCenterPage() {
  return (
    <div className="py-10 md:py-14">
      <div className="civic-container max-w-4xl space-y-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#615B52]">
          <Link href="/" className="hover:text-[#1A3B2B] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/legal" className="hover:text-[#1A3B2B] transition-colors">
            Legal &amp; Compliance
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#1C1917]">Privacy &amp; Data Rights Center</span>
        </nav>

        <div className="space-y-2 border-b border-[#E5DFD5] pb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EBF3EE] text-[#1A3B2B] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GDPR Articles 7, 15, 17 &amp; 20 Self-Service Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
            Privacy &amp; Data Rights Center
          </h1>
          <p className="text-sm text-[#615B52]">
            Manage cookie preferences, export your personal booking &amp; consent records, update
            marketing opt-in status, or submit a data erasure request.
          </p>
        </div>

        <PrivacyCenterClient />
      </div>
    </div>
  );
}
