import { Hall, HallFilters } from '@/types';
import { SAMPLE_HALLS } from '@/lib/data/sample-halls';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createPublicClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { mapHallFromDb, DatabaseHallRow } from '@/lib/supabase/types';

// Helper to mute internal Next.js prerender bail-out exceptions and dev-only fallbacks
function logHallWarning(msg: string, err?: unknown) {
  if ((err as any)?.digest?.startsWith?.('NEXT_') || (err as any)?.digest === 'HANGING_PROMISE_REJECTION') {
    throw err;
  }
  if (process.env.NODE_ENV === 'development') {
    logHallWarning(msg, err);
  }
}

// Runtime in-memory halls store (allows creation, edits, and archiving in development mode)
let runtimeHalls: Hall[] = [...SAMPLE_HALLS];

export function getDataSourceStatus() {
  const configured = isSupabaseConfigured();
  return {
    isConfigured: configured,
    source: configured ? ('SUPABASE_POSTGRES' as const) : ('DEVELOPMENT_SAMPLE_STORE' as const),
    notice: configured
      ? 'Live Supabase database connection active.'
      : 'Development sample data active (Supabase credentials not configured in environment).',
  };
}

/**
 * Retrieve active civic halls, optionally filtered by criteria.
 * Public view only returns active halls (is_active = true).
 */
export async function getAllHalls(filters?: HallFilters): Promise<Hall[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createPublicClient();
      if (supabase) {
        let query = supabase.from('halls').select('*').eq('is_active', true);

        if (filters?.minCapacity && filters.minCapacity > 0) {
          query = query.gte('capacity', filters.minCapacity);
        }
        if (filters?.maxCapacity && filters.maxCapacity > 0) {
          query = query.lte('capacity', filters.maxCapacity);
        }

        const { data, error } = await query.order('featured', { ascending: false }).order('name');

        if (error) {
          if (process.env.NODE_ENV === 'development') {
            logHallWarning('Supabase query error in getAllHalls, falling back to sample halls:', error.message);
          }
        } else if (data && data.length > 0) {
          let results: Hall[] = (data as unknown as DatabaseHallRow[]).map(mapHallFromDb);

          if (filters?.search && filters.search.trim() !== '') {
            const q = filters.search.toLowerCase().trim();
            results = results.filter(
              (h) =>
                h.name.toLowerCase().includes(q) ||
                h.description.toLowerCase().includes(q) ||
                h.location.toLowerCase().includes(q) ||
                h.neighborhood.toLowerCase().includes(q) ||
                h.amenities.some((a) => a.toLowerCase().includes(q))
            );
          }

          if (filters?.amenities && filters.amenities.length > 0) {
            results = results.filter((h) =>
              filters.amenities!.every((req) =>
                h.amenities.some((a) => a.toLowerCase().includes(req.toLowerCase()))
              )
            );
          }

          return results;
        }
      }
    } catch (err) {
      logHallWarning('Failed to reach Supabase in getAllHalls:', err);
    }
  }

  // Fallback: active halls from runtime store
  let results = runtimeHalls.filter((h) => h.isActive);

  if (!filters) {
    return results;
  }

  const { search, minCapacity, maxCapacity, amenities } = filters;

  if (search && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    results = results.filter(
      (hall) =>
        hall.name.toLowerCase().includes(q) ||
        hall.description.toLowerCase().includes(q) ||
        hall.location.toLowerCase().includes(q) ||
        hall.neighborhood.toLowerCase().includes(q) ||
        hall.amenities.some((a) => a.toLowerCase().includes(q))
    );
  }

  if (minCapacity !== undefined && minCapacity > 0) {
    results = results.filter((hall) => hall.capacity >= minCapacity);
  }

  if (maxCapacity !== undefined && maxCapacity > 0) {
    results = results.filter((hall) => hall.capacity <= maxCapacity);
  }

  if (amenities && amenities.length > 0) {
    results = results.filter((hall) =>
      amenities.every((reqAmenity) =>
        hall.amenities.some((a) => a.toLowerCase().includes(reqAmenity.toLowerCase()))
      )
    );
  }

  return results;
}

/**
 * Retrieve all halls for administrative management, including archived ones.
 */
export async function getAllHallsAdmin(includeArchived = true): Promise<Hall[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createPublicClient();
      if (supabase) {
        let query = supabase.from('halls').select('*');
        if (!includeArchived) {
          query = query.eq('is_active', true);
        }
        const { data, error } = await query.order('name');
        if (!error && data && data.length > 0) {
          return (data as unknown as DatabaseHallRow[]).map(mapHallFromDb);
        }
      }
    } catch (err) {
      logHallWarning('Supabase getAllHallsAdmin failed, using runtime store:', err);
    }
  }

  if (!includeArchived) {
    return runtimeHalls.filter((h) => h.isActive);
  }
  return [...runtimeHalls];
}

/**
 * Retrieve a specific hall by its unique URL slug.
 */
export async function getHallBySlug(slug: string): Promise<Hall | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createPublicClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('halls')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (error) {
          logHallWarning(`Supabase error fetching hall slug "${slug}":`, error.message);
        } else if (data) {
          return mapHallFromDb(data as unknown as DatabaseHallRow);
        }
      }
    } catch (err) {
      logHallWarning('Error reading hall from Supabase:', err);
    }
  }

  const hall = runtimeHalls.find((h) => h.slug === slug);
  return hall || null;
}

/**
 * Retrieve a specific hall by its ID.
 */
export async function getHallById(id: string): Promise<Hall | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createPublicClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('halls')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          logHallWarning(`Supabase error fetching hall ID "${id}":`, error.message);
        } else if (data) {
          return mapHallFromDb(data as unknown as DatabaseHallRow);
        }
      }
    } catch (err) {
      logHallWarning('Error reading hall from Supabase:', err);
    }
  }

  const hall = runtimeHalls.find((h) => h.id === id);
  return hall || null;
}

/**
 * Administrative action: Create a new community facility.
 */
export async function createHall(data: Partial<Hall>): Promise<Hall> {
  const slug =
    data.slug?.trim() ||
    (data.name || 'new-hall')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const id = `hall-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

  const newHall: Hall = {
    id,
    slug,
    name: data.name?.trim() || 'Community Facility',
    tagline: data.tagline?.trim() || '',
    description: data.description?.trim() || '',
    hourlyRate: Number(data.hourlyRate) || 50,
    capacity: Number(data.capacity) || 100,
    location: data.location?.trim() || 'Central District',
    address: data.address?.trim() || 'Civic Center Way',
    neighborhood: data.neighborhood?.trim() || 'Downtown',
    amenities: Array.isArray(data.amenities) ? data.amenities : [],
    images: data.images && data.images.length > 0 ? data.images : [
      {
        url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
        alt: data.name || 'Facility View',
      },
    ],
    featured: Boolean(data.featured),
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    rulesAndPolicies: data.rulesAndPolicies || [
      'Standard municipal quiet hours apply after 11:00 PM.',
      'Facility key return required by 9:00 AM next business day.',
    ],
    operatingHours: data.operatingHours || {
      open: '08:00',
      close: '22:00',
      days: 'Monday through Sunday',
    },
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { error } = await supabase.from('halls').insert({
          id: newHall.id,
          slug: newHall.slug,
          name: newHall.name,
          tagline: newHall.tagline,
          description: newHall.description,
          hourly_rate: newHall.hourlyRate,
          capacity: newHall.capacity,
          location: newHall.location,
          address: newHall.address,
          neighborhood: newHall.neighborhood,
          amenities: newHall.amenities,
          images: newHall.images,
          featured: newHall.featured,
          is_active: newHall.isActive,
          rules_and_policies: newHall.rulesAndPolicies,
          operating_hours: newHall.operatingHours,
        });

        if (error) {
          logHallWarning('Failed to insert hall into Supabase, saving to runtime store:', error.message);
        }
      }
    } catch (err) {
      logHallWarning('Supabase createHall error:', err);
    }
  }

  runtimeHalls.unshift(newHall);
  return newHall;
}

/**
 * Administrative action: Update an existing community facility.
 */
export async function updateHall(id: string, updates: Partial<Hall>): Promise<Hall | null> {
  const index = runtimeHalls.findIndex((h) => h.id === id);
  if (index === -1) {
    return null;
  }

  const existing = runtimeHalls[index];
  const updatedHall: Hall = {
    ...existing,
    ...updates,
    hourlyRate: updates.hourlyRate !== undefined ? Number(updates.hourlyRate) : existing.hourlyRate,
    capacity: updates.capacity !== undefined ? Number(updates.capacity) : existing.capacity,
  };

  runtimeHalls[index] = updatedHall;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const payload: Record<string, unknown> = {};
        if (updates.name) payload.name = updates.name;
        if (updates.tagline) payload.tagline = updates.tagline;
        if (updates.description) payload.description = updates.description;
        if (updates.hourlyRate !== undefined) payload.hourly_rate = Number(updates.hourlyRate);
        if (updates.capacity !== undefined) payload.capacity = Number(updates.capacity);
        if (updates.location) payload.location = updates.location;
        if (updates.address) payload.address = updates.address;
        if (updates.neighborhood) payload.neighborhood = updates.neighborhood;
        if (updates.amenities) payload.amenities = updates.amenities;
        if (updates.images) payload.images = updates.images;
        if (updates.featured !== undefined) payload.featured = updates.featured;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;
        if (updates.rulesAndPolicies) payload.rules_and_policies = updates.rulesAndPolicies;
        if (updates.operatingHours) payload.operating_hours = updates.operatingHours;

        await supabase.from('halls').update(payload).eq('id', id);
      }
    } catch (err) {
      logHallWarning('Supabase updateHall error:', err);
    }
  }

  return updatedHall;
}

/**
 * Administrative action: Archive or unarchive a facility.
 * Preserves historical booking records while removing it from public reservation forms.
 */
export async function archiveHall(id: string, archive: boolean): Promise<Hall | null> {
  return updateHall(id, { isActive: !archive });
}

/**
 * Return all distinct amenities across halls.
 */
export function getAllAmenities(halls?: Hall[]): string[] {
  const targetHalls = halls && halls.length > 0 ? halls : runtimeHalls;
  const set = new Set<string>();
  for (const hall of targetHalls) {
    for (const amenity of hall.amenities) {
      set.add(amenity);
    }
  }
  return Array.from(set).sort();
}

/**
 * Return all distinct neighborhoods across halls.
 */
export function getAllNeighborhoods(halls?: Hall[]): string[] {
  const targetHalls = halls && halls.length > 0 ? halls : runtimeHalls;
  const set = new Set<string>();
  for (const hall of targetHalls) {
    set.add(hall.neighborhood);
  }
  return Array.from(set).sort();
}
