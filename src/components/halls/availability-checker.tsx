'use client';

import * as React from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { TimeSlot } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { getAppTodayDateString, getTimezoneLabel } from '@/lib/utils/timezone';

export interface AvailabilityCheckerProps {
  hallId: string;
  hallName: string;
  initialDate?: string;
  onSelectSlot?: (date: string, startTime: string, endTime: string) => void;
}

export function AvailabilityChecker({
  hallId,
  hallName,
  initialDate,
  onSelectSlot,
}: AvailabilityCheckerProps) {
  const [selectedDate, setSelectedDate] = React.useState<string>(
    () => initialDate || getAppTodayDateString()
  );
  const [slots, setSlots] = React.useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [reloadTick, setReloadTick] = React.useState(0);

  React.useEffect(() => {
    if (!selectedDate) return;
    let active = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/availability?hallId=${encodeURIComponent(hallId)}&date=${encodeURIComponent(selectedDate)}`);
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setSlots([]);
          setError(data.details || data.error || 'Real availability data is currently unavailable.');
        } else {
          setSlots(data.schedule || []);
          setNotice(data.notice || null);
        }
      } catch {
        if (!active) return;
        setSlots([]);
        setError('Unable to reach the availability service. Schedule availability cannot be confirmed.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [hallId, selectedDate, reloadTick]);

  const handleDateStep = (days: number) => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
      d.setUTCDate(d.getUTCDate() + days);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    } catch {
      // ignore invalid date
    }
  };

  const availableCount = slots.filter((s) => s.isAvailable).length;
  const bookedCount = slots.filter((s) => s.conflictReason === 'APPROVED_BOOKING').length;
  const maintCount = slots.filter((s) => s.conflictReason === 'MAINTENANCE_WINDOW').length;
  const tzLabel = getTimezoneLabel();

  return (
    <div className="civic-card p-6 bg-white border border-[#E5DFD5]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5]">
        <div>
          <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#1A3B2B]" />
            Availability Schedule — {hallName}
          </h3>
          <p className="text-xs text-[#615B52] mt-0.5">
            Times shown in <strong>{tzLabel}</strong>. Availability is blocked strictly by approved bookings and active maintenance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <label htmlFor="schedule-date" className="text-xs font-semibold text-[#1C1917] shrink-0 mr-1">
            Date:
          </label>
          <button
            type="button"
            onClick={() => handleDateStep(-1)}
            aria-label="Previous Day"
            title="Previous Day"
            className="p-1.5 rounded border border-[#E5DFD5] bg-[#FBF9F5] text-[#615B52] hover:text-[#1A3B2B] hover:bg-[#EBF3EE] transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <input
            id="schedule-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B] focus:border-[#1A3B2B]"
          />
          <button
            type="button"
            onClick={() => handleDateStep(1)}
            aria-label="Next Day"
            title="Next Day"
            className="p-1.5 rounded border border-[#E5DFD5] bg-[#FBF9F5] text-[#615B52] hover:text-[#1A3B2B] hover:bg-[#EBF3EE] transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(getAppTodayDateString())}
            className="text-xs h-7 px-2"
          >
            Today
          </Button>
        </div>
      </div>

      <div className="py-3.5">
        <Alert variant="info" className="py-2.5 text-xs">
          <strong>Civic Transparency Notice:</strong>{' '}
          {notice ||
            'A submitted request is not an approved booking. Only confirmed administrative approvals and scheduled maintenance windows block availability.'}
        </Alert>
      </div>

      {!isLoading && !error && slots.length > 0 && (
        <div className="grid grid-cols-3 gap-3 py-3 mb-4 bg-[#FBF9F5] p-3 rounded-md border border-[#E5DFD5] text-center text-xs">
          <div>
            <span className="block text-[11px] text-[#615B52] uppercase font-semibold">Available</span>
            <span className="text-base font-bold text-[#1A3B2B]">{availableCount} hrs</span>
          </div>
          <div>
            <span className="block text-[11px] text-[#615B52] uppercase font-semibold">Approved Bookings</span>
            <span className="text-base font-bold text-[#B42318]">{bookedCount} hrs</span>
          </div>
          <div>
            <span className="block text-[11px] text-[#615B52] uppercase font-semibold">Maintenance</span>
            <span className="text-base font-bold text-[#C85A32]">{maintCount} hrs</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-xs text-[#615B52] flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#1A3B2B] border-t-transparent" />
          <span>Querying facility schedule records...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-md bg-[#FEF3F2] border border-[#FECDCA] text-center space-y-2 text-xs text-[#912018]">
          <AlertTriangle className="w-6 h-6 text-[#B42318] mx-auto" />
          <p className="font-semibold">Availability Data Unavailable</p>
          <p className="max-w-md mx-auto">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReloadTick((t) => t + 1)}
            className="mt-2 text-xs"
          >
            Retry Schedule Check
          </Button>
        </div>
      ) : slots.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#615B52]">
          No operational hours scheduled for the selected date.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {slots.map((slot, index) => {
            const isApproved = slot.conflictReason === 'APPROVED_BOOKING';
            const isMaintenance = slot.conflictReason === 'MAINTENANCE_WINDOW';

            return (
              <div
                key={index}
                className={`p-3 rounded-md border text-xs flex flex-col justify-between transition-colors ${
                  isApproved
                    ? 'bg-[#FEF3F2] border-[#FECDCA] text-[#912018]'
                    : isMaintenance
                    ? 'bg-[#FAEEE8] border-[#F1CEBF] text-[#A63F1B]'
                    : 'bg-white border-[#E5DFD5] text-[#1C1917] hover:border-[#1A3B2B]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 opacity-70" />
                    {slot.startTime} – {slot.endTime}
                  </span>
                  {isApproved ? (
                    <Badge variant="danger" className="text-[10px] py-0 px-1.5">
                      Booked
                    </Badge>
                  ) : isMaintenance ? (
                    <Badge
                      variant="warning"
                      className="text-[10px] py-0 px-1.5 bg-[#FAEEE8] text-[#C85A32] border-[#F1CEBF]"
                    >
                      Maintenance
                    </Badge>
                  ) : (
                    <Badge variant="success" className="text-[10px] py-0 px-1.5">
                      Available
                    </Badge>
                  )}
                </div>

                {slot.conflictDetails && (
                  <p className="text-[11px] leading-snug line-clamp-2 mt-1">
                    {slot.conflictDetails}
                  </p>
                )}

                {slot.isAvailable && onSelectSlot && (
                  <button
                    type="button"
                    onClick={() => onSelectSlot(selectedDate, slot.startTime, slot.endTime)}
                    className="mt-2 text-[11px] font-semibold text-[#1A3B2B] hover:text-[#132B20] text-left underline decoration-dotted"
                  >
                    Use this time in request →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
