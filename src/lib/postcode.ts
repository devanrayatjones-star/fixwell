// UK postcode helpers.

// Standard UK postcode shape, e.g. "SW1A 1AA", "M1 1AE", "BS16 2AB".
const FULL_POSTCODE = /^([A-Z]{1,2}[0-9][A-Z0-9]?) ?([0-9][A-Z]{2})$/;
// Just the first half, e.g. "BS16" ("outward code" / postcode district).
const OUTWARD = /^[A-Z]{1,2}[0-9][A-Z0-9]?$/;
// Just the letters, e.g. "BS" (postcode area).
const AREA = /^[A-Z]{1,2}$/;

function clean(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** "bs1 4dj" → "BS1 4DJ", or null if it isn't a valid UK postcode shape. */
export function normalisePostcode(input: string): string | null {
  const c = clean(input);
  if (c.length < 5 || c.length > 7) return null;
  const formatted = `${c.slice(0, -3)} ${c.slice(-3)}`;
  return FULL_POSTCODE.test(formatted) ? formatted : null;
}

/** "BS1 4DJ" → "BS1" */
export function outwardCode(postcode: string): string {
  return postcode.split(" ")[0];
}

/** Letters at the start, e.g. "BS16" → "BS" */
export function postcodeArea(outward: string): string {
  return outward.match(/^[A-Z]{1,2}/)?.[0] ?? "";
}

/**
 * Turns whatever a customer typed in the "where" box into a district to
 * match on: a full postcode or a district ("BS16"). Returns null for town names.
 */
export function districtFromSearch(input: string): string | null {
  const full = normalisePostcode(input);
  if (full) return outwardCode(full);
  const c = clean(input);
  return OUTWARD.test(c) ? c : null;
}

/** Tidies a tradesperson's list of covered districts/areas: "bs1, bs2 BS16" → ["BS1","BS2","BS16"]. */
export function parsePostcodeAreas(input: string): { areas: string[]; invalid: string[] } {
  const parts = input
    .toUpperCase()
    .split(/[\s,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const areas: string[] = [];
  const invalid: string[] = [];
  for (const p of parts) {
    if (OUTWARD.test(p) || AREA.test(p)) {
      if (!areas.includes(p)) areas.push(p);
    } else {
      invalid.push(p);
    }
  }
  return { areas, invalid };
}

/**
 * Does a tradesperson cover this district? "BS1" matches "BS1" exactly
 * (not "BS16"); a bare area like "BS" covers every BS district.
 */
export function coversDistrict(covered: string[], district: string): boolean {
  const area = postcodeArea(district);
  return covered.some((c) => c === district || (AREA.test(c) && c === area));
}

/**
 * Asks postcodes.io (free, no key needed) whether a postcode actually exists.
 * If the lookup service is unreachable we accept any correctly-shaped postcode
 * rather than block the booking.
 */
export async function postcodeExists(postcode: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}/validate`,
      { signal: AbortSignal.timeout(3000), cache: "no-store" },
    );
    if (!res.ok) return true;
    const body = (await res.json()) as { result?: boolean };
    return body.result !== false;
  } catch {
    return true;
  }
}
