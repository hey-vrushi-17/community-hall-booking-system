'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Inbox,
  CheckCircle2,
  Wrench,
  Building,
  TrendingUp,
  ArrowRight,
  Clock,
  Calendar,
  AlertCircle,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { AdminDashboardSummary, Booking, Hall } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AdminDashboardClientProps {
  summary: AdminDashboardSummary;
  halls: Hall[];
}

export function AdminDashboardClient({
  summary,
  halls,
}: AdminDashboardClientProps) {
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Requests KPI */}
        <div className="civic-card p-5 bg-white border border-[#E5DFD5] shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8A8275] uppercase tracking-wider">
              Pending Queue
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FEF6EE] text-[#C85A32] flex items-center justify-center font-bold">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-[#C85A32] block">
              {summary.pendingCount}
            </span>
            <span className="text-xs text-[#615B52]">Awaiting facility review</span>
          </div>
          <Link href="/admin/queue">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 mt-1">
              <span>Process Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Confirmed Bookings KPI */}
        <div className="civic-card p-5 bg-white border border-[#E5DFD5] shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8A8275] uppercase tracking-wider">
              Confirmed Events
            </span>
            <div className="w-8 h-8 rounded-full bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-[#1A3B2B] block">
              {summary.approvedCount}
            </span>
            <span className="text-xs text-[#615B52]">Scheduled & approved</span>
          </div>
          <Link href="/admin/records?status=APPROVED">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 mt-1">
              <span>View Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Active Maintenance KPI */}
        <div className="civic-card p-5 bg-white border border-[#E5DFD5] shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8A8275] uppercase tracking-wider">
              Maintenance Windows
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FAEEE8] text-[#C85A32] flex items-center justify-center font-bold">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-[#1C1917] block">
              {summary.activeMaintenanceCount}
            </span>
            <span className="text-xs text-[#615B52]">Active or scheduled</span>
          </div>
          <Link href="/admin/calendar">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 mt-1">
              <span>Schedule Inspector</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Total Active Venues KPI */}
        <div className="civic-card p-5 bg-white border border-[#E5DFD5] shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8A8275] uppercase tracking-wider">
              Public Facilities
            </span>
            <div className="w-8 h-8 rounded-full bg-[#F3EFE8] text-[#18283E] flex items-center justify-center font-bold">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-[#18283E] block">
              {halls.length}
            </span>
            <span className="text-xs text-[#615B52]">Total community venues</span>
          </div>
          <Link href="/halls">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 mt-1">
              <span>Browse Public Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Hall Utilization Breakdown Section */}
      <div className="civic-card p-6 bg-white border border-[#E5DFD5] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DFD5] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1A3B2B]" />
              Facility Utilization & Capacity Allocation
            </h3>
            <p className="text-xs text-[#615B52] mt-0.5">
              Monthly utilization rate calculated against standard operational operating hours.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#8A8275] uppercase bg-[#FBF9F5] px-2.5 py-1 rounded border border-[#E5DFD5] self-start sm:self-auto">
            Rolling 30-Day Window
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.hallUtilization.map((hall) => {
            const isHigh = hall.utilizationRate >= 30;
            return (
              <div
                key={hall.hallId}
                className="p-4 rounded-lg border border-[#E5DFD5] bg-[#FBF9F5] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#1C1917]">{hall.hallName}</h4>
                    <span className="text-[11px] text-[#615B52]">
                      Max Capacity: {hall.capacity} guests
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      isHigh
                        ? 'bg-[#EBF3EE] text-[#1A3B2B] border border-[#CDE3D5]'
                        : 'bg-white text-[#615B52] border border-[#E5DFD5]'
                    }`}
                  >
                    {hall.utilizationRate}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full bg-[#E5DFD5] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isHigh ? 'bg-[#1A3B2B]' : 'bg-[#C85A32]'
                      }`}
                      style={{ width: `${Math.max(4, hall.utilizationRate)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#8A8275]">
                    <span>{hall.approvedHours} hrs confirmed</span>
                    <span>{hall.totalBookings} events</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Operational Quick Columns: Recent Pending + Upcoming Confirmed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Pending Requests */}
        <div className="civic-card p-5 bg-white border border-[#E5DFD5] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#C85A32]" />
                Recent Pending Requests
              </h3>
              <span className="text-[11px] text-[#615B52]">Awaiting administrative review</span>
            </div>
            <Link
              href="/admin/queue"
              className="text-xs text-[#1A3B2B] font-semibold hover:underline flex items-center gap-1"
            >
              <span>View Queue ({summary.pendingCount})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {summary.recentPendingRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#615B52]">
              All submitted requests have been reviewed and processed.
            </div>
          ) : (
            <div className="space-y-2.5">
              {summary.recentPendingRequests.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-md bg-[#FBF9F5] border border-[#E5DFD5] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#1A3B2B]">
                        {b.referenceNumber}
                      </span>
                      <span className="font-semibold text-[#1C1917] truncate">
                        {b.eventName}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#615B52] truncate">
                      {b.hallName} • {formatDate(b.startTime)}
                    </div>
                  </div>

                  <Link href={`/admin/queue`} className="shrink-0">
                    <Button variant="outline" size="sm" className="text-xs py-1 h-7">
                      Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Confirmed Events */}
        <div className="civic-card p-5 bg-white border border-[#E5DFD5] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#1A3B2B]" />
                Upcoming Confirmed Events
              </h3>
              <span className="text-[11px] text-[#615B52]">Next scheduled facility reservations</span>
            </div>
            <Link
              href="/admin/calendar"
              className="text-xs text-[#1A3B2B] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Open Calendar</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {summary.upcomingApprovedBookings.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#615B52]">
              No confirmed bookings currently on the calendar.
            </div>
          ) : (
            <div className="space-y-2.5">
              {summary.upcomingApprovedBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-md bg-[#EBF3EE] border border-[#CDE3D5] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[#1A3B2B]">
                        {b.referenceNumber}
                      </span>
                      <span className="font-bold text-[#1C1917] truncate">{b.eventName}</span>
                    </div>
                    <div className="text-[11px] text-[#615B52] truncate">
                      {b.hallName} • {formatDate(b.startTime)} ({formatTime(b.startTime)} UTC)
                    </div>
                  </div>

                  <span className="text-[10px] font-bold bg-white text-[#1A3B2B] px-2 py-0.5 rounded border border-[#CDE3D5] shrink-0">
                    {b.expectedAttendees} guests
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
