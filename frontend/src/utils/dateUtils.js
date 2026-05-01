/**
 * Centralized date utilities.
 *
 * The backend stores and serializes LocalDateTime as UTC but historically
 * emitted strings without a timezone marker (e.g. "2025-05-01T14:30:00").
 * JavaScript's Date constructor treats such strings as *local* time,
 * causing an offset equal to the browser's UTC offset.
 *
 * After the JacksonConfig backend fix the strings now carry a trailing Z
 * ("2025-05-01T14:30:00Z"). The parseDate() helper below handles both
 * formats for backwards compatibility.
 *
 * Rule:
 *   Store / transport in UTC → display in browser's local timezone via Intl APIs.
 */

/**
 * Parse a server timestamp safely.
 * Appends 'Z' if no timezone information is present so the browser
 * always interprets the value as UTC.
 */
function parseDate(str) {
  if (!str) return null
  // Already has timezone info (ends with Z or ±HH:MM)
  const normalized = /Z$|[+-]\d{2}:?\d{2}$/.test(str) ? str : str + 'Z'
  const d = new Date(normalized)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Format a server timestamp as a local date string.
 * Default locale: 'en-GB' → "01 May 2025"
 */
export function formatLocalDate(utcStr, locale = 'en-GB', opts = {}) {
  const d = parseDate(utcStr)
  if (!d) return '—'
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', ...opts })
}

/**
 * Format a server timestamp as a local time string.
 * Default: 12-hour, e.g. "2:30 PM"
 */
export function formatLocalTime(utcStr, locale = 'en-US', hour12 = true) {
  const d = parseDate(utcStr)
  if (!d) return '—'
  return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12 })
}

/**
 * Format a server timestamp as a full local date-time string.
 * Default: "May 1, 2025 at 02:30 PM"
 */
export function formatLocalDateTime(utcStr, locale = 'en-US', opts = {}) {
  const d = parseDate(utcStr)
  if (!d) return '—'
  return d.toLocaleString(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    ...opts,
  })
}

/**
 * Format a server timestamp as a compact date-time.
 * e.g. "May 1, 2025, 2:30 PM"
 */
export function formatShortDateTime(utcStr, locale = 'en-US') {
  const d = parseDate(utcStr)
  if (!d) return '—'
  return d.toLocaleString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

/**
 * Return a relative time string ("2m ago", "3h ago", "4d ago").
 * Falls back to a formatted date for older timestamps.
 */
export function timeAgo(utcStr) {
  const d = parseDate(utcStr)
  if (!d) return '—'
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatLocalDate(utcStr)
}

/**
 * Parse a server timestamp and return a plain Date object.
 * Useful when you need the raw Date for custom formatting.
 */
export function parseServerDate(str) {
  return parseDate(str)
}
