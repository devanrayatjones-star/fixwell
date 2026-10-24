import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

function linkSecret(): string {
  const secret = process.env.BOOKING_LINK_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("Missing BOOKING_LINK_SECRET (at least 16 random characters). See .env.example and the README.");
  }
  return secret;
}

/**
 * The secret in a customer's "view or cancel" link. It's worked out from the
 * booking ID and BOOKING_LINK_SECRET, so nothing extra is stored and any email
 * can include the link. Without the secret, nobody can guess it.
 */
export function bookingToken(bookingId: string): string {
  return createHmac("sha256", linkSecret()).update(`booking:${bookingId}`).digest("base64url").slice(0, 32);
}

export function tokenMatches(token: string | undefined | null, bookingId: string): boolean {
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(bookingToken(bookingId));
  return a.length === b.length && timingSafeEqual(a, b);
}

// No 0/O or 1/I so references are easy to read out over the phone.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** e.g. "FX-7K3M9Q" */
export function newBookingReference(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `FX-${s}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function randomSuffix(): string {
  return randomBytes(3).toString("hex");
}
