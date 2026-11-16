'use client';

import * as React from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, ShieldAlert, Wrench, Info } from 'lucide-react';
import { TimeSlot } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export interface AvailabilityCheckerProps {
  hallId: string;
  hallName: string;
  onSelectSlot?: (date: string, startTime: string, endTime: string) => void;
}

export function AvailabilityChecker({
  hallId,
  hallName,
  onSelectSlot,
}: AvailabilityCheckerProps) {
  // Default to 2026-11-20 for deterministic demo of approved bookings & maintenance
  const [selectedDate, setSelectedDate] = React.useState<string>('2026-11-20');
  const [slots, setSlots] = React.useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSchedule = React.useCallback(async (date: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/availability?hallId=${hallId}&date=${date}`);
      if (!res.ok) {
        throw new Error('Could not retrieve schedule data for this date');
      }
      const data = await res.json();
      setSlots(data.schedule || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load availability');
    } finally {
      setIsLoading(false);
    }
  }, [hallId]);

  React.useEffect(() => {
    if (selectedDate) {
      fetchSchedule(selectedDate);
    }
  }, [selectedDate, fetchSchedule]);

  const availableCount = slots.filter((s) => s.isAvailable).length;
  const bookedCount = slots.filter((s) => s.conflictReason === 'APPROVED_BOOKING').length;
  const maintCount = slots.filter((s) => s.conflictReason === 'MAINTENANCE_WINDOW').length;

  return (
    <div className="civic-card p-6 bg-white border border-[#E5DFD5]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5DFD5]">
        <div>
          <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#1A3B2B]" />
            Live Hall Availability & Schedule
          </h3>
          <p className="text-xs text-[#615B52] mt-0.5">
            Availability is determined strictly by approved bookings and scheduled maintenance.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="schedule-date" className="text-xs font-semibold text-[#1C1917] shrink-0">
            Select Date:
          </label>
          <input
            id="schedule-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B] focus:border-[#1A3B2B]"
          />
        </div>
      </div>

      {/* Policy Explainer Banner */}
      <div className="py-3.5">
        <Alert variant="info" className="py-2.5 text-xs">
          <strong>Civic Transparency Notice:</strong> A submitted request is not an approved booking.
          Only confirmed administrative approvals and scheduled maintenance windows block
          availability.
        </Alert>
      </div>

      {/* Summary KPI Bar */}
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

      {/* Hourly Schedule View */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-[#615B52] flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#1A3B2B] border-t-transparent" />
          <span>Querying facility schedule records...</span>
        </div>
      ) : error ? (
        <div className="py-8 text-center text-xs text-[#B42318]">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSchedule(selectedDate)}
            className="mt-3 text-xs"
          >
            Retry
          </Button>
        </div>
      ) : slots.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#615B52]">
          No operational hours scheduled for the selected date.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {slots.map((slot, index) => {
              const isApproved = slot.conflictReason === 'APPROVED_BOOKING';
              const isMaintenance = slot.conflictReason === 'MAINTENANCE_WINDOW';
              const hasPending = slot.bookingStatus === 'PENDING';

              return (
                <div
                  key={index}
                  className={`p-3 rounded-md border text-xs flex flex-col justify-between transition-colors ${
                    isApproved
                      ? 'bg-[#FEF3F2] border-[#FECDCA] text-[#912018]'
                      : isMaintenance
                      ? 'bg-[#FAEEE8] border-[#F1CEBF] text-[#A63F1B]'
                      : hasPending
                      ? 'bg-[#FFFDF5] border-[#F9DBAF] text-[#8C3B00]'
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
                      <Badge variant="warning" className="text-[10px] py-0 px-1.5 bg-[#FAEEE8] text-[#C85A32] border-[#F1CEBF]">
                        Maintenance
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px] py-0 px-1.5">
                        Available
                      </Badge>
                    )}
                  </div>

                  <p className="text-[11px] leading-snug line-clamp-2 mt-1">
                    {slot.conflictDetails}
                  </p>

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
        </div>
      )}
    </div>
  );
}
