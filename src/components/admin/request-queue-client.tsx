'use client';

import * as React from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Booking, Hall } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DecisionModal } from './decision-modal';
import { formatDateInAppTz, formatTimeInAppTz, getTimezoneLabel } from '@/lib/utils/timezone';

interface RequestQueueClientProps {
  initialBookings: Booking[];
  halls: Hall[];
}

const PAGE_SIZE = 10;

export function RequestQueueClient({
  initialBookings,
  halls,
}: RequestQueueClientProps) {
  const [bookings, setBookings] = React.useState<Booking[]>(initialBookings);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('PENDING');
  const [hallFilter, setHallFilter] = React.useState<string>('ALL');
  const [page, setPage] = React.useState(1);
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [decisionMode, setDecisionMode] = React.useState<'approve' | 'reject' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);
  const tzLabel = getTimezoneLabel();

  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) {
        return false;
      }

      if (hallFilter !== 'ALL' && b.hallId !== hallFilter) {
        return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchRef = b.referenceNumber.toLowerCase().includes(q);
        const matchEvent = b.eventName.toLowerCase().includes(q);
        const matchRequester = b.requesterName.toLowerCase().includes(q);
        const matchEmail = b.requesterEmail.toLowerCase().includes(q);
        const matchHall = (b.hallName || '').toLowerCase().includes(q);
        if (!matchRef && !matchEvent && !matchRequester && !matchEmail && !matchHall) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, statusFilter, hallFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedBookings = filteredBookings.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;
  const approvedCount = bookings.filter((b) => b.status === 'APPROVED').length;
  const rejectedCount = bookings.filter((b) => b.status === 'REJECTED').length;

  // Detect overlap against already-approved bookings in memory for helpful preview
  const selectedConflicts = React.useMemo(() => {
    if (!selectedBooking || selectedBooking.status !== 'PENDING') return [];
    const s = new Date(selectedBooking.startTime).getTime();
    const e = new Date(selectedBooking.endTime).getTime();
    return bookings.filter((other) => {
      if (other.id === selectedBooking.id || other.hallId !== selectedBooking.hallId || other.status !== 'APPROVED') {
        return false;
      }
      const os = new Date(other.startTime).getTime();
      const oe = new Date(other.endTime).getTime();
      return s < oe && e > os;
    });
  }, [bookings, selectedBooking]);

  const handleDecisionSuccess = (updated: Booking) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setSelectedBooking(updated);
    setFeedbackMessage(
      `Booking ${updated.referenceNumber} status successfully updated to ${updated.status}.`
    );
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {feedbackMessage && (
        <div className="p-3 bg-[#EBF3EE] border border-[#CDE3D5] text-[#1A3B2B] rounded-md text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs text-[#1A3B2B] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="civic-card p-4 bg-white border border-[#E5DFD5] space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E5DFD5] pb-3">
          {[
            { key: 'PENDING', label: 'Pending Review', count: pendingCount, highlight: true },
            { key: 'APPROVED', label: 'Approved', count: approvedCount },
            { key: 'REJECTED', label: 'Declined', count: rejectedCount },
            { key: 'ALL', label: 'All Requests', count: bookings.length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                statusFilter === tab.key
                  ? 'bg-[#1A3B2B] text-white shadow-xs'
                  : 'bg-[#FBF9F5] text-[#615B52] hover:text-[#1C1917] border border-[#E5DFD5]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.key
                    ? tab.highlight
                      ? 'bg-[#C85A32] text-white'
                      : 'bg-white/20 text-white'
                    : 'bg-[#E5DFD5] text-[#1C1917]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8A8275]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search reference (REQ-...), event name, or requester email..."
              aria-label="Search booking requests"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B] focus:border-[#1A3B2B]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={hallFilter}
              onChange={(e) => {
                setHallFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by facility"
              className="text-xs px-3 py-2 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B] w-full sm:w-52"
            >
              <option value="ALL">All Facilities</option>
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>

            {(searchQuery || hallFilter !== 'ALL' || statusFilter !== 'PENDING') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setHallFilter('ALL');
                  setStatusFilter('PENDING');
                  setPage(1);
                }}
                className="text-xs shrink-0 gap-1 text-[#615B52]"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#615B52] px-1">
            <span>
              Showing <strong>{paginatedBookings.length}</strong> of{' '}
              <strong>{filteredBookings.length}</strong> matching requests
            </span>
            <span>
              Page {safePage} of {totalPages}
            </span>
          </div>

          {paginatedBookings.length === 0 ? (
            <div className="civic-card p-12 bg-white border border-[#E5DFD5] text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#1A3B2B] mx-auto" />
              <h4 className="text-base font-bold text-[#1C1917]">No Matching Requests</h4>
              <p className="text-xs text-[#615B52] max-w-sm mx-auto">
                No requests currently match the selected filters.
              </p>
            </div>
          ) : (
            <div className="civic-card bg-white border border-[#E5DFD5] overflow-hidden divide-y divide-[#E5DFD5]">
              {paginatedBookings.map((b) => {
                const isSelected = selectedBooking?.id === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBooking(b)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#EBF3EE]/60 border-l-4 border-l-[#1A3B2B]'
                        : 'hover:bg-[#FBF9F5]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1A3B2B]">
                          {b.referenceNumber}
                        </span>
                        <Badge status={b.status} />
                      </div>
                      <h4 className="text-sm font-bold text-[#1C1917]">{b.eventName}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#615B52]">
                        <span className="font-medium text-[#1C1917]">{b.hallName}</span>
                        <span>•</span>
                        <span>{formatDateInAppTz(b.startTime)}</span>
                        <span>•</span>
                        <span className="font-mono">
                          {formatTimeInAppTz(b.startTime)} – {formatTimeInAppTz(b.endTime)}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#CDC5B7] bg-white text-xs font-medium text-[#1C1917] self-start sm:self-auto shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'Selected' : 'Inspect'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs">
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
                Page {safePage} of {totalPages}
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

        <div className="space-y-4">
          {selectedBooking ? (
            <div className="civic-card p-5 bg-white border border-[#E5DFD5] space-y-5 sticky top-24">
              <div className="border-b border-[#E5DFD5] pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#1A3B2B]">
                    {selectedBooking.referenceNumber}
                  </span>
                  <Badge status={selectedBooking.status} />
                </div>
                <h3 className="text-base font-bold text-[#1C1917]">
                  {selectedBooking.eventName}
                </h3>
                <span className="text-xs text-[#615B52] block">
                  {selectedBooking.hallName}
                </span>
              </div>

              {selectedConflicts.length > 0 && (
                <div className="p-3 rounded-md bg-[#FEF3F2] border border-[#FECDCA] text-xs text-[#912018] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Schedule Conflict Detected</span>
                  </div>
                  <p className="text-[11px]">
                    Overlaps with approved event <strong>{selectedConflicts[0].referenceNumber}</strong> ({selectedConflicts[0].eventName}). Server approval will be blocked.
                  </p>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] text-[#8A8275] block font-semibold uppercase">
                    Event Type
                  </span>
                  <span className="text-[#1C1917] font-medium">
                    {selectedBooking.eventType}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#8A8275] block font-semibold uppercase">
                    Requested Date &amp; Time ({tzLabel})
                  </span>
                  <span className="text-[#1C1917] font-semibold block">
                    {formatDateInAppTz(selectedBooking.startTime)}
                  </span>
                  <span className="font-mono text-[#615B52]">
                    {formatTimeInAppTz(selectedBooking.startTime)} – {formatTimeInAppTz(selectedBooking.endTime)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#8A8275] block font-semibold uppercase">
                    Expected Attendance
                  </span>
                  <span className="text-[#1C1917] font-medium">
                    {selectedBooking.expectedAttendees} guests
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#8A8275] block font-semibold uppercase">
                    Requester Contact
                  </span>
                  <div className="text-[#1C1917] space-y-0.5">
                    <div className="font-semibold">{selectedBooking.requesterName}</div>
                    <div className="text-[#615B52] font-mono">{selectedBooking.requesterEmail}</div>
                    <div className="text-[#615B52]">{selectedBooking.requesterPhone}</div>
                    {selectedBooking.requesterOrg && (
                      <div className="text-[#8A8275]">Org: {selectedBooking.requesterOrg}</div>
                    )}
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div>
                    <span className="text-[11px] text-[#8A8275] block font-semibold uppercase">
                      Special Equipment / Requests
                    </span>
                    <p className="p-2 rounded bg-[#FBF9F5] border border-[#E5DFD5] text-[#615B52] italic mt-1">
                      &ldquo;{selectedBooking.specialRequests}&rdquo;
                    </p>
                  </div>
                )}

                {selectedBooking.decisionNotes && (
                  <div>
                    <span className="text-[11px] text-[#8A8275] block font-semibold uppercase">
                      Decision Notes
                    </span>
                    <p className="p-2 rounded bg-[#FBF9F5] border border-[#E5DFD5] text-[#1C1917] mt-1">
                      {selectedBooking.decisionNotes}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-[#E5DFD5] pt-4 space-y-2">
                <span className="text-[11px] font-bold text-[#8A8275] uppercase tracking-wider block">
                  Administrative Action
                </span>

                {selectedBooking.status === 'PENDING' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setDecisionMode('approve')}
                      className="text-xs gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDecisionMode('reject')}
                      className="text-xs gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </Button>
                  </div>
                ) : selectedBooking.status === 'APPROVED' ? (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded bg-[#EBF3EE] text-[#1A3B2B] text-xs font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>This booking is confirmed on the calendar.</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDecisionMode('reject')}
                      className="w-full text-xs text-[#B42318] hover:bg-[#FEF3F2]"
                    >
                      Revoke / Reject Booking
                    </Button>
                  </div>
                ) : selectedBooking.status === 'CANCELLED' ? (
                  <div className="p-2.5 rounded bg-[#F5F2EB] text-[#615B52] text-xs font-medium">
                    Cancelled by requester. No administrative action permitted.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded bg-[#FEF3F2] text-[#B42318] text-xs font-medium flex items-center gap-2">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>This request was declined.</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDecisionMode('approve')}
                      className="w-full text-xs text-[#1A3B2B] hover:bg-[#EBF3EE]"
                    >
                      Re-evaluate &amp; Approve
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="civic-card p-8 bg-white border border-[#E5DFD5] text-center space-y-2">
              <FileText className="w-8 h-8 text-[#8A8275] mx-auto" />
              <h4 className="text-sm font-bold text-[#1C1917]">No Request Selected</h4>
              <p className="text-xs text-[#615B52]">
                Select any booking request from the queue to inspect attendee details, review setup notes, and issue approval decisions.
              </p>
            </div>
          )}
        </div>
      </div>

      <DecisionModal
        booking={selectedBooking}
        mode={decisionMode}
        onClose={() => setDecisionMode(null)}
        onSuccess={handleDecisionSuccess}
      />
    </div>
  );
}
