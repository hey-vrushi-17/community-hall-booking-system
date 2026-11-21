'use client';

import * as React from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Wrench,
  CheckCircle2,
  Building,
  Users,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Booking, MaintenanceWindow, Hall } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AdminCalendarClientProps {
  bookings: Booking[];
  maintenance: MaintenanceWindow[];
  halls: Hall[];
}

export function AdminCalendarClient({
  bookings,
  maintenance,
  halls,
}: AdminCalendarClientProps) {
  // Calendar date navigation: default to November 2026 to match test fixtures & sample dataset
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date('2026-11-01T00:00:00Z'));
  const [selectedHallId, setSelectedHallId] = React.useState<string>('ALL');
  const [selectedDayString, setSelectedDayString] = React.useState<string>('2026-11-20');

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - 1, 1)));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 1)));
  };

  const resetToFixtureMonth = () => {
    setCurrentDate(new Date('2026-11-01T00:00:00Z'));
    setSelectedDayString('2026-11-20');
  };

  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth();
  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  // Calculate calendar days
  const firstDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  // Filter bookings and maintenance by hall if selected
  const confirmedBookings = React.useMemo(() => {
    return bookings.filter(
      (b) => b.status === 'APPROVED' && (selectedHallId === 'ALL' || b.hallId === selectedHallId)
    );
  }, [bookings, selectedHallId]);

  const activeMaintenance = React.useMemo(() => {
    return maintenance.filter(
      (m) =>
        (m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS') &&
        (selectedHallId === 'ALL' || m.hallId === selectedHallId)
    );
  }, [maintenance, selectedHallId]);

  // Selected day items
  const dayBookings = React.useMemo(() => {
    return confirmedBookings.filter((b) => b.startTime.slice(0, 10) === selectedDayString);
  }, [confirmedBookings, selectedDayString]);

  const dayMaintenance = React.useMemo(() => {
    return activeMaintenance.filter((m) => m.startTime.slice(0, 10) === selectedDayString);
  }, [activeMaintenance, selectedDayString]);

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
    <div className="space-y-6">
      {/* Calendar Controls Bar */}
      <div className="civic-card p-4 bg-white border border-[#E5DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              title="Previous Month"
              className="p-1.5 rounded border border-[#E5DFD5] bg-[#FBF9F5] text-[#615B52] hover:text-[#1A3B2B] hover:bg-[#EBF3EE] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              title="Next Month"
              className="p-1.5 rounded border border-[#E5DFD5] bg-[#FBF9F5] text-[#615B52] hover:text-[#1A3B2B] hover:bg-[#EBF3EE] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#1A3B2B]" />
            <span>{monthName}</span>
          </h2>

          <Button
            variant="outline"
            size="sm"
            onClick={resetToFixtureMonth}
            className="text-xs text-[#615B52] py-1 h-7"
          >
            Go to Nov 2026 (Fixtures)
          </Button>
        </div>

        {/* Legend & Hall Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 text-[11px] font-medium text-[#615B52]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1A3B2B]" />
              <span>Confirmed Event</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C85A32]" />
              <span>Maintenance</span>
            </div>
          </div>

          <select
            value={selectedHallId}
            onChange={(e) => setSelectedHallId(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B]"
          >
            <option value="ALL">All Facilities</option>
            {halls.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: 7-Day Month View + Day Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 civic-card bg-white border border-[#E5DFD5] overflow-hidden p-4">
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-[#8A8275] uppercase pb-2 border-b border-[#E5DFD5]">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1 pt-2">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-20 bg-[#FBF9F5]/40 rounded p-1" />
            ))}

            {/* Calendar Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const isSelected = selectedDayString === dayStr;

              // Items on this day
              const dayEvents = confirmedBookings.filter(
                (b) => b.startTime.slice(0, 10) === dayStr
              );
              const dayMaint = activeMaintenance.filter(
                (m) => m.startTime.slice(0, 10) === dayStr
              );

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDayString(dayStr)}
                  className={`min-h-22 rounded border p-1.5 transition-all cursor-pointer flex flex-col justify-between text-left ${
                    isSelected
                      ? 'border-[#1A3B2B] bg-[#EBF3EE]/60 ring-2 ring-[#1A3B2B]/20'
                      : 'border-[#E5DFD5] hover:border-[#1A3B2B]/50 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-[#1A3B2B]' : 'text-[#1C1917]'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {(dayEvents.length > 0 || dayMaint.length > 0) && (
                      <span className="text-[10px] text-[#8A8275]">
                        {dayEvents.length + dayMaint.length}
                      </span>
                    )}
                  </div>

                  {/* Badges / Pill Snippets */}
                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="truncate text-[10px] bg-[#EBF3EE] text-[#1A3B2B] px-1 py-0.5 rounded font-medium border border-[#CDE3D5]"
                        title={`${ev.eventName} (${ev.hallName})`}
                      >
                        {ev.eventName}
                      </div>
                    ))}
                    {dayMaint.slice(0, 1).map((m) => (
                      <div
                        key={m.id}
                        className="truncate text-[10px] bg-[#FAEEE8] text-[#C85A32] px-1 py-0.5 rounded font-medium border border-[#F1CEBF]"
                        title={`Maintenance: ${m.title}`}
                      >
                        Maint: {m.title}
                      </div>
                    ))}
                    {dayEvents.length + dayMaint.length > 3 && (
                      <div className="text-[9px] text-[#8A8275] font-semibold pl-0.5">
                        +{dayEvents.length + dayMaint.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Schedule Inspector (1 col) */}
        <div className="civic-card p-5 bg-white border border-[#E5DFD5] space-y-4">
          <div className="border-b border-[#E5DFD5] pb-3 space-y-1">
            <span className="text-[11px] font-bold text-[#8A8275] uppercase tracking-wider block">
              Daily Schedule Inspector
            </span>
            <h3 className="text-base font-bold text-[#1C1917]">
              {new Date(`${selectedDayString}T00:00:00Z`).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </h3>
            <p className="text-xs text-[#615B52]">
              Showing all confirmed events and scheduled facility maintenance for this date.
            </p>
          </div>

          {dayBookings.length === 0 && dayMaintenance.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#615B52] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#1A3B2B] mx-auto" />
              <p className="font-semibold text-[#1C1917]">No Confirmed Events or Closures</p>
              <p className="text-[#8A8275] max-w-xs mx-auto">
                All operating hours are open and available for citizen booking requests.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {/* Confirmed Bookings list */}
              {dayBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-md bg-[#EBF3EE] border border-[#CDE3D5] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-[#1A3B2B]">
                      {b.referenceNumber}
                    </span>
                    <span className="bg-[#1A3B2B] text-white text-[10px] font-bold px-1.5 py-0.2 rounded">
                      APPROVED
                    </span>
                  </div>
                  <h4 className="font-bold text-[#1C1917]">{b.eventName}</h4>
                  <div className="text-[11px] text-[#615B52] space-y-0.5">
                    <div>
                      <strong>Venue:</strong> {b.hallName}
                    </div>
                    <div>
                      <strong>Time (UTC):</strong>{' '}
                      <span className="font-mono">
                        {formatTime(b.startTime)} – {formatTime(b.endTime)}
                      </span>
                    </div>
                    <div>
                      <strong>Organizer:</strong> {b.requesterName} ({b.expectedAttendees} guests)
                    </div>
                  </div>
                </div>
              ))}

              {/* Maintenance list */}
              {dayMaintenance.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-md bg-[#FAEEE8] border border-[#F1CEBF] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#C85A32] flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5" />
                      FACILITY MAINTENANCE
                    </span>
                    <span className="bg-[#C85A32] text-white text-[10px] font-bold px-1.5 py-0.2 rounded">
                      {m.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#1C1917]">{m.title}</h4>
                  <div className="text-[11px] text-[#615B52] space-y-0.5">
                    <div>
                      <strong>Venue:</strong> {m.hallName}
                    </div>
                    <div>
                      <strong>Time (UTC):</strong>{' '}
                      <span className="font-mono">
                        {formatTime(m.startTime)} – {formatTime(m.endTime)}
                      </span>
                    </div>
                    <div>
                      <strong>Scope:</strong> {m.reason}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
