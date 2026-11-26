'use client';

import * as React from 'react';
import { Search, Calendar, RotateCcw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking, Hall } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import {
  formatDateInAppTz,
  formatTimeInAppTz,
  getDatePartInAppTz,
  getTimezoneLabel,
} from '@/lib/utils/timezone';

interface BookingRecordsClientProps {
  initialBookings: Booking[];
  halls: Hall[];
}

const PAGE_SIZE = 15;

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
  const [page, setPage] = React.useState(1);
  const [inspectBooking, setInspectBooking] = React.useState<Booking | null>(null);
  const tzLabel = getTimezoneLabel();

  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      if (hallFilter !== 'ALL' && b.hallId !== hallFilter) return false;
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

      const bDate = getDatePartInAppTz(b.startTime);
      if (fromDate && bDate < fromDate) return false;
      if (toDate && bDate > toDate) return false;

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

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedBookings = filteredBookings.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

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
    setPage(1);
  };

  const handleExportCsv = () => {
    const escapeCsv = (val: unknown) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Reference',
      'Facility',
      'Event Name',
      'Category',
      'Date',
      'Start Time',
      'End Time',
      'Requester Name',
      'Requester Email',
      'Attendees',
      'Status',
      'Decision Notes',
    ];

    const rows = filteredBookings.map((b) => [
      b.referenceNumber,
      b.hallName || '',
      b.eventName,
      b.eventType,
      getDatePartInAppTz(b.startTime),
      formatTimeInAppTz(b.startTime),
      formatTimeInAppTz(b.endTime),
      b.requesterName,
      b.requesterEmail,
      b.expectedAttendees,
      b.status,
      b.decisionNotes || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `civicspaces-booking-records-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
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

      <div className="civic-card p-5 bg-white border border-[#E5DFD5] space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8A8275]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search reference, event title, organizer name or email..."
              aria-label="Search booking records"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B]"
            />
          </div>

          <select
            value={hallFilter}
            onChange={(e) => {
              setHallFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by facility"
            className="text-xs px-3 py-2 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B] w-full md:w-48"
          >
            <option value="ALL">All Facilities</option>
            {halls.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by booking status"
            className="text-xs px-3 py-2 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B] w-full md:w-36"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Declined</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E5DFD5]">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-[#615B52] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#1A3B2B]" />
              Date Range:
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              aria-label="From Date"
              className="text-xs px-2.5 py-1.5 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917]"
            />
            <span className="text-xs text-[#8A8275]">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              aria-label="To Date"
              className="text-xs px-2.5 py-1.5 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917]"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {(searchQuery || hallFilter !== 'ALL' || statusFilter !== 'ALL' || fromDate || toDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs gap-1.5 text-[#615B52]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={filteredBookings.length === 0}
              className="text-xs gap-1.5 text-[#1A3B2B]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="civic-card bg-white border border-[#E5DFD5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBF9F5] text-[#8A8275] uppercase tracking-wider font-semibold border-b border-[#E5DFD5]">
              <tr>
                <th className="p-3.5">Reference</th>
                <th className="p-3.5">Facility</th>
                <th className="p-3.5">Event Name</th>
                <th className="p-3.5">Date &amp; Time ({tzLabel})</th>
                <th className="p-3.5">Requester</th>
                <th className="p-3.5">Guests</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD5]">
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#615B52]">
                    No booking records match your query.
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-[#FBF9F5] transition-colors"
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
                        {formatDateInAppTz(b.startTime)}
                      </div>
                      <div className="font-mono text-[11px] text-[#615B52]">
                        {formatTimeInAppTz(b.startTime)} – {formatTimeInAppTz(b.endTime)}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-[#1C1917] whitespace-nowrap">
                        {b.requesterName}
                      </div>
                      <div className="font-mono text-[11px] text-[#615B52] truncate max-w-[160px]">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectBooking(b)}
                        className="text-xs"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 bg-[#FBF9F5] border-t border-[#E5DFD5] flex items-center justify-between text-xs">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="gap-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <span className="text-[#615B52]">
              Page {safePage} of {totalPages} ({filteredBookings.length} records)
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="gap-1 text-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

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
                <span className="font-medium text-[#1C1917]">
                  {formatDateInAppTz(inspectBooking.startTime)}
                </span>
              </div>

              <div>
                <span className="text-[#8A8275] block">Time Window ({tzLabel}):</span>
                <span className="font-mono font-medium text-[#1C1917]">
                  {formatTimeInAppTz(inspectBooking.startTime)} – {formatTimeInAppTz(inspectBooking.endTime)}
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
                  Special Requests &amp; Setup
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
                      Recorded on {formatDateInAppTz(inspectBooking.reviewedAt)}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#E5DFD5] flex items-center justify-between">
              <span className="text-[11px] text-[#8A8275]">
                Submission logged on {formatDateInAppTz(inspectBooking.createdAt)}
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
