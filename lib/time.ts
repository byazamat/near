// The app is for a single Tashkent-based household; all "today"/"this month"
// boundaries should follow the Tashkent calendar day (UTC+5), not the UTC day
// or the host process's local timezone — those two can each disagree with
// Tashkent by several hours and silently shift counts by a day.
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

function tashkentParts(date: Date) {
  const shifted = new Date(date.getTime() + TASHKENT_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(), // 0-based
    day: shifted.getUTCDate(),
  };
}

export function tashkentYear(date: Date = new Date()): number {
  return tashkentParts(date).year;
}

export function tashkentYearMonth(date: Date = new Date()): { year: number; month: number } {
  const { year, month } = tashkentParts(date);
  return { year, month };
}

export function tashkentDateString(date: Date = new Date()): string {
  const { year, month, day } = tashkentParts(date);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function tashkentDayRange(date: Date = new Date()): { start: Date; end: Date } {
  const { year, month, day } = tashkentParts(date);
  const start = new Date(Date.UTC(year, month, day) - TASHKENT_OFFSET_MS);
  const end = new Date(Date.UTC(year, month, day + 1) - TASHKENT_OFFSET_MS);
  return { start, end };
}

export function tashkentMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  const { year, month } = tashkentParts(date);
  const start = new Date(Date.UTC(year, month, 1) - TASHKENT_OFFSET_MS);
  const end = new Date(Date.UTC(year, month + 1, 1) - TASHKENT_OFFSET_MS);
  return { start, end };
}
