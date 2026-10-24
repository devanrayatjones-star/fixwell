// Business settings you may want to tweak. Secrets live in environment
// variables (see .env.example), never in this file.

export const SITE_NAME = "Fixwell";

/** Public address of the site, used in email links. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Town or area you're launching in, shown on the home page. */
export const SERVICE_AREA = process.env.NEXT_PUBLIC_SERVICE_AREA || "your area";

/** Customers can cancel online up to this many hours before the appointment. */
export const CANCELLATION_CUTOFF_HOURS = 24;

/** How far ahead customers can book. */
export const BOOKING_WINDOW_DAYS = 42;

/** Earliest a slot can be booked, measured from now. */
export const MIN_NOTICE_HOURS = 2;

/** Gap between offered start times, in minutes. */
export const SLOT_INTERVAL_MINUTES = 60;

/** Customer personal details are cleared this many months after a finished booking. */
export const RETENTION_MONTHS = 12;

/** Max upload size (Vercel's request limit is 4.5 MB). */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Show the clearly-labelled test tradespeople? Set SHOW_TEST_DATA=false before launch. */
export const SHOW_TEST_DATA = process.env.SHOW_TEST_DATA !== "false";

/** Email addresses allowed into /admin. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Where copies of booking and sign-up notifications are sent (you). */
export function notifyEmail(): string | null {
  return process.env.NOTIFY_EMAIL?.trim() || adminEmails()[0] || null;
}
