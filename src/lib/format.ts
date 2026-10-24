// UK formatting: pounds, Europe/London time, day/month/year dates.

export const TZ = "Europe/London";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const gbpWhole = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 4500 → "£45", 4550 → "£45.50" */
export function formatPence(pence: number): string {
  return pence % 100 === 0 ? gbpWhole.format(pence / 100) : gbp.format(pence / 100);
}

/** Estimated price: call-out + (hours × hourly rate), rounded to the penny. */
export function estimatePence(calloutPence: number, hourlyPence: number, hours: number): number {
  return calloutPence + Math.round(hours * hourlyPence);
}

export function formatHours(hours: number): string {
  const h = Number(hours);
  return `${h % 1 === 0 ? h.toFixed(0) : h.toFixed(1)} ${h === 1 ? "hour" : "hours"}`;
}

const dateLong = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const dateShort = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const time = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

/** "Saturday 24 October 2026" */
export function formatDateLong(d: Date | string): string {
  return dateLong.format(new Date(d));
}

/** "24/10/2026" */
export function formatDateShort(d: Date | string): string {
  return dateShort.format(new Date(d));
}

/** "09:30" */
export function formatTime(d: Date | string): string {
  return time.format(new Date(d));
}

/** "Saturday 24 October 2026, 09:30–11:00" */
export function formatSlot(start: Date | string, end: Date | string): string {
  return `${formatDateLong(start)}, ${formatTime(start)}–${formatTime(end)}`;
}
