'use client';

import * as React from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Building,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Edit3,
  XCircle,
  Layers,
  Info,
} from 'lucide-react';
import { MaintenanceWindow, Hall, Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MaintenanceManagementClientProps {
  initialMaintenance: MaintenanceWindow[];
  halls: Hall[];
}

interface MaintenanceFormData {
  hallId: string;
  title: string;
  reason: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

const defaultFormData: MaintenanceFormData = {
  hallId: '',
  title: '',
  reason: '',
  startDate: '2026-12-01',
  startTime: '08:00',
  endDate: '2026-12-01',
  endTime: '17:00',
};

export function MaintenanceManagementClient({
  initialMaintenance,
  halls,
}: MaintenanceManagementClientProps) {
  const [maintenanceList, setMaintenanceList] = React.useState<MaintenanceWindow[]>(initialMaintenance);
  const [activeTab, setActiveTab] = React.useState<'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ALL'>('ACTIVE');
  const [selectedHallFilter, setSelectedHallFilter] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [editingItem, setEditingItem] = React.useState<MaintenanceWindow | null>(null);
  const [formData, setFormData] = React.useState<MaintenanceFormData>({
    ...defaultFormData,
    hallId: halls[0]?.id || '',
  });
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [conflictBookings, setConflictBookings] = React.useState<Booking[]>([]);

  // Cancel action modal
  const [cancellingItem, setCancellingItem] = React.useState<MaintenanceWindow | null>(null);
  const [cancelReason, setCancelReason] = React.useState<string>('Maintenance completed early or rescheduled');
  const [cancelling, setCancelling] = React.useState<boolean>(false);

  // Toast feedback
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  React.useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Filtered maintenance list
  const filteredList = React.useMemo(() => {
    return maintenanceList.filter((m) => {
      // Tab filter
      if (activeTab === 'ACTIVE') {
        if (m.status !== 'SCHEDULED' && m.status !== 'IN_PROGRESS') return false;
      } else if (activeTab === 'COMPLETED') {
        if (m.status !== 'COMPLETED') return false;
      } else if (activeTab === 'CANCELLED') {
        if (m.status !== 'CANCELLED') return false;
      }

      // Hall filter
      if (selectedHallFilter !== 'ALL' && m.hallId !== selectedHallFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchHall = (m.hallName || '').toLowerCase().includes(q);
        const matchReason = m.reason.toLowerCase().includes(q);
        if (!matchTitle && !matchHall && !matchReason) {
          return false;
        }
      }

      return true;
    });
  }, [maintenanceList, activeTab, selectedHallFilter, searchQuery]);

  const scheduledCount = maintenanceList.filter((m) => m.status === 'SCHEDULED').length;
  const inProgressCount = maintenanceList.filter((m) => m.status === 'IN_PROGRESS').length;
  const completedCount = maintenanceList.filter((m) => m.status === 'COMPLETED').length;
  const cancelledCount = maintenanceList.filter((m) => m.status === 'CANCELLED').length;

  const openScheduleModal = () => {
    setEditingItem(null);
    setFormData({
      ...defaultFormData,
      hallId: halls[0]?.id || '',
    });
    setErrorMsg(null);
    setConflictBookings([]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MaintenanceWindow) => {
    setEditingItem(item);
    const start = new Date(item.startTime);
    const end = new Date(item.endTime);
    setFormData({
      hallId: item.hallId,
      title: item.title,
      reason: item.reason,
      startDate: start.toISOString().split('T')[0],
      startTime: start.toISOString().split('T')[1].substring(0, 5),
      endDate: end.toISOString().split('T')[0],
      endTime: end.toISOString().split('T')[1].substring(0, 5),
    });
    setErrorMsg(null);
    setConflictBookings([]);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setConflictBookings([]);
    setSubmitting(true);

    try {
      const startIso = new Date(`${formData.startDate}T${formData.startTime}:00Z`).toISOString();
      const endIso = new Date(`${formData.endDate}T${formData.endTime}:00Z`).toISOString();

      if (new Date(startIso) >= new Date(endIso)) {
        throw new Error('Maintenance end time must occur strictly after start time.');
      }

      const payload = {
        hallId: formData.hallId,
        title: formData.title.trim(),
        reason: formData.reason.trim(),
        startTime: startIso,
        endTime: endIso,
      };

      if (editingItem) {
        // PUT update
        const res = await fetch(`/api/admin/maintenance/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.conflicts && data.conflicts.length > 0) {
            setConflictBookings(data.conflicts);
          }
          throw new Error(data.error || 'Failed to update maintenance window');
        }

        setMaintenanceList((prev) =>
          prev.map((m) => (m.id === editingItem.id ? data.maintenance : m))
        );
        setFeedback({
          type: 'success',
          message: `Maintenance window "${data.maintenance.title}" updated successfully.`,
        });
      } else {
        // POST create
        const res = await fetch('/api/admin/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.conflicts && data.conflicts.length > 0) {
            setConflictBookings(data.conflicts);
          }
          throw new Error(data.error || 'Failed to schedule maintenance window');
        }

        setMaintenanceList((prev) => [data.maintenance, ...prev]);
        setFeedback({
          type: 'success',
          message: `Maintenance "${data.maintenance.title}" scheduled. Public booking calendar updated.`,
        });
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancellingItem) return;
    setCancelling(true);

    try {
      const res = await fetch(`/api/admin/maintenance/${cancellingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel maintenance window');

      setMaintenanceList((prev) =>
        prev.map((m) => (m.id === cancellingItem.id ? data.maintenance : m))
      );
      setFeedback({
        type: 'success',
        message: `Maintenance window cancelled. Time slots for "${cancellingItem.hallName}" are immediately restored on public calendars.`,
      });
      setCancellingItem(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel maintenance window.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-md border flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-[#E8F3EE] border-[#B7DDC9] text-[#1A3B2B]'
              : 'bg-[#FDF2F0] border-[#F8C9C4] text-[#B42318]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-stone-500 hover:text-stone-800 text-xs font-semibold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-[#E5DFD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#615B52]">
              Active Work
            </span>
            <AlertTriangle className="w-4 h-4 text-[#C85A32]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#C85A32]">{inProgressCount}</span>
            <span className="text-xs text-[#615B52]">in progress</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E5DFD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#615B52]">
              Upcoming Scheduled
            </span>
            <Clock className="w-4 h-4 text-[#18283E]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#18283E]">{scheduledCount}</span>
            <span className="text-xs text-[#615B52]">pending start</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E5DFD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#615B52]">
              Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#1A3B2B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1A3B2B]">{completedCount}</span>
            <span className="text-xs text-[#615B52]">closed windows</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E5DFD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#615B52]">
              Cancelled
            </span>
            <XCircle className="w-4 h-4 text-[#989082]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#615B52]">{cancelledCount}</span>
            <span className="text-xs text-[#615B52]">released slots</span>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E5DFD5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#989082]" />
            <input
              type="text"
              placeholder="Search maintenance title, reason, or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[#FBF9F5] border border-[#E5DFD5] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
            />
          </div>

          {/* Hall selector dropdown */}
          <select
            value={selectedHallFilter}
            onChange={(e) => setSelectedHallFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-[#FBF9F5] border border-[#E5DFD5] rounded-md text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
          >
            <option value="ALL">All Facilities</option>
            {halls.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          {/* Tab filter pills */}
          <div className="flex items-center gap-1 bg-[#FBF9F5] p-1 rounded-md border border-[#E5DFD5]">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                activeTab === 'ACTIVE'
                  ? 'bg-white text-[#18283E] shadow-xs font-semibold'
                  : 'text-[#615B52] hover:text-[#1C1917]'
              }`}
            >
              Upcoming ({scheduledCount + inProgressCount})
            </button>
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                activeTab === 'COMPLETED'
                  ? 'bg-white text-[#1A3B2B] shadow-xs font-semibold'
                  : 'text-[#615B52] hover:text-[#1C1917]'
              }`}
            >
              Done ({completedCount})
            </button>
            <button
              onClick={() => setActiveTab('CANCELLED')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                activeTab === 'CANCELLED'
                  ? 'bg-white text-[#989082] shadow-xs font-semibold'
                  : 'text-[#615B52] hover:text-[#1C1917]'
              }`}
            >
              Cancelled ({cancelledCount})
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-white text-[#1C1917] shadow-xs font-semibold'
                  : 'text-[#615B52] hover:text-[#1C1917]'
              }`}
            >
              All ({maintenanceList.length})
            </button>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={openScheduleModal}
          className="bg-[#1A3B2B] hover:bg-[#142e22] text-white flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Maintenance</span>
        </Button>
      </div>

      {/* Maintenance List */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E5DFD5] p-12 text-center space-y-3">
          <Wrench className="w-12 h-12 text-[#989082] mx-auto opacity-50" />
          <h3 className="text-base font-semibold text-[#1C1917]">No maintenance schedules found</h3>
          <p className="text-sm text-[#615B52] max-w-md mx-auto">
            {searchQuery
              ? `No records matched your search query "${searchQuery}".`
              : 'There are no maintenance closures in this category.'}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="mt-2"
            >
              Clear Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => {
            const startDate = new Date(item.startTime);
            const endDate = new Date(item.endTime);
            const isCancelled = item.status === 'CANCELLED';
            const isCompleted = item.status === 'COMPLETED';
            const isOngoing = item.status === 'IN_PROGRESS';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-lg border p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-[#CDC5B8] ${
                  isCancelled ? 'opacity-70 bg-[#FAF8F5] border-[#E5DFD5]' : 'border-[#E5DFD5]'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-base text-[#1C1917]">{item.title}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        item.status === 'IN_PROGRESS'
                          ? 'bg-[#FDF2F0] text-[#C85A32] border border-[#F8C9C4]'
                          : item.status === 'SCHEDULED'
                          ? 'bg-[#EBF1F5] text-[#18283E] border border-[#D5E1E9]'
                          : item.status === 'COMPLETED'
                          ? 'bg-[#E8F3EE] text-[#1A3B2B] border border-[#B7DDC9]'
                          : 'bg-[#F3F1ED] text-[#989082] border border-[#E5DFD5]'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A3B2B]">
                    <Building className="w-3.5 h-3.5" />
                    <span>{item.hallName || 'Community Hall'}</span>
                  </div>

                  <p className="text-xs text-[#615B52] max-w-2xl leading-relaxed">
                    {item.reason}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#615B52]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#989082]" />
                      <span>
                        {startDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          timeZone: 'UTC',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#989082]" />
                      <span>
                        {startDate.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'UTC',
                        })}{' '}
                        -{' '}
                        {endDate.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'UTC',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {!isCancelled && !isCompleted && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(item)}
                        className="h-8 text-xs flex items-center gap-1 text-[#1C1917] border-[#E5DFD5] bg-white hover:bg-[#F3F1ED]"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCancellingItem(item);
                          setCancelReason('Work completed ahead of schedule / cancelled');
                        }}
                        className="h-8 text-xs flex items-center gap-1 text-[#B42318] border-[#F8C9C4] bg-white hover:bg-[#FDF2F0]"
                      >
                        <XCircle className="w-3 h-3" />
                        Cancel Window
                      </Button>
                    </>
                  )}
                  {isCancelled && (
                    <span className="text-xs italic text-[#989082]">
                      Window cancelled (slots restored)
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-xs text-[#1A3B2B] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule / Edit Maintenance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg border border-[#E5DFD5] shadow-xl w-full max-w-xl my-8">
            <div className="p-5 border-b border-[#E5DFD5] flex items-center justify-between bg-[#FBF9F5]">
              <div>
                <h3 className="text-lg font-bold text-[#1C1917]">
                  {editingItem ? 'Edit Maintenance Closure' : 'Schedule Facility Maintenance'}
                </h3>
                <p className="text-xs text-[#615B52]">
                  Maintenance windows immediately block public booking requests for overlapping times.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#989082] hover:text-[#1C1917] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error & Conflict Alert */}
            {errorMsg && (
              <div className="m-5 p-4 rounded bg-[#FDF2F0] border border-[#F8C9C4] text-[#B42318] text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>

                {conflictBookings.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#F8C9C4] space-y-1 text-[#1C1917]">
                    <p className="font-semibold text-xs text-[#B42318]">
                      Conflicting Approved Reservations ({conflictBookings.length}):
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      {conflictBookings.map((c) => (
                        <li key={c.id}>
                          <strong>{c.referenceNumber}</strong>: {c.eventName} (
                          {new Date(c.startTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'UTC',
                          })}{' '}
                          -{' '}
                          {new Date(c.endTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'UTC',
                          })}
                          )
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-[#615B52] italic pt-1">
                      To proceed, contact requesters and reschedule or cancel the existing bookings first.
                    </p>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1C1917]">Facility Venue *</label>
                <select
                  required
                  value={formData.hallId}
                  onChange={(e) => setFormData({ ...formData, hallId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                >
                  {halls.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1C1917]">Scope of Work / Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. HVAC Compressor Overhaul & Duct Inspection"
                  className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1C1917]">Internal Operational Notes / Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Provide detailed description of contractors, public safety considerations, or noise levels..."
                  className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Start Time (UTC) *</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">End Time (UTC) *</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-[#E5DFD5] bg-[#FBF9F5] flex items-center justify-end gap-3 -mx-5 -mb-5 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#1A3B2B] hover:bg-[#142e22] text-white text-xs px-5"
                >
                  {submitting
                    ? 'Saving...'
                    : editingItem
                    ? 'Update Maintenance'
                    : 'Schedule Closure'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Maintenance Window Modal */}
      {cancellingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg border border-[#E5DFD5] shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#FDF2F0] text-[#B42318]">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1C1917]">Cancel Maintenance Window</h3>
                <p className="text-xs text-[#615B52]">{cancellingItem.title}</p>
              </div>
            </div>

            <p className="text-xs text-[#615B52] leading-relaxed">
              Cancelling this maintenance window immediately restores the scheduled time slots for{' '}
              <strong>{cancellingItem.hallName}</strong> on the public citizen availability calendar.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1C1917]">Cancellation Reason</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Repairs completed early or contractor postponed"
                className="w-full text-xs p-2 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5DFD5]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancellingItem(null)}
                disabled={cancelling}
                className="text-xs"
              >
                Keep Window
              </Button>
              <Button
                size="sm"
                onClick={handleCancelConfirm}
                disabled={cancelling}
                className="bg-[#B42318] hover:bg-[#912018] text-white text-xs"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
