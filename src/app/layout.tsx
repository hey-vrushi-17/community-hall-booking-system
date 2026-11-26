import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { CivicHeader } from '@/components/layout/civic-header';
import { CivicFooter } from '@/components/layout/civic-footer';
import { CookieConsentBanner } from '@/components/compliance/cookie-consent-banner';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'CivicSpaces | Municipal Community Hall Booking & Management',
  description:
    'Browse municipal community halls, check real-time schedule availability, and submit booking requests for civic and community events.',
  keywords: [
    'community hall booking',
    'civic venue rental',
    'municipal event spaces',
    'neighborhood meeting halls',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-type="place" className={cn("font-sans", geist.variable)}>
      <head>
        <meta name="page-type" content="place" />
        <meta name="site-kind" content="other" />
        <meta name="page-kind" content="place" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917] selection:bg-[#EBF3EE] selection:text-[#1A3B2B]">
        <Suspense>
          <CivicHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <CivicFooter />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
