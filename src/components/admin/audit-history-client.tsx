'use client';

import * as React from 'react';
import { Search, History, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { AuditEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { formatDateTimeInAppTz, getTimezoneLabel } from '@/lib/utils/timezone';

interface AuditHistoryClientProps {
  initialEvents: AuditEvent[];
}

const PAGE_SIZE = 20;

export function AuditHistoryClient({ initialEvents }: AuditHistoryClientProps) {
  const [events] = React.useState<AuditEvent[]>(initialEvents);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [entityFilter, setEntityFilter] = React.useState('ALL');
  const [actionFilter, setActionFilter] = React.useState('ALL');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const tzLabel = getTimezoneLabel();

  const distinctActions = React.useMemo(() => {
    return Array.from(new Set(events.map((e) => e.action))).sort();
  }, [events]);

  const filteredEvents = React.useMemo(() => {
    return events.filter((ev) => {
      if (entityFilter !== 'ALL' && ev.entityType !== entityFilter) return false;
      if (actionFilter !== 'ALL' && ev.action !== actionFilter) return false;

      const day = ev.timestamp.slice(0, 10);
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchActor = ev.actorEmail.toLowerCase().includes(q);
        const matchSummary = ev.summary.toLowerCase().includes(q);
        const matchAction = ev.action.toLowerCase().includes(q);
        const matchEntityId = ev.entityId.toLowerCase().includes(q);
        if (!matchActor && !matchSummary && !matchAction && !matchEntityId) {
          return false;
        }
      }
      return true;
    });
  }, [events, entityFilter, actionFilter, fromDate, toDate, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedEvents = filteredEvents.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const resetFilters = () => {
    setSearchQuery('');
    setEntityFilter('ALL');
    setActionFilter('ALL');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="civic-card p-5 bg-white border border-[#E5DFD5] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#8A8275] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search actor email, action summary, or record ID..."
              aria-label="Search audit events"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B]"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by entity type"
              className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917]"
            >
              <option value="ALL">All Entities</option>
              <option value="Booking">Booking</option>
              <option value="Hall">Hall</option>
              <option value="MaintenanceWindow">MaintenanceWindow</option>
            </select>
          </div>

          <div className="md:col-span-4">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by action"
              className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917]"
            >
              <option value="ALL">All Actions</option>
              {distinctActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E5DFD5]">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-[#615B52]">Date Range:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              aria-label="From date"
              className="px-2.5 py-1.5 rounded border border-[#E5DFD5] bg-[#FBF9F5]"
            />
            <span className="text-[#8A8275]">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              aria-label="To date"
              className="px-2.5 py-1.5 rounded border border-[#E5DFD5] bg-[#FBF9F5]"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#8A8275]">Times in {tzLabel}</span>
            {(searchQuery || entityFilter !== 'ALL' || actionFilter !== 'ALL' || fromDate || toDate) && (
              <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs gap-1">
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="civic-card bg-white border border-[#E5DFD5] overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-[#FBF9F5] border-b border-[#E5DFD5] flex items-center justify-between text-xs text-[#615B52]">
          <span>
            Showing <strong>{paginatedEvents.length}</strong> of <strong>{filteredEvents.length}</strong> audit entries
          </span>
          <span>
            Page {safePage} of {totalPages}
          </span>
        </div>

        {paginatedEvents.length === 0 ? (
          <div className="p-12 text-center space-y-2 text-xs text-[#615B52]">
            <History className="w-10 h-10 text-[#8A8275] mx-auto" />
            <p className="font-bold text-[#1C1917]">No Audit Events Match Your Filters</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5DFD5]">
            {paginatedEvents.map((ev) => {
              const isExpanded = expandedId === ev.id;
              return (
                <div key={ev.id} className="p-4 hover:bg-[#FBF9F5] transition-colors text-xs space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#EDF3FA] text-[#18283E] border border-[#D5E1E9]">
                        {ev.action}
                      </span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#F3EFE8] text-[#615B52]">
                        {ev.entityType}: {ev.entityId}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#615B52]">
                      <span>{formatDateTimeInAppTz(ev.timestamp)}</span>
                      {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                          className="text-[#1A3B2B] font-semibold inline-flex items-center gap-0.5 hover:underline"
                        >
                          <span>Metadata</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="font-semibold text-[#1C1917]">{ev.summary}</p>
                  <p className="text-[11px] text-[#615B52]">
                    Actor: <span className="font-mono text-[#1C1917]">{ev.actorEmail}</span>
                  </p>

                  {isExpanded && ev.metadata && (
                    <pre className="p-3 rounded bg-[#FBF9F5] border border-[#E5DFD5] text-[11px] font-mono text-[#4D4841] overflow-x-auto">
                      {JSON.stringify(ev.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
    </div>
  );
}
