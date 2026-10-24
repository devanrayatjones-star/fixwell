// Works out which start times a customer can pick. Pure functions (no
// database access) so they're easy to test.
import { MIN_NOTICE_HOURS, SLOT_INTERVAL_MINUTES } from "./config";
import { addDays, isoWeekday, londonToInstant, parseTime } from "./time";

export type DayHours = { start: string; end: string };
/** ISO weekday "1"–"7" → working hours. Missing day = not working. */
export type WorkingHours = Partial<Record<string, DayHours>>;
export type Busy = { start: Date; end: Date };
export type Slot = { start: string; end: string; label: string };

/** A job's estimated hours, rounded up to the next half hour, in minutes. */
export function jobDurationMinutes(estimatedHours: number): number {
  return Math.ceil((Number(estimatedHours) * 60) / 30) * 30;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function slotsForDay(opts: {
  date: string;
  workingHours: WorkingHours;
  durationMinutes: number;
  busy: Busy[];
  daysOff: Set<string>;
  now?: Date;
}): Slot[] {
  const { date, workingHours, durationMinutes, busy, daysOff } = opts;
  const now = opts.now ?? new Date();
  if (daysOff.has(date)) return [];
  const hours = workingHours[String(isoWeekday(date))];
  if (!hours) return [];

  const open = parseTime(hours.start);
  const close = parseTime(hours.end);
  const earliest = now.getTime() + MIN_NOTICE_HOURS * 60 * 60 * 1000;
  const slots: Slot[] = [];

  for (let t = open; t + durationMinutes <= close; t += SLOT_INTERVAL_MINUTES) {
    const start = londonToInstant(date, t);
    const end = londonToInstant(date, t + durationMinutes);
    if (start.getTime() < earliest) continue;
    const clash = busy.some((b) => start < b.end && b.start < end);
    if (clash) continue;
    slots.push({
      start: start.toISOString(),
      end: end.toISOString(),
      label: `${pad(Math.floor(t / 60))}:${pad(t % 60)}`,
    });
  }
  return slots;
}

export function slotsForRange(opts: {
  from: string;
  days: number;
  workingHours: WorkingHours;
  durationMinutes: number;
  busy: Busy[];
  daysOff: Set<string>;
  now?: Date;
}): { date: string; slots: Slot[] }[] {
  const out: { date: string; slots: Slot[] }[] = [];
  for (let i = 0; i < opts.days; i++) {
    const date = addDays(opts.from, i);
    out.push({ date, slots: slotsForDay({ ...opts, date }) });
  }
  return out;
}

/** Validates the working-hours JSON a tradesperson saves. */
export function isValidWorkingHours(value: unknown): value is WorkingHours {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  for (const [day, hours] of Object.entries(value as Record<string, unknown>)) {
    if (!/^[1-7]$/.test(day)) return false;
    const h = hours as DayHours;
    if (!h || !/^\d{2}:\d{2}$/.test(h.start) || !/^\d{2}:\d{2}$/.test(h.end)) return false;
    if (parseTime(h.end) <= parseTime(h.start)) return false;
  }
  return true;
}

export const WEEKDAYS = [
  { iso: "1", label: "Monday", short: "Mon" },
  { iso: "2", label: "Tuesday", short: "Tue" },
  { iso: "3", label: "Wednesday", short: "Wed" },
  { iso: "4", label: "Thursday", short: "Thu" },
  { iso: "5", label: "Friday", short: "Fri" },
  { iso: "6", label: "Saturday", short: "Sat" },
  { iso: "7", label: "Sunday", short: "Sun" },
] as const;
