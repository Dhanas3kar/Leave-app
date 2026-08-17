export function isValidDateRange(start: Date, end: Date): boolean {
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  return start <= end;
}

export function calculateLeaveDays(start: Date, end: Date): number {
  // Strip time components to UTC midnight
  const s = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const e = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
}
