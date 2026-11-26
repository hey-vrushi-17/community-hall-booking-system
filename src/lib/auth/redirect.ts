/**
 * Validates that an internal redirect path is a safe relative path
 * (starts with '/' and does not start with '//' or '/\\').
 */
export function sanitizeRedirectPath(
  path?: string | null,
  fallback = '/my-requests'
): string {
  if (!path) return fallback;
  if (path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')) {
    return path;
  }
  return fallback;
}
