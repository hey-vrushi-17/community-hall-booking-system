'use client';

import * as React from 'react';
import {
  Search,
  Filter,
  Calendar,
  Building,
  RotateCcw,
  Download,
  Users,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { Booking, Hall, BookingStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface BookingRecordsClientProps {
  initialBookings: Booking[];
  halls: Hall[];
}

export function BookingRecordsClient({
  initialBookings,
  halls,
}: BookingRecordsClientProps) {
  const [bookings] = React.useState<Booking[]>(initialBookings);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [hallFilter, setHallFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [inspectBooking, setInspectBooking] = React.useState<Booking | null>(null);

  // Filter logic
  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      // Hall
      if (hallFilter !== 'ALL' && b.hallId !== hallFilter) return false;

      // Status
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

      // Date range
      const bDate = b.startTime.slice(0, 10);
      if (fromDate && bDate < fromDate) return false;
      if (toDate && bDate > toDate) return false;

      // Search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchRef = b.referenceNumber.toLowerCase().includes(q);
        const matchEvent = b.eventName.toLowerCase().includes(q);
        const matchName = b.requesterName.toLowerCase().includes(q);
        const matchEmail = b.requesterEmail.toLowerCase().includes(q);
        const matchHall = (b.hallName || '').toLowerCase().includes(q);
        if (!matchRef && !matchEvent && !matchName && !matchEmail && !matchHall) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, hallFilter, statusFilter, fromDate, toDate, searchQuery]);

  // Aggregate statistics for the filtered records
  const totalHours = React.useMemo(() => {
    return filteredBookings.reduce((acc, b) => {
      if (b.status === 'APPROVED') {
        const s = new Date(b.startTime).getTime();
        const e = new Date(b.endTime).getTime();
        return acc + Math.max(0, (e - s) / (1000 * 60 * 60));
      }
      return acc;
    }, 0);
  }, [filteredBookings]);

  const totalAttendees = React.useMemo(() => {
    return filteredBookings.reduce((acc, b) => acc + (b.expectedAttendees || 0), 0);
  }, [filteredBookings]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setHallFilter('ALL');
    setStatusFilter('ALL');
    setFromDate('');
    setToDate('');
  };

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
    <div className="space-y-6">
      {/* KPI Overview Bar for Records */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="civic-card p-4 bg-white border border-[#E5DFD5]">
          <span className="text-[11px] font-semibold uppercase text-[#8A8275] block">
            Filtered Records
          </span>
          <span className="text-2xl font-bold text-[#1C1917] mt-1 block">
            {filteredBookings.length}
          </span>
        </div>

        <div className="civic-card p-4 bg-white border border-[#E5DFD5]">
          <span className="text-[11px] font-semibold uppercase text-[#8A8275] block">
            Approved Bookings
          </span>
          <span className="text-2xl font-bold text-[#1A3B2B] mt-1 block">
            {filteredBookings.filter((b) => b.status === 'APPROVED').length}
          </span>
        </div>

        <div className="civic-card p-4 bg-white border border-[#E5DFD5]">
          <span className="text-[11px] font-semibold uppercase text-[#8A8275] block">
            Confirmed Hours
          </span>
          <span className="text-2xl font-bold text-[#18283E] mt-1 block">
            {Math.round(totalHours * 10) / 10} hrs
          </span>
        </div>

        <div className="civic-card p-4 bg-white border border-[#E5DFD5]">
          <span className="text-[11px] font-semibold uppercase text-[#8A8275] block">
            Total Expected Guests
          </span>
          <span className="text-2xl font-bold text-[#C85A32] mt-1 block">
            {totalAttendees.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="civic-card p-5 bg-white border border-[#E5DFD5] space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8A8275]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, event title, organizer name or email..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B]"
            />
          </div>

          {/* Hall Filter */}
          <select
            value={hallFilter}
            onChange={(e) => setHallFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B] w-full md:w-48"
          >
            <option value="ALL">All Facilities</option>
            {halls.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B] w-full md:w-36"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Declined</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Date Range Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E5DFD5]">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-[#615B52] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#1A3B2B]" />
              Date Range:
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="From Date"
              className="text-xs px-2.5 py-1.5 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917]"
            />
            <span className="text-xs text-[#8A8275]">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="To Date"
              className="text-xs px-2.5 py-1.5 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917]"
            />
          </div>

          {(searchQuery || hallFilter !== 'ALL' || statusFilter !== 'ALL' || fromDate || toDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs gap-1.5 text-[#615B52] self-end sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </Button>
          )}
        </div>
      </div>

      {/* Records Table */}
      <div className="civic-card bg-white border border-[#E5DFD5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBF9F5] text-[#8A8275] uppercase tracking-wider font-semibold border-b border-[#E5DFD5]">
              <tr>
                <th className="p-3.5">Reference</th>
                <th className="p-3.5">Facility</th>
                <th className="p-3.5">Event Name</th>
                <th className="p-3.5">Date & Time (UTC)</th>
                <th className="p-3.5">Requester</th>
                <th className="p-3.5">Guests</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD5]">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#615B52]">
                    No booking records match your query.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setInspectBooking(b)}
                    className="hover:bg-[#FBF9F5] transition-colors cursor-pointer"
                  >
                    <td className="p-3.5 font-mono font-bold text-[#1A3B2B] whitespace-nowrap">
                      {b.referenceNumber}
                    </td>
                    <td className="p-3.5 font-medium text-[#1C1917] whitespace-nowrap">
                      {b.hallName}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-[#1C1917] max-w-xs truncate">
                        {b.eventName}
                      </div>
                      <div className="text-[11px] text-[#615B52]">{b.eventType}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-medium text-[#1C1917]">
                        {formatDate(b.startTime)}
                      </div>
                      <div className="font-mono text-[11px] text-[#615B52]">
                        {formatTime(b.startTime)} – {formatTime(b.endTime)}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-[#1C1917] whitespace-nowrap">
                        {b.requesterName}
                      </div>
                      <div className="font-mono text-[11px] text-[#615B52] truncate max-w-[140px]">
                        {b.requesterEmail}
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-[#1C1917]">
                      {b.expectedAttendees}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <Badge status={b.status} />
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <Button variant="outline" size="sm" className="text-xs">
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inspection Modal */}
      {inspectBooking && (
        <Modal
          isOpen={Boolean(inspectBooking)}
          onClose={() => setInspectBooking(null)}
          title={`Booking Record: ${inspectBooking.referenceNumber}`}
          description={`${inspectBooking.hallName} • Status: ${inspectBooking.status}`}
          maxWidth="lg"
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <div>
                <span className="text-[11px] text-[#8A8275] block uppercase">Event Name</span>
                <span className="text-base font-bold text-[#1C1917]">{inspectBooking.eventName}</span>
              </div>
              <Badge status={inspectBooking.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-[#615B52]">
              <div>
                <span className="text-[#8A8275] block">Facility:</span>
                <span className="font-semibold text-[#1C1917]">{inspectBooking.hallName}</span>
              </div>

              <div>
                <span className="text-[#8A8275] block">Category:</span>
                <span className="font-medium text-[#1C1917]">{inspectBooking.eventType}</span>
              </div>

              <div>
                <span className="text-[#8A8275] block">Event Date:</span>
                <span className="font-medium text-[#1C1917]">{formatDate(inspectBooking.startTime)}</span>
              </div>

              <div>
                <span className="text-[#8A8275] block">Time Window (UTC):</span>
                <span className="font-mono font-medium text-[#1C1917]">
                  {formatTime(inspectBooking.startTime)} – {formatTime(inspectBooking.endTime)}
                </span>
              </div>

              <div>
                <span className="text-[#8A8275] block">Requester:</span>
                <span className="font-semibold text-[#1C1917]">{inspectBooking.requesterName}</span>
                <div className="font-mono text-[#615B52]">{inspectBooking.requesterEmail}</div>
                <div>{inspectBooking.requesterPhone}</div>
              </div>

              <div>
                <span className="text-[#8A8275] block">Attendees:</span>
                <span className="font-medium text-[#1C1917]">{inspectBooking.expectedAttendees} guests</span>
                {inspectBooking.requesterOrg && (
                  <div className="mt-1">
                    <span className="text-[#8A8275]">Org: </span>
                    <span className="font-medium text-[#1C1917]">{inspectBooking.requesterOrg}</span>
                  </div>
                )}
              </div>
            </div>

            {inspectBooking.specialRequests && (
              <div className="border-t border-[#E5DFD5] pt-3">
                <span className="text-[11px] font-semibold text-[#8A8275] uppercase block mb-1">
                  Special Requests & Setup
                </span>
                <p className="p-2.5 rounded bg-[#FBF9F5] border border-[#E5DFD5] text-[#615B52] italic">
                  &ldquo;{inspectBooking.specialRequests}&rdquo;
                </p>
              </div>
            )}

            {inspectBooking.decisionNotes && (
              <div className="border-t border-[#E5DFD5] pt-3">
                <span className="text-[11px] font-semibold text-[#8A8275] uppercase block mb-1">
                  Administrative Decision Notes
                </span>
                <div className="p-2.5 rounded bg-[#FBF9F5] border border-[#E5DFD5] text-[#1C1917]">
                  <p>{inspectBooking.decisionNotes}</p>
                  {inspectBooking.reviewedAt && (
                    <span className="text-[10px] text-[#8A8275] block mt-1">
                      Recorded on {formatDate(inspectBooking.reviewedAt)}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#E5DFD5] flex items-center justify-between">
              <span className="text-[11px] text-[#8A8275]">
                Submission logged on {formatDate(inspectBooking.createdAt)}
              </span>
              <Button variant="outline" size="sm" onClick={() => setInspectBooking(null)}>
                Close Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
