/**
 * Calculates start/end date range from a `days` parameter.
 *
 *   days=0  → Today (midnight today → end of today)
 *   days=1  → Yesterday only (midnight yesterday → midnight today)
 *   days=7  → Last 7 days (7 days ago → now)
 */
export function getDateRange(days: number): { start: string; end: string | null } {
  const now = new Date();

  if (days === 0) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end: null };
  }

  if (days === 1) {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(0, 0, 0, 0);

    return { start: start.toISOString(), end: end.toISOString() };
  }

  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return { start: start.toISOString(), end: null };
}
