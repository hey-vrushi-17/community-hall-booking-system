import { Hall, HallFilters } from '@/types';
import { SAMPLE_HALLS } from '@/lib/data/sample-halls';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createPublicClient } from '@/lib/supabase/server';
import { mapHallFromDb, DatabaseHallRow } from '@/lib/supabase/types';

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
 * Retrieve all active civic halls, optionally filtered by criteria.
 * Reads from Supabase Postgres when configured; falls back to isolated sample dataset.
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
          console.warn('Supabase query error in getAllHalls, falling back to sample halls:', error.message);
        } else if (data && data.length > 0) {
          let results: Hall[] = (data as unknown as DatabaseHallRow[]).map(mapHallFromDb);

          // In-memory text search filtering for rich multi-field search
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
      console.warn('Failed to reach Supabase in getAllHalls:', err);
    }
  }

  // Development sample fallback
  let results = [...SAMPLE_HALLS].filter((h) => h.isActive);

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
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.warn(`Supabase error fetching hall slug "${slug}":`, error.message);
        } else if (data) {
          return mapHallFromDb(data as unknown as DatabaseHallRow);
        }
      }
    } catch (err) {
      console.warn('Error reading hall from Supabase:', err);
    }
  }

  const hall = SAMPLE_HALLS.find((h) => h.slug === slug && h.isActive);
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
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.warn(`Supabase error fetching hall ID "${id}":`, error.message);
        } else if (data) {
          return mapHallFromDb(data as unknown as DatabaseHallRow);
        }
      }
    } catch (err) {
      console.warn('Error reading hall from Supabase:', err);
    }
  }

  const hall = SAMPLE_HALLS.find((h) => h.id === id && h.isActive);
  return hall || null;
}

/**
 * Return all distinct amenities across halls.
 */
export function getAllAmenities(halls?: Hall[]): string[] {
  const targetHalls = halls && halls.length > 0 ? halls : SAMPLE_HALLS;
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
  const targetHalls = halls && halls.length > 0 ? halls : SAMPLE_HALLS;
  const set = new Set<string>();
  for (const hall of targetHalls) {
    set.add(hall.neighborhood);
  }
  return Array.from(set).sort();
}
