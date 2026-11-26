'use client';

import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { Hall } from '@/types';
import { Button } from '@/components/ui/button';
import { AvailabilityChecker } from './availability-checker';
import { BookingRequestModal } from './booking-request-modal';
import { getAppTodayDateString } from '@/lib/utils/timezone';

export interface HallDetailsInteractiveProps {
  hall: Hall;
  initialDateParam?: string;
}

export function HallDetailsInteractive({ hall, initialDateParam }: HallDetailsInteractiveProps) {
  const defaultDate =
    initialDateParam && /^\d{4}-\d{2}-\d{2}$/.test(initialDateParam)
      ? initialDateParam
      : getAppTodayDateString();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(defaultDate);
  const [selectedStart, setSelectedStart] = React.useState('10:00');
  const [selectedEnd, setSelectedEnd] = React.useState('16:00');

  const handleSelectSlot = (date: string, startTime: string, endTime: string) => {
    setSelectedDate(date);
    setSelectedStart(startTime);
    setSelectedEnd(endTime);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="civic-card p-6 bg-[#FBF9F5] border border-[#E5DFD5] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-[#C85A32] uppercase tracking-wider block">
            Public Reservation Service
          </span>
          <h3 className="text-xl font-bold text-[#1C1917]">
            Ready to Request {hall.name}?
          </h3>
          <p className="text-xs text-[#615B52] max-w-lg leading-relaxed">
            Verify schedule availability below or submit a preliminary booking request directly.
            All requests begin as PENDING and are assigned a unique reference code for review.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            disabled={!hall.isActive}
            onClick={() => setIsModalOpen(true)}
            className="gap-2 text-sm shadow-sm"
          >
            <span>{hall.isActive ? 'Request Booking' : 'Facility Archived'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AvailabilityChecker
        hallId={hall.id}
        hallName={hall.name}
        initialDate={defaultDate}
        onSelectSlot={hall.isActive ? handleSelectSlot : undefined}
      />

      <BookingRequestModal
        hall={hall}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDate={selectedDate}
        initialStartTime={selectedStart}
        initialEndTime={selectedEnd}
      />
    </div>
  );
}
