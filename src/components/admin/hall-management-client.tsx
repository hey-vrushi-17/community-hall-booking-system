'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Building,
  Plus,
  Search,
  Filter,
  Edit3,
  Archive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Users,
  MapPin,
  Clock,
  DollarSign,
  Layers,
  X,
  ExternalLink,
} from 'lucide-react';
import { Hall } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  imageUrl: string;
  imageAlt: string;
  openTime: string;
  closeTime: string;
  operatingDays: string;
}

const defaultFormData: HallFormData = {
  name: '',
  tagline: '',
  description: '',
  capacity: 100,
  hourlyRate: 50,
  location: 'Municipal District Campus',
  address: '100 Civic Center Plaza',
  neighborhood: 'Downtown Civic District',
  amenities: 'Audio System, Projector, High-Speed Wi-Fi, Accessible Restrooms',
  imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
  imageAlt: 'Interior of community hall',
  openTime: '08:00',
  closeTime: '22:00',
  operatingDays: 'Monday - Sunday',
};

export function HallManagementClient({ initialHalls }: HallManagementClientProps) {
  const [halls, setHalls] = React.useState<Hall[]>(initialHalls);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingHall, setEditingHall] = React.useState<Hall | null>(null);
  const [formData, setFormData] = React.useState<HallFormData>(defaultFormData);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Archive modal state
  const [archiveTarget, setArchiveTarget] = React.useState<Hall | null>(null);
  const [archiving, setArchiving] = React.useState(false);

  // Toast banner
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-dismiss feedback
  React.useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Filtered halls
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
      imageUrl: hall.images[0]?.url || '',
      imageAlt: hall.images[0]?.alt || hall.name,
      openTime: hall.operatingHours?.open || '08:00',
      closeTime: hall.operatingHours?.close || '22:00',
      operatingDays: hall.operatingHours?.days || 'Monday - Sunday',
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
        // PUT update
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
        // POST create
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
      const targetArchive = archiveTarget.isActive; // if active, we are archiving it
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
          ? `Facility "${data.hall.name}" archived. It is hidden from public searches but booking records are preserved.`
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

      {/* Stats Summary Row */}
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

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E5DFD5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#989082]" />
            <input
              type="text"
              placeholder="Search facility name, neighborhood, or amenity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[#FBF9F5] border border-[#E5DFD5] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#FBF9F5] p-1 rounded-md border border-[#E5DFD5]">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-[#1C1917] shadow-xs'
                  : 'text-[#615B52] hover:text-[#1C1917]'
              }`}
            >
              All ({halls.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white text-[#1A3B2B] shadow-xs font-semibold'
                  : 'text-[#615B52] hover:text-[#1C1917]'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('ARCHIVED')}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                statusFilter === 'ARCHIVED'
                  ? 'bg-white text-[#989082] shadow-xs'
                  : 'text-[#615B52] hover:text-[#1C1917]'
              }`}
            >
              Archived ({archivedCount})
            </button>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={openCreateModal}
          className="bg-[#1A3B2B] hover:bg-[#142e22] text-white flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Facility</span>
        </Button>
      </div>

      {/* Hall Cards Grid */}
      {filteredHalls.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E5DFD5] p-12 text-center space-y-3">
          <Building className="w-12 h-12 text-[#989082] mx-auto opacity-50" />
          <h3 className="text-base font-semibold text-[#1C1917]">No community facilities found</h3>
          <p className="text-sm text-[#615B52] max-w-md mx-auto">
            {searchQuery
              ? `No facilities matched your search query "${searchQuery}". Try adjusting your keywords.`
              : 'There are currently no facility records in this category.'}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="mt-2"
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHalls.map((hall) => {
            const primaryImage = hall.images[0]?.url || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80';
            return (
              <div
                key={hall.id}
                className={`bg-white rounded-lg border overflow-hidden transition-shadow hover:shadow-sm flex flex-col justify-between ${
                  hall.isActive ? 'border-[#E5DFD5]' : 'border-[#E5DFD5] opacity-75 bg-[#FAF8F5]'
                }`}
              >
                <div>
                  {/* Image header with status badge */}
                  <div className="relative h-44 w-full bg-[#E5DFD5]">
                    <Image
                      src={primaryImage}
                      alt={hall.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

                  {/* Body Content */}
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

                    {/* Metadata specs */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F3F1ED] text-xs text-[#1C1917]">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#1A3B2B]" />
                        <span>Up to <strong>{hall.capacity}</strong> guests</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#18283E]" />
                        <span><strong>${hall.hourlyRate}</strong> / hour</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2 text-[#615B52]">
                        <Clock className="w-3.5 h-3.5 text-[#989082]" />
                        <span>
                          {hall.operatingHours?.open || '08:00'} - {hall.operatingHours?.close || '22:00'} ({hall.operatingHours?.days || 'Daily'})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2 text-[#615B52] truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#989082] flex-shrink-0" />
                        <span className="truncate">{hall.address}</span>
                      </div>
                    </div>

                    {/* Amenities pills */}
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

                {/* Footer Actions */}
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

      {/* Create / Edit Facility Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg border border-[#E5DFD5] shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col my-8">
            <div className="p-5 border-b border-[#E5DFD5] flex items-center justify-between bg-[#FBF9F5]">
              <div>
                <h3 className="text-lg font-bold text-[#1C1917]">
                  {editingHall ? `Edit Facility: ${editingHall.name}` : 'Register New Community Facility'}
                </h3>
                <p className="text-xs text-[#615B52]">
                  Configure capacity, operational hours, location specifications, and amenities.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#989082] hover:text-[#1C1917] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="m-5 p-3 rounded bg-[#FDF2F0] border border-[#F8C9C4] text-[#B42318] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                    placeholder="e.g. Maple Heights Community Center"
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Tagline</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Versatile hall for civic assemblies"
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1C1917]">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive overview of hall specifications, acoustics, and architectural characteristics..."
                  className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Capacity (Guests) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Hourly Rate ($) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Daily Open Time</label>
                  <input
                    type="time"
                    value={formData.openTime}
                    onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Daily Close Time</label>
                  <input
                    type="time"
                    value={formData.closeTime}
                    onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Municipal Campus / Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Westside Community Park"
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Street Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 742 Evergreen Terrace"
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1C1917]">Neighborhood</label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="e.g. Maple Heights"
                    className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1C1917]">
                  Amenities (comma-separated list)
                </label>
                <input
                  type="text"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="e.g. Commercial Kitchen, Audio System, Stage, Projector, ADA Accessible"
                  className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1C1917]">
                  Primary Photography Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs p-2.5 bg-[#FBF9F5] border border-[#E5DFD5] rounded focus:outline-none focus:ring-1 focus:ring-[#1A3B2B]"
                />
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

      {/* Archive / Restore Confirmation Modal */}
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
                ? 'Archiving this facility hides it immediately from citizen booking search results and public listings. Existing booking reservations, approved contracts, and historical audit logs will remain intact.'
                : 'Restoring this facility makes it active immediately. Citizens will be able to discover and submit reservation requests for this hall again.'}
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
                {archiving
                  ? 'Processing...'
                  : archiveTarget.isActive
                  ? 'Confirm Archival'
                  : 'Confirm Restore'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
