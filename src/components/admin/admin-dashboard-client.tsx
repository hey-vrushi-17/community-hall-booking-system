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
  History,
} from 'lucide-react';
import { AdminDashboardSummary, AuditEvent, Hall } from '@/types';
import { Button } from '@/components/ui/button';
import { formatDateInAppTz, formatTimeInAppTz, formatDateTimeInAppTz, getTimezoneLabel } from '@/lib/utils/timezone';

interface AdminDashboardClientProps {
  summary: AdminDashboardSummary;
  halls: Hall[];
  recentAuditEvents: AuditEvent[];
}

export function AdminDashboardClient({
  summary,
  halls,
  recentAuditEvents,
}: AdminDashboardClientProps) {
  const tzLabel = getTimezoneLabel();

  return (
    <div className="space-y-8">
      {/* 1. KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <span className="text-xs text-[#615B52]">Scheduled &amp; approved</span>
          </div>
          <Link href="/admin/records">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 mt-1">
              <span>View Booking Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

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
          <Link href="/admin/maintenance">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 mt-1">
              <span>Manage Maintenance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

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
              {halls.filter((h) => h.isActive).length} / {halls.length}
            </span>
            <span className="text-xs text-[#615B52]">Active / total venues</span>
          </div>
          <Link href="/admin/halls">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 mt-1">
              <span>Manage Halls</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Hall Utilization Breakdown */}
      <div className="civic-card p-6 bg-white border border-[#E5DFD5] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DFD5] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1A3B2B]" />
              Facility Utilization &amp; Capacity Allocation
            </h3>
            <p className="text-xs text-[#615B52] mt-0.5">
              Utilization rate calculated from confirmed booking hours against standard monthly operating hours.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#8A8275] uppercase bg-[#FBF9F5] px-2.5 py-1 rounded border border-[#E5DFD5] self-start sm:self-auto">
            Display Timezone: {tzLabel}
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

      {/* 3. Operational Columns: Pending Requests + Upcoming Confirmed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      {b.hallName} • {formatDateInAppTz(b.startTime)} ({formatTimeInAppTz(b.startTime)})
                    </div>
                  </div>

                  <Link href="/admin/queue" className="shrink-0">
                    <Button variant="outline" size="sm" className="text-xs py-1 h-7">
                      Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="civic-card p-5 bg-white border border-[#E5DFD5] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#1A3B2B]" />
                Upcoming Confirmed Events
              </h3>
              <span className="text-[11px] text-[#615B52]">Approved reservations</span>
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
                      {b.hallName} • {formatDateInAppTz(b.startTime)} ({formatTimeInAppTz(b.startTime)})
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

      {/* 4. Active Maintenance & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="civic-card p-5 bg-white border border-[#E5DFD5] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-[#C85A32]" />
                Active &amp; Scheduled Maintenance
              </h3>
              <span className="text-[11px] text-[#615B52]">Closures blocking availability</span>
            </div>
            <Link
              href="/admin/maintenance"
              className="text-xs text-[#1A3B2B] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Manage ({summary.activeMaintenanceCount})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {summary.activeMaintenance.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#615B52]">
              No active or scheduled maintenance windows.
            </div>
          ) : (
            <div className="space-y-2.5">
              {summary.activeMaintenance.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-md bg-[#FAEEE8] border border-[#F1CEBF] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold text-[#1C1917] block truncate">{m.title}</span>
                    <span className="text-[11px] text-[#615B52] block truncate">
                      {m.hallName} • {formatDateInAppTz(m.startTime)} ({formatTimeInAppTz(m.startTime)} – {formatTimeInAppTz(m.endTime)})
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-white text-[#C85A32] px-2 py-0.5 rounded border border-[#F1CEBF] shrink-0">
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="civic-card p-5 bg-white border border-[#E5DFD5] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#18283E]" />
                Recent Audit Activity
              </h3>
              <span className="text-[11px] text-[#615B52]">Latest decisions &amp; system updates</span>
            </div>
            <Link
              href="/admin/audit"
              className="text-xs text-[#1A3B2B] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Full Audit Log</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentAuditEvents.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#615B52]">
              No audit events recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentAuditEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-md bg-[#FBF9F5] border border-[#E5DFD5] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-[#E5DFD5] text-[#18283E]">
                      {ev.action}
                    </span>
                    <span className="text-[10px] text-[#8A8275]">
                      {formatDateTimeInAppTz(ev.timestamp)}
                    </span>
                  </div>
                  <p className="font-medium text-[#1C1917] leading-snug">{ev.summary}</p>
                  <span className="text-[11px] text-[#615B52] block">Actor: {ev.actorEmail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
