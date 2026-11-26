'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Printer,
  ArrowRight,
  SlidersHorizontal,
  FileText,
} from 'lucide-react';
import {
  COMPLIANCE_CONTACTS,
  COMPLIANCE_VERSIONS,
  LEGAL_DOCUMENTS,
  LegalDocumentMeta,
} from '@/lib/config/compliance-config';
import { Button } from '@/components/ui/button';
import { dispatchOpenCookieSettings } from './cookie-consent-banner';

interface LegalLayoutProps {
  currentDoc: LegalDocumentMeta;
  children: React.ReactNode;
}

export function LegalLayout({ currentDoc, children }: LegalLayoutProps) {
  return (
    <div className="py-10 md:py-14">
      <div className="civic-container space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[#615B52]">
          <Link href="/" className="hover:text-[#1A3B2B] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/legal" className="hover:text-[#1A3B2B] transition-colors">
            Legal &amp; Compliance Center
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#1C1917]">
            {currentDoc.number} — {currentDoc.title}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Navigation across all 15 compliance documents */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-24 print:hidden">
            <div className="civic-card p-4 bg-white border border-[#E5DFD5] space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
                  Compliance Index (01–15)
                </span>
                <FileText className="w-4 h-4 text-[#1A3B2B]" />
              </div>
              <nav aria-label="Compliance Documents" className="space-y-1 max-h-[65vh] overflow-y-auto pr-1">
                {LEGAL_DOCUMENTS.map((doc) => {
                  const isActive = doc.slug === currentDoc.slug;
                  return (
                    <Link
                      key={doc.slug}
                      href={`/legal/${doc.slug}`}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-colors ${
                        isActive
                          ? 'bg-[#EBF3EE] text-[#1A3B2B] font-semibold'
                          : 'text-[#615B52] hover:text-[#1C1917] hover:bg-[#F3EFE8]'
                      }`}
                    >
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#E5DFD5] text-[#615B52] shrink-0">
                        {doc.number}
                      </span>
                      <span className="truncate">{doc.shortTitle}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-2 border-t border-[#E5DFD5] space-y-2">
                <Link href="/privacy-center" className="block">
                  <Button variant="primary" size="sm" className="w-full justify-between text-xs">
                    <span>Privacy &amp; Data Rights</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={dispatchOpenCookieSettings}
                  className="w-full justify-start gap-1.5 text-xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Cookie Preferences
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Document Body */}
          <article className="lg:col-span-8 xl:col-span-9 space-y-6">
            <header className="civic-card p-6 sm:p-8 bg-white border border-[#E5DFD5] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#EBF3EE] text-[#1A3B2B] text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    Section {currentDoc.number} • {currentDoc.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  {currentDoc.interactivePath && currentDoc.interactiveLabel && (
                    <Link href={currentDoc.interactivePath}>
                      <Button variant="accent" size="sm" className="text-xs gap-1.5">
                        <span>{currentDoc.interactiveLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="text-xs gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </Button>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
                {currentDoc.title}
              </h1>
              <p className="text-sm text-[#615B52] leading-relaxed">{currentDoc.summary}</p>

              <div className="pt-3 border-t border-[#E5DFD5] flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-[#8A8275]">
                <span>
                  <strong>Effective:</strong> {COMPLIANCE_VERSIONS.effectiveDate}
                </span>
                <span>
                  <strong>Version:</strong> v{COMPLIANCE_VERSIONS.privacyPolicy}
                </span>
                <span>
                  <strong>Data Controller:</strong> {COMPLIANCE_CONTACTS.dataController}
                </span>
                <span>
                  <strong>DPO Contact:</strong> {COMPLIANCE_CONTACTS.dpoEmail}
                </span>
              </div>
            </header>

            <div className="civic-card p-6 sm:p-8 bg-white border border-[#E5DFD5] space-y-6 text-sm text-[#4D4841] leading-relaxed">
              {children}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
