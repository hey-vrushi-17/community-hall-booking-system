import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, FileCheck2, Lock, Scale } from 'lucide-react';
import {
  COMPLIANCE_CONTACTS,
  COMPLIANCE_VERSIONS,
  LEGAL_DOCUMENTS,
} from '@/lib/config/compliance-config';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Legal, Privacy & Compliance Center | CivicSpaces',
  description:
    'Access all 15 CivicSpaces privacy, GDPR, cookie consent, data retention, security, breach response, open-source licence, and payment terms documents.',
};

export default function LegalCenterPage() {
  const categories: Array<'Privacy & Data Rights' | 'Governance & Security' | 'Legal & Commercial'> = [
    'Privacy & Data Rights',
    'Governance & Security',
    'Legal & Commercial',
  ];

  return (
    <div className="py-10 md:py-14">
      <div className="civic-container space-y-10">
        {/* Header */}
        <div className="bg-[#1A3B2B] text-white rounded-xl p-8 sm:p-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>
              CivicSpaces Trust &amp; Compliance Hub • Policy Suite v{COMPLIANCE_VERSIONS.privacyPolicy}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
            Legal, Privacy &amp; Data Governance Center
          </h1>
          <p className="text-sm text-[#D4E3D9] max-w-3xl leading-relaxed">
            Transparent municipal governance covering privacy, GDPR rights, cookie consent, lawful
            processing bases, marketing preferences, data deletion, retention schedules, DPAs,
            third-party disclosures, security controls, breach procedures, IP, open-source licences,
            and payment &amp; subscription terms.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href="/privacy-center">
              <Button variant="accent" size="md" className="text-xs gap-1.5 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                Open Interactive Privacy &amp; Data Rights Center
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/admin/compliance">
              <Button
                variant="outline"
                size="md"
                className="text-xs text-white border-white/30 hover:bg-white/10 gap-1.5"
              >
                <Scale className="w-3.5 h-3.5" />
                Staff Governance &amp; Breach Console
              </Button>
            </Link>
          </div>
        </div>

        {/* Categorized 15-Item Grid */}
        {categories.map((category) => {
          const docs = LEGAL_DOCUMENTS.filter((d) => d.category === category);
          return (
            <section key={category} className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-2">
                <h2 className="text-lg font-bold text-[#1C1917] flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#1A3B2B]" />
                  {category}
                </h2>
                <span className="text-xs text-[#8A8275]">{docs.length} documents</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((doc) => (
                  <Link
                    key={doc.slug}
                    href={`/legal/${doc.slug}`}
                    className="civic-card civic-card-hover p-5 bg-white border border-[#E5DFD5] flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#EBF3EE] text-[#1A3B2B]">
                          {doc.number}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#8A8275]" />
                      </div>
                      <h3 className="text-base font-bold text-[#1C1917]">{doc.title}</h3>
                      <p className="text-xs text-[#615B52] leading-relaxed">{doc.summary}</p>
                    </div>

                    <div className="pt-2 border-t border-[#E5DFD5] flex items-center justify-between text-[11px] font-semibold text-[#1A3B2B]">
                      <span>Read Policy &amp; Controls</span>
                      {doc.interactiveLabel && (
                        <span className="text-[#C85A32]">{doc.interactiveLabel}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* DPO Footer Note */}
        <div className="p-5 rounded-lg bg-[#F5F2EB] border border-[#E5DFD5] text-xs text-[#615B52] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <strong className="text-[#1C1917]">Data Protection Officer (DPO):</strong>{' '}
            {COMPLIANCE_CONTACTS.dataController} •{' '}
            <span className="font-mono">{COMPLIANCE_CONTACTS.dpoEmail}</span>
          </div>
          <div>
            Last reviewed: <strong>{COMPLIANCE_VERSIONS.lastReviewedDate}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
