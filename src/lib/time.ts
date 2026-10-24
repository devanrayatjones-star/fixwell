// Calendar helpers that work in UK time (Europe/London), whatever time zone
// the server runs in. Dates are passed around as "YYYY-MM-DD" strings.
import { TZDate } from "@date-fns/tz";
import { TZ } from "./format";

const ymd = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The UK calendar date of an instant, as "YYYY-MM-DD". */
export function londonDate(d: Date = new Date()): string {
  return ymd.format(d);
}

export function isValidDateString(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

/** "HH:MM" → minutes after midnight. */
export function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** The real instant for a UK wall-clock time on a UK date (handles BST/GMT). */
export function londonToInstant(date: string, minutesAfterMidnight: number): Date {
  const [y, m, d] = date.split("-").map(Number);
  const tz = new TZDate(y, m - 1, d, Math.floor(minutesAfterMidnight / 60), minutesAfterMidnight % 60, TZ);
  return new Date(tz.getTime());
}

/** Start and end instants of a UK calendar day. */
export function londonDayRange(date: string): { start: Date; end: Date } {
  return { start: londonToInstant(date, 0), end: londonToInstant(addDays(date, 1), 0) };
}

/** Hours from now until an instant (negative if it's in the past). */
export function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / 3_600_000;
}

export function isPast(iso: string): boolean {
  return new Date(iso).getTime() <= Date.now();
}

export function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}
