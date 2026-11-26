import { APP_TIMEZONE, APP_TIMEZONE_LABEL } from '@/lib/config/site-config';

/**
 * Timezone Utilities
 *
 * Domain rule: Store all timestamps in UTC (TIMESTAMPTZ / ISO-8601 Z) and
 * display/interpret wall-clock schedules in the configured local timezone.
 */

function getTimeZoneOffsetMs(utcDate: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(utcDate);
  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      lookup[part.type] = part.value;
    }
  }

  const hour = lookup.hour === '24' ? '00' : lookup.hour;
  const asUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(hour),
    Number(lookup.minute),
    Number(lookup.second)
  );

  return asUtc - utcDate.getTime();
}

/**
 * Convert a wall-clock date (YYYY-MM-DD) and time (HH:MM) in the configured
 * local timezone into a UTC Date.
 */
export function zonedLocalToUtcDate(
  dateStr: string,
  timeStr: string,
  timeZone: string = APP_TIMEZONE
): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);

  // Initial UTC guess
  const utcGuessMs = Date.UTC(y, m - 1, d, hh, mm, 0, 0);
  const guessDate = new Date(utcGuessMs);
  const offset1 = getTimeZoneOffsetMs(guessDate, timeZone);
  const corrected = new Date(utcGuessMs - offset1);
  // Re-evaluate once to handle DST transitions cleanly
  const offset2 = getTimeZoneOffsetMs(corrected, timeZone);
  if (offset2 !== offset1) {
    return new Date(utcGuessMs - offset2);
  }
  return corrected;
}

export function zonedLocalToUtcIso(
  dateStr: string,
  timeStr: string,
  timeZone: string = APP_TIMEZONE
): string {
  return zonedLocalToUtcDate(dateStr, timeStr, timeZone).toISOString();
}

export function formatDateInAppTz(
  iso: string,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  },
  timeZone: string = APP_TIMEZONE
): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      ...options,
      timeZone,
    });
  } catch {
    return iso;
  }
}

export function formatTimeInAppTz(
  iso: string,
  timeZone: string = APP_TIMEZONE
): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone,
    });
  } catch {
    return iso;
  }
}

export function formatDateTimeInAppTz(
  iso: string,
  timeZone: string = APP_TIMEZONE
): string {
  return `${formatDateInAppTz(iso, undefined, timeZone)} • ${formatTimeInAppTz(iso, timeZone)}`;
}

export function getDatePartInAppTz(
  iso: string,
  timeZone: string = APP_TIMEZONE
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));

  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  return `${map.year}-${map.month}-${map.day}`;
}

export function getTimePartInAppTz(
  iso: string,
  timeZone: string = APP_TIMEZONE
): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));

  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  const hh = map.hour === '24' ? '00' : map.hour;
  return `${hh}:${map.minute}`;
}

export function getAppTodayDateString(timeZone: string = APP_TIMEZONE): string {
  return getDatePartInAppTz(new Date().toISOString(), timeZone);
}

export function getTimezoneLabel(): string {
  return APP_TIMEZONE_LABEL;
}
