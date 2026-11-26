'use client';

import * as React from 'react';
import {
  Building,
  Plus,
  Search,
  Edit3,
  Archive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Users,
  MapPin,
  Clock,
  IndianRupee,
  X,
  ExternalLink,
} from 'lucide-react';
import { Hall } from '@/types';
import { Button } from '@/components/ui/button';

interface HallManagementClientProps {
  initialHalls: Hall[];
}

interface HallFormData {
  name: string;
  tagline: string;
  description: string;
  capacity: number;
  hourlyRate: number;
  location: string;
  address: string;
  neighborhood: string;
  amenities: string;
  rulesAndPolicies: string;
  imageUrl: string;
  imageAlt: string;
  openTime: string;
  closeTime: string;
  operatingDays: string;
  featured: boolean;
}

const defaultFormData: HallFormData = {
  name: '',
  tagline: '',
  description: '',
  capacity: 150,
  hourlyRate: 500,
  location: '',
  address: '',
  neighborhood: '',
  amenities: 'Audio System, Projector, Wheelchair Accessible Entry, Parking',
  rulesAndPolicies: 'Standard municipal quiet hours apply after 10:00 PM.\nPremises must be cleared cleanly prior to handover.',
  imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
  imageAlt: 'Interior of community hall',
  openTime: '08:00',
  closeTime: '22:00',
  operatingDays: 'Monday through Sunday',
  featured: false,
};

export function HallManagementClient({ initialHalls }: HallManagementClientProps) {
  const [halls, setHalls] = React.useState<Hall[]>(initialHalls);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingHall, setEditingHall] = React.useState<Hall | null>(null);
  const [formData, setFormData] = React.useState<HallFormData>(defaultFormData);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [archiveTarget, setArchiveTarget] = React.useState<Hall | null>(null);
  const [archiving, setArchiving] = React.useState(false);

  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  React.useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const filteredHalls = React.useMemo(() => {
    return halls.filter((h) => {
      if (statusFilter === 'ACTIVE' && !h.isActive) return false;
      if (statusFilter === 'ARCHIVED' && h.isActive) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = h.name.toLowerCase().includes(q);
        const matchNeighborhood = h.neighborhood.toLowerCase().includes(q);
        const matchLocation = h.location.toLowerCase().includes(q);
        const matchAmenity = h.amenities.some((a) => a.toLowerCase().includes(q));
        if (!matchName && !matchNeighborhood && !matchLocation && !matchAmenity) {
          return false;
        }
      }

      return true;
    });
  }, [halls, statusFilter, searchQuery]);

  const activeCount = halls.filter((h) => h.isActive).length;
  const archivedCount = halls.filter((h) => !h.isActive).length;
  const totalCapacity = halls.reduce((sum, h) => sum + (h.isActive ? h.capacity : 0), 0);

  const openCreateModal = () => {
    setEditingHall(null);
    setFormData(defaultFormData);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (hall: Hall) => {
    setEditingHall(hall);
    setFormData({
      name: hall.name,
      tagline: hall.tagline || '',
      description: hall.description || '',
      capacity: hall.capacity,
      hourlyRate: hall.hourlyRate,
      location: hall.location,
      address: hall.address,
      neighborhood: hall.neighborhood,
      amenities: hall.amenities.join(', '),
      rulesAndPolicies: hall.rulesAndPolicies.join('\n'),
      imageUrl: hall.images[0]?.url || '',
      imageAlt: hall.images[0]?.alt || hall.name,
      openTime: hall.operatingHours?.open || '08:00',
      closeTime: hall.operatingHours?.close || '22:00',
      operatingDays: hall.operatingHours?.days || 'Monday through Sunday',
      featured: Boolean(hall.featured),
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const amenitiesList = formData.amenities
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const rulesList = formData.rulesAndPolicies
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        tagline: formData.tagline.trim(),
        description: formData.description.trim(),
        capacity: Number(formData.capacity),
        hourlyRate: Number(formData.hourlyRate),
        location: formData.location.trim(),
        address: formData.address.trim(),
        neighborhood: formData.neighborhood.trim(),
        amenities: amenitiesList,
        rulesAndPolicies: rulesList,
        featured: formData.featured,
        images: formData.imageUrl
          ? [{ url: formData.imageUrl.trim(), alt: formData.imageAlt.trim() || formData.name }]
          : [],
        operatingHours: {
          open: formData.openTime,
          close: formData.closeTime,
          days: formData.operatingDays,
        },
      };

      if (editingHall) {
        const res = await fetch(`/api/admin/halls/${editingHall.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update hall');

        setHalls((prev) => prev.map((h) => (h.id === editingHall.id ? data.hall : h)));
        setFeedback({ type: 'success', message: `Facility "${data.hall.name}" updated successfully.` });
      } else {
        const res = await fetch('/api/admin/halls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create hall');

        setHalls((prev) => [data.hall, ...prev]);
        setFeedback({ type: 'success', message: `New facility "${data.hall.name}" created and published.` });
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      const targetArchive = archiveTarget.isActive;
      const res = await fetch(`/api/admin/halls/${archiveTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive: targetArchive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update archive status');

      setHalls((prev) => prev.map((h) => (h.id === archiveTarget.id ? data.hall : h)));
      setFeedback({
        type: 'success',
        message: targetArchive
          ? `Facility "${data.hall.name}" archived. Hidden from public searches while preserving historical records.`
          : `Facility "${data.hall.name}" restored to active public service.`,
      });
      setArchiveTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change facility status.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="space-y-6">
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
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-500 hover:text-stone-800 text-xs font-semibold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-[#E5DFD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#615B52]">
              Total Facilities
            </span>
            <Building className="w-4 h-4 text-[#1A3B2B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1C1917]">{halls.length}</span>
            <span className="text-xs text-[#615B52]">catalogued</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E5DFD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#615B52]">
              Active Listings
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#1A3B2B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1A3B2B]">{activeCount}</span>
            <span className="text-xs text-[#615B52]">publicly bookable</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E5DFD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#615B52]">
              Archived
            </span>
            <Archive className="w-4 h-4 text-[#989082]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#615B52]">{archivedCount}</span>
            <span className="text-xs text-[#615B52]">offline / preserved</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E5DFD5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-[#615B52]">
              Max Active Capacity
            </span>
            <Users className="w-4 h-4 text-[#18283E]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#18283E]">{totalCapacity}</span>
            <span className="text-xs text-[#615B52]">citizens</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-[#E5DFD5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#989082]" />
            <input
              type="text"
              placeholder="Search facility name, city, or amenity..."
              aria-label="Search facilities"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[#FBF9F5] border border-[#E5DFD5] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#FBF9F5] p-1 rounded-md border border-[#E5DFD5]">
            {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                  statusFilter === tab
                    ? 'bg-white text-[#1A3B2B] shadow-xs font-semibold'
                    : 'text-[#615B52] hover:text-[#1C1917]'
                }`}
              >
                {tab === 'ALL'
                  ? `All (${halls.length})`
                  : tab === 'ACTIVE'
                  ? `Active (${activeCount})`
                  : `Archived (${archivedCount})`}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-[#1A3B2B] hover:bg-[#142e22] text-white flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Facility</span>
        </Button>
      </div>

      {filteredHalls.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E5DFD5] p-12 text-center space-y-3">
          <Building className="w-12 h-12 text-[#989082] mx-auto opacity-50" />
          <h3 className="text-base font-semibold text-[#1C1917]">No community facilities found</h3>
          <p className="text-sm text-[#615B52] max-w-md mx-auto">
            {searchQuery
              ? `No facilities matched your search query "${searchQuery}".`
              : 'There are currently no facility records in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHalls.map((hall) => {
            const primaryImage =
              hall.images[0]?.url ||
              'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80';
            return (
              <div
                key={hall.id}
                className={`bg-white rounded-lg border overflow-hidden transition-shadow hover:shadow-sm flex flex-col justify-between ${
                  hall.isActive ? 'border-[#E5DFD5]' : 'border-[#E5DFD5] opacity-75 bg-[#FAF8F5]'
                }`}
              >
                <div>
                  <div className="relative h-44 w-full bg-[#E5DFD5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={primaryImage}
                      alt={hall.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      {hall.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F3EE] text-[#1A3B2B] shadow-xs">
                          Active Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3F1ED] text-[#615B52] shadow-xs">
                          Archived
                        </span>
                      )}
                    </div>
                    {hall.featured && (
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#C85A32] text-white shadow-xs">
                          Featured
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#1C1917] leading-snug">
                        {hall.name}
                      </h3>
                      <p className="text-xs text-[#C85A32] font-medium mt-0.5">
                        {hall.neighborhood}
                      </p>
                    </div>

                    <p className="text-xs text-[#615B52] line-clamp-2 leading-relaxed">
                      {hall.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F3F1ED] text-xs text-[#1C1917]">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#1A3B2B]" />
                        <span>Up to <strong>{hall.capacity}</strong> guests</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5 text-[#18283E]" />
                        <span><strong>₹{hall.hourlyRate}</strong> / hour</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2 text-[#615B52]">
                        <Clock className="w-3.5 h-3.5 text-[#989082]" />
                        <span>
                          {hall.operatingHours?.open || '08:00'} – {hall.operatingHours?.close || '22:00'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2 text-[#615B52] truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#989082] shrink-0" />
                        <span className="truncate">{hall.address}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-1">
                      {hall.amenities.slice(0, 3).map((amenity, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-[#FBF9F5] border border-[#E5DFD5] text-[#615B52] text-[11px] rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                      {hall.amenities.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[#989082] text-[11px]">
                          +{hall.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-[#E5DFD5] bg-[#FBF9F5] flex items-center justify-between gap-2">
                  <a
                    href={`/halls/${hall.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#18283E] hover:underline flex items-center gap-1 font-medium"
                  >
                    Public Page
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(hall)}
                      className="h-8 text-xs flex items-center gap-1 text-[#1C1917] border-[#E5DFD5] bg-white hover:bg-[#F3F1ED]"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </Button>

                    <Button
                      variant={hall.isActive ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => setArchiveTarget(hall)}
                      className={`h-8 text-xs flex items-center gap-1 ${
                        hall.isActive
                          ? 'text-[#B42318] border-[#F8C9C4] bg-white hover:bg-[#FDF2F0]'
                          : 'bg-[#1A3B2B] text-white hover:bg-[#142e22]'
                      }`}
                    >
                      {hall.isActive ? (
                        <>
                          <Archive className="w-3 h-3" />
                          Archive
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          Restore
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg border border-[#E5DFD5] shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col my-8">
            <div className="p-5 border-b border-[#E5DFD5] flex items-center justify-between bg-[#FBF9F5]">
              <div>
                <h3 className="text-lg font-bold text-[#1C1917]">
                  {editingHall ? `Edit Facility: ${editingHall.name}` : 'Register New Community Facility'}
                </h3>
                <p className="text-xs text-[#615B52]">
                  Configure capacity, operational hours, rules, amenities, and imagery.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="text-[#989082] hover:text-[#1C1917] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="m-5 p-3 rounded bg-[#FDF2F0] border border-[#F8C9C4] text-[#B42318] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Facility Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Municipal Civic Hall"
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="Short subtitle"
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1C1917]">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Capacity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Hourly Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Open Time</label>
                  <input
                    type="time"
                    value={formData.openTime}
                    onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Close Time</label>
                  <input
                    type="time"
                    value={formData.closeTime}
                    onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Location / Area *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">City / District *</label>
                  <input
                    type="text"
                    required
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1C1917]">
                  Amenities (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1C1917]">
                  Rules &amp; Policies (one per line)
                </label>
                <textarea
                  rows={2}
                  value={formData.rulesAndPolicies}
                  onChange={(e) => setFormData({ ...formData, rulesAndPolicies: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">
                    Primary Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded"
                  />
                </div>

                <label className="flex items-center gap-2 pt-4 cursor-pointer text-xs font-semibold text-[#1C1917]">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="h-4 w-4 rounded border-[#CDC5B7] text-[#1A3B2B]"
                  />
                  <span>Feature this hall on the public landing page</span>
                </label>
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
                    : editingHall
                    ? 'Save Changes'
                    : 'Create Facility'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg border border-[#E5DFD5] shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  archiveTarget.isActive ? 'bg-[#FDF2F0] text-[#B42318]' : 'bg-[#E8F3EE] text-[#1A3B2B]'
                }`}
              >
                {archiveTarget.isActive ? (
                  <Archive className="w-5 h-5" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1C1917]">
                  {archiveTarget.isActive ? 'Archive Facility' : 'Restore Facility'}
                </h3>
                <p className="text-xs text-[#615B52]">{archiveTarget.name}</p>
              </div>
            </div>

            <p className="text-xs text-[#615B52] leading-relaxed">
              {archiveTarget.isActive
                ? 'Archiving this facility hides it immediately from public listings. Existing booking records and audit logs remain preserved.'
                : 'Restoring this facility makes it active immediately so citizens can view and request dates again.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5DFD5]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchiveTarget(null)}
                disabled={archiving}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleArchiveToggle}
                disabled={archiving}
                className={`text-xs ${
                  archiveTarget.isActive
                    ? 'bg-[#B42318] hover:bg-[#912018] text-white'
                    : 'bg-[#1A3B2B] hover:bg-[#142e22] text-white'
                }`}
              >
                {archiving ? 'Updating...' : archiveTarget.isActive ? 'Confirm Archive' : 'Restore Facility'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
