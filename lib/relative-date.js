// Relative timestamps for community post cards —
// reference/spec/03-backend.md §5 (`community-post`): "displayed relative
// ("6d", "3w", then `MMM D`) computed at render time".
//
// The formatter is computed at render time because the page cache is only five
// minutes (03 §5). Beyond that, the date is shown in full so a stale cache can
// only make a relative label slightly old, never wrong.
//
// English only (Q-13), so the month names come from a fixed `en-US` locale.

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;
const WEEKS_BEFORE_DATE = 30;

// A date-only string (`2025-12-18`, what the `date` field stores) is pinned to
// UTC midnight so the server's timezone cannot move it to another day.
function utcDay(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return new Date(Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate()
    ));
  }
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) {
      return null;
    }
    return new Date(Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    ));
  }
  return null;
}

export function relativeDate(date, now = new Date()) {
  const posted = utcDay(date);
  const today = utcDay(now);
  if (!posted || !today) {
    return '';
  }

  // A post scheduled for later reads as "now" rather than as a negative count.
  const days = Math.max(0, Math.round((today - posted) / MS_PER_DAY));

  if (days < DAYS_PER_WEEK) {
    return `${days}d`;
  }
  if (days < WEEKS_BEFORE_DATE) {
    return `${Math.floor(days / DAYS_PER_WEEK)}w`;
  }

  const sameYear = posted.getUTCFullYear() === today.getUTCFullYear();
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
    ...(sameYear ? {} : { year: 'numeric' })
  }).format(posted);
}
