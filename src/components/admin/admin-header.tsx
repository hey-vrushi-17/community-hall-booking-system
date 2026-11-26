'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  LayoutDashboard,
  Inbox,
  FileSpreadsheet,
  Calendar,
  LogOut,
  ExternalLink,
  Building,
  Wrench,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminUser } from '@/lib/auth/admin-auth';

interface AdminHeaderProps {
  user: AdminUser;
  pendingCount?: number;
}

export function AdminHeader({ user, pendingCount = 0 }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const navLinks = [
    {
      href: '/admin',
      label: 'Overview',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: '/admin/queue',
      label: 'Request Queue',
      icon: Inbox,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      href: '/admin/halls',
      label: 'Facility Halls',
      icon: Building,
    },
    {
      href: '/admin/maintenance',
      label: 'Maintenance',
      icon: Wrench,
    },
    {
      href: '/admin/calendar',
      label: 'Master Calendar',
      icon: Calendar,
    },
    {
      href: '/admin/records',
      label: 'Booking Records',
      icon: FileSpreadsheet,
    },
    {
      href: '/admin/audit',
      label: 'Audit History',
      icon: History,
    },
  ];

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="border-b border-[#E5DFD5] bg-white sticky top-0 z-30 shadow-xs">
      <div className="bg-[#18283E] text-white text-xs py-1.5 px-4">
        <div className="civic-container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-[#C85A32]" />
            <span className="font-semibold tracking-wide uppercase text-[11px]">
              Municipal Facilities Administration Portal
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#CDC5B7]">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <span>Public Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="civic-container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#1A3B2B] text-white flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1C1917] text-base leading-tight">
                  CivicSpaces Management
                </span>
                <span className="bg-[#EBF3EE] text-[#1A3B2B] border border-[#CDE3D5] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                  {user.role}
                </span>
              </div>
              <span className="text-xs text-[#615B52]">
                Logged in as <strong>{user.email}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-xs gap-1.5 text-[#615B52] hover:text-[#B42318]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
            </Button>
          </div>
        </div>

        <nav className="flex items-center gap-1 border-t border-[#E5DFD5] pt-1 overflow-x-auto" aria-label="Administrator Navigation">
          {navLinks.map((link) => {
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-[#1A3B2B] text-[#1A3B2B] bg-[#FBF9F5]'
                    : 'border-transparent text-[#615B52] hover:text-[#1C1917] hover:border-[#CDC5B7]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span className="bg-[#C85A32] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
