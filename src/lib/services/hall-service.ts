import { Hall, HallFilters } from '@/types';
import { SAMPLE_HALLS } from '@/lib/data/sample-halls';
import { isSupabaseConfigured, rethrowNextControlFlowError } from '@/lib/supabase/config';
import { createPublicClient, getTrustedServerClient } from '@/lib/supabase/server';
import { mapHallFromDb, DatabaseHallRow } from '@/lib/supabase/types';

export class DatabaseSetupError extends Error {
  public readonly code: string;
  constructor(message: string, code = 'DATABASE_UNAVAILABLE') {
    super(message);
    this.name = 'DatabaseSetupError';
    this.code = code;
  }
}

export interface SupabaseHealthStatus {
  configured: boolean;
  schemaReady: boolean;
  mode: 'LIVE_SUPABASE' | 'SUPABASE_SCHEMA_PENDING' | 'DEVELOPMENT_SAMPLE_STORE';
  message: string;
}

// Runtime in-memory halls store (used ONLY when Supabase credentials are not configured)
const runtimeHalls: Hall[] = [...SAMPLE_HALLS];

export interface ActorInfo {
  id?: string | null;
  email: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function toNullableUuid(value?: string | null): string | null {
  return value && UUID_REGEX.test(value) ? value : null;
}

export function getDataSourceStatus() {
  const configured = isSupabaseConfigured();
  return {
    isConfigured: configured,
    source: configured ? ('SUPABASE_POSTGRES' as const) : ('DEVELOPMENT_SAMPLE_STORE' as const),
    notice: configured
      ? 'Supabase credentials detected. Live database queries required.'
      : 'Development sample data active (Supabase credentials not configured in environment).',
  };
}

export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      schemaReady: false,
      mode: 'DEVELOPMENT_SAMPLE_STORE',
      message:
        'Development Sample Mode: Supabase environment variables are not set. Sample venues and in-memory state are active for local preview.',
    };
  }

  try {
    const supabase = createPublicClient();
    if (!supabase) {
      return {
        configured: false,
        schemaReady: false,
        mode: 'DEVELOPMENT_SAMPLE_STORE',
        message: 'Supabase client unavailable.',
      };
    }

    const { error } = await supabase.from('halls').select('id').limit(1);
    if (error) {
      return {
        configured: true,
        schemaReady: false,
        mode: 'SUPABASE_SCHEMA_PENDING',
        message: `Supabase project is configured, but database tables could not be queried (${error.code || 'ERROR'}: ${error.message}). Apply the SQL migrations in supabase/migrations/ to initialize the schema.`,
      };
    }

    return {
      configured: true,
      schemaReady: true,
      mode: 'LIVE_SUPABASE',
      message: 'Live Supabase Postgres connection verified with Row Level Security.',
    };
  } catch (err: unknown) {
    rethrowNextControlFlowError(err);
    return {
      configured: true,
      schemaReady: false,
      mode: 'SUPABASE_SCHEMA_PENDING',
      message:
        err instanceof Error
          ? `Unable to reach configured Supabase database: ${err.message}`
          : 'Unable to reach configured Supabase database.',
    };
  }
}

function filterHallsInMemory(halls: Hall[], filters?: HallFilters): Hall[] {
  if (!filters) {
    return halls;
  }

  let results = halls;
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
 * Retrieve active civic halls, optionally filtered by criteria.
 * Public view only returns active halls (is_active = true).
 * When Supabase is configured, database errors throw DatabaseSetupError instead of
 * silently substituting mock data.
 */
export async function getAllHalls(filters?: HallFilters): Promise<Hall[]> {
  if (isSupabaseConfigured()) {
    const supabase = createPublicClient();
    if (!supabase) {
      throw new DatabaseSetupError('Supabase client failed to initialize.');
    }

    let query = supabase.from('halls').select('*').eq('is_active', true);

    if (filters?.minCapacity && filters.minCapacity > 0) {
      query = query.gte('capacity', filters.minCapacity);
    }
    if (filters?.maxCapacity && filters.maxCapacity > 0) {
      query = query.lte('capacity', filters.maxCapacity);
    }

    const { data, error } = await query.order('featured', { ascending: false }).order('name');

    if (error) {
      throw new DatabaseSetupError(
        `Supabase halls query failed (${error.code || 'DB_ERROR'}): ${error.message}`,
        error.code || 'DB_ERROR'
      );
    }

    const results = ((data || []) as unknown as DatabaseHallRow[]).map(mapHallFromDb);
    return filterHallsInMemory(results, { search: filters?.search, amenities: filters?.amenities });
  }

  return filterHallsInMemory(
    runtimeHalls.filter((h) => h.isActive),
    filters
  );
}

/**
 * Safe variant for public Server Components that returns { halls, dbError }
 * so pages render an explicit setup/unavailable state rather than crashing or faking live data.
 */
export async function getAllHallsSafe(filters?: HallFilters): Promise<{
  halls: Hall[];
  dbError: string | null;
}> {
  try {
    const halls = await getAllHalls(filters);
    return { halls, dbError: null };
  } catch (err: unknown) {
    rethrowNextControlFlowError(err);
    return {
      halls: [],
      dbError: err instanceof Error ? err.message : 'Unable to load halls from database.',
    };
  }
}

export async function getAllHallsAdmin(includeArchived = true): Promise<Hall[]> {
  if (isSupabaseConfigured()) {
    const supabase = await getTrustedServerClient();
    if (!supabase) {
      throw new DatabaseSetupError('Supabase server client is unavailable.');
    }

    let query = supabase.from('halls').select('*');
    if (!includeArchived) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query.order('name');
    if (error) {
      throw new DatabaseSetupError(
        `Supabase admin halls query failed (${error.code || 'DB_ERROR'}): ${error.message}`,
        error.code || 'DB_ERROR'
      );
    }
    return ((data || []) as unknown as DatabaseHallRow[]).map(mapHallFromDb);
  }

  if (!includeArchived) {
    return runtimeHalls.filter((h) => h.isActive);
  }
  return [...runtimeHalls];
}

export async function getHallBySlug(slug: string): Promise<Hall | null> {
  if (isSupabaseConfigured()) {
    const supabase = createPublicClient();
    if (!supabase) {
      throw new DatabaseSetupError('Supabase client is unavailable.');
    }

    const { data, error } = await supabase
      .from('halls')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      throw new DatabaseSetupError(
        `Supabase hall lookup failed (${error.code || 'DB_ERROR'}): ${error.message}`,
        error.code || 'DB_ERROR'
      );
    }

    return data ? mapHallFromDb(data as unknown as DatabaseHallRow) : null;
  }

  const hall = runtimeHalls.find((h) => h.slug === slug);
  return hall || null;
}

export async function getHallById(id: string): Promise<Hall | null> {
  if (isSupabaseConfigured()) {
    const supabase = await getTrustedServerClient();
    if (!supabase) {
      throw new DatabaseSetupError('Supabase client is unavailable.');
    }

    const { data, error } = await supabase
      .from('halls')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseSetupError(
        `Supabase hall lookup failed (${error.code || 'DB_ERROR'}): ${error.message}`,
        error.code || 'DB_ERROR'
      );
    }

    return data ? mapHallFromDb(data as unknown as DatabaseHallRow) : null;
  }

  const hall = runtimeHalls.find((h) => h.id === id);
  return hall || null;
}

async function logHallAudit(
  action: string,
  hall: Hall,
  summary: string,
  actor?: ActorInfo,
  metadata?: Record<string, unknown>
) {
  const { recordAuditEvent } = await import('./booking-store');
  await recordAuditEvent({
    actorId: toNullableUuid(actor?.id),
    actorEmail: actor?.email || 'admin@civic.example',
    action,
    entityType: 'Hall',
    entityId: hall.id,
    summary,
    metadata,
  });
}

export async function createHall(data: Partial<Hall>, actor?: ActorInfo): Promise<Hall> {
  const baseSlug =
    data.slug?.trim() ||
    (data.name || 'new-hall')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const suffix = Date.now().toString(36).slice(-4);
  const slug = data.slug?.trim() ? baseSlug : `${baseSlug}-${suffix}`;
  const id = `hall-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

  const newHall: Hall = {
    id,
    slug: data.slug?.trim() || (runtimeHalls.some((h) => h.slug === baseSlug) ? slug : baseSlug),
    name: data.name?.trim() || 'Community Facility',
    tagline: data.tagline?.trim() || '',
    description: data.description?.trim() || '',
    hourlyRate: Number(data.hourlyRate) || 0,
    capacity: Number(data.capacity) || 100,
    location: data.location?.trim() || 'Central District',
    address: data.address?.trim() || 'Civic Center Way',
    neighborhood: data.neighborhood?.trim() || 'Central',
    amenities: Array.isArray(data.amenities) ? data.amenities : [],
    images:
      data.images && data.images.length > 0
        ? data.images
        : [
          {
            url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
            alt: data.name || 'Facility View',
          },
        ],
    featured: Boolean(data.featured),
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    rulesAndPolicies: data.rulesAndPolicies?.length
      ? data.rulesAndPolicies
      : [
        'Standard municipal quiet hours apply after 10:00 PM.',
        'Premises must be cleared cleanly prior to scheduled handover.',
      ],
    operatingHours: data.operatingHours || {
      open: '08:00',
      close: '22:00',
      days: 'Monday through Sunday',
    },
  };

  if (isSupabaseConfigured()) {
    const supabase = await getTrustedServerClient();
    if (!supabase) {
      throw new DatabaseSetupError('Supabase client is unavailable.');
    }

    const { data: inserted, error } = await supabase
      .from('halls')
      .insert({
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
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create hall in Supabase: ${error.message}`);
    }

    const created = mapHallFromDb(inserted as unknown as DatabaseHallRow);
    await logHallAudit(
      'CREATE_HALL',
      created,
      `Created community hall "${created.name}" (capacity ${created.capacity})`,
      actor,
      { slug: created.slug, capacity: created.capacity, location: created.location }
    );
    return created;
  }

  runtimeHalls.unshift(newHall);
  await logHallAudit(
    'CREATE_HALL',
    newHall,
    `Created community hall "${newHall.name}" (capacity ${newHall.capacity})`,
    actor,
    { slug: newHall.slug, capacity: newHall.capacity, location: newHall.location }
  );
  return newHall;
}

export async function updateHall(
  id: string,
  updates: Partial<Hall>,
  actor?: ActorInfo
): Promise<Hall | null> {
  if (isSupabaseConfigured()) {
    const supabase = await getTrustedServerClient();
    if (!supabase) {
      throw new DatabaseSetupError('Supabase client is unavailable.');
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.tagline !== undefined) payload.tagline = updates.tagline;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.hourlyRate !== undefined) payload.hourly_rate = Number(updates.hourlyRate);
    if (updates.capacity !== undefined) payload.capacity = Number(updates.capacity);
    if (updates.location !== undefined) payload.location = updates.location;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.neighborhood !== undefined) payload.neighborhood = updates.neighborhood;
    if (updates.amenities !== undefined) payload.amenities = updates.amenities;
    if (updates.images !== undefined) payload.images = updates.images;
    if (updates.featured !== undefined) payload.featured = updates.featured;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    if (updates.rulesAndPolicies !== undefined) payload.rules_and_policies = updates.rulesAndPolicies;
    if (updates.operatingHours !== undefined) payload.operating_hours = updates.operatingHours;

    const { data, error } = await supabase
      .from('halls')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update hall in Supabase: ${error.message}`);
    }

    if (!data) return null;
    const updated = mapHallFromDb(data as unknown as DatabaseHallRow);
    await logHallAudit(
      'UPDATE_HALL',
      updated,
      `Updated facility "${updated.name}"`,
      actor,
      { updatedFields: Object.keys(updates) }
    );
    return updated;
  }

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
  await logHallAudit(
    'UPDATE_HALL',
    updatedHall,
    `Updated facility "${updatedHall.name}"`,
    actor,
    { updatedFields: Object.keys(updates) }
  );
  return updatedHall;
}

export async function archiveHall(
  id: string,
  archive: boolean,
  actor?: ActorInfo
): Promise<Hall | null> {
  const updated = await updateHall(id, { isActive: !archive }, actor);
  if (updated) {
    await logHallAudit(
      archive ? 'ARCHIVE_HALL' : 'RESTORE_HALL',
      updated,
      archive
        ? `Archived facility "${updated.name}" (hidden from public booking)`
        : `Restored facility "${updated.name}" to active public listings`,
      actor
    );
  }
  return updated;
}

export function getAllAmenities(halls?: Hall[]): string[] {
  const targetHalls = halls || [];
  const set = new Set<string>();
  for (const hall of targetHalls) {
    for (const amenity of hall.amenities) {
      set.add(amenity);
    }
  }
  return Array.from(set).sort();
}

export function getAllNeighborhoods(halls?: Hall[]): string[] {
  const targetHalls = halls || [];
  const set = new Set<string>();
  for (const hall of targetHalls) {
    set.add(hall.neighborhood);
  }
  return Array.from(set).sort();
}
