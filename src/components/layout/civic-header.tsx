'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Landmark, Menu, X, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CivicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/halls', label: 'Browse Halls' },
    { href: '/#how-it-works', label: 'Review Process' },
    { href: '/track', label: 'Track Request' },
    { href: '/my-requests', label: 'My Requests' },
  ];

  return (
    <header className="border-b border-[#E5DFD5] bg-[#FBF9F5] sticky top-0 z-40">
      {/* Official Civic Banner */}
      <div className="bg-[#18283E] text-white text-xs py-1.5 px-4">
        <div className="civic-container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#C85A32]" />
            <span className="font-medium tracking-wide">
              Official Municipal Facilities Portal — Public Community Venue Reservations
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[11px] text-[#CDC5B7]">
            <Link href="/admin" className="text-white hover:underline font-semibold">
              Staff Portal
            </Link>
            <span>•</span>
            <span>Support: facilities@civic.example</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="civic-container">
        <div className="flex items-center justify-between h-18">
          {/* Brand Identity */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:ring-offset-2"
          >
            <div className="w-10 h-10 rounded-md bg-[#1A3B2B] text-white flex items-center justify-center shadow-xs transition-colors group-hover:bg-[#132B20]">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold text-[#1C1917] tracking-tight block leading-tight">
                CivicSpaces
              </span>
              <span className="text-xs text-[#615B52] block font-normal">
                Community Hall Booking & Management
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href) && !link.href.includes('#');

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'text-[#1A3B2B] bg-[#EBF3EE] font-semibold'
                      : 'text-[#615B52] hover:text-[#1C1917] hover:bg-[#F3EFE8]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Header Action Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/track">
              <Button variant="outline" size="sm" className="text-xs">
                Check Status
              </Button>
            </Link>
            <Link href="/halls">
              <Button variant="primary" size="sm" className="gap-2 text-xs">
                <Search className="h-3.5 w-3.5" />
                Find a Hall
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-[#615B52] hover:text-[#1C1917] hover:bg-[#F3EFE8] focus:outline-none"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5DFD5] bg-[#FBF9F5] px-4 pt-3 pb-5 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[#1C1917] rounded-md hover:bg-[#F3EFE8]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-2 border-t border-[#E5DFD5] flex flex-col gap-2">
            <Link href="/halls" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full justify-center">
                Browse Halls
              </Button>
            </Link>
            <Link href="/track" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                Track Existing Request
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
