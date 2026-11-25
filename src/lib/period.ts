export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const YEARS = ['2024', '2025', '2026', '2027'] as const;

export function getPeriodForDate(date = new Date()): { month: string; year: string } {
  const month = MONTHS[date.getMonth()] ?? 'November';
  const yearCandidate = String(date.getFullYear());
  const year = YEARS.includes(yearCandidate as (typeof YEARS)[number])
    ? yearCandidate
    : '2026';

  return { month, year };
}
