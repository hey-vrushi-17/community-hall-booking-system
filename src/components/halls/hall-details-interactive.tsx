'use client';

import * as React from 'react';
import { Calendar, Clock, Users, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { Hall } from '@/types';
import { Button } from '@/components/ui/button';
import { AvailabilityChecker } from './availability-checker';
import { BookingRequestModal } from './booking-request-modal';

export interface HallDetailsInteractiveProps {
  hall: Hall;
}

export function HallDetailsInteractive({ hall }: HallDetailsInteractiveProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState('2026-11-28');
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
      {/* Quick Booking CTA Bar */}
      <div className="civic-card p-6 bg-[#FBF9F5] border border-[#E5DFD5] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-[#C85A32] uppercase tracking-wider block">
            Public Reservation Service
          </span>
          <h3 className="text-xl font-bold text-[#1C1917]">
            Ready to Request {hall.name}?
          </h3>
          <p className="text-xs text-[#615B52] max-w-lg leading-relaxed">
            Verify real-time availability below or submit a preliminary booking request directly.
            All requests are assigned a unique tracking number for municipal review.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsModalOpen(true)}
            className="gap-2 text-sm shadow-sm"
          >
            <span>Request Booking</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Live Availability Checker Component */}
      <AvailabilityChecker
        hallId={hall.id}
        hallName={hall.name}
        onSelectSlot={handleSelectSlot}
      />

      {/* Booking Modal */}
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
