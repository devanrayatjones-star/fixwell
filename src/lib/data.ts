// Read-only queries used by the public pages.
import "server-only";
import { connection } from "next/server";
import { jobDurationMinutes, slotsForRange } from "./availability";
import { BOOKING_WINDOW_DAYS, SHOW_TEST_DATA } from "./config";
import { coversDistrict, districtFromSearch } from "./postcode";
import { db } from "./supabase/admin";
import { addDays, isValidDateString, londonDate, londonDayRange } from "./time";
import { isTradeId } from "./trades";
import { PUBLIC_TRADESPERSON_COLUMNS, type PublicTradesperson, type Review, type Service } from "./types";

export type RatingSummary = { count: number; average: number | null };
export type TradespersonCard = PublicTradesperson & { services: Service[]; rating: RatingSummary };

function visibleTradespeople() {
  let q = db()
    .from("tradespeople")
    .select(`${PUBLIC_TRADESPERSON_COLUMNS}, services(*)`)
    .eq("status", "approved");
  if (!SHOW_TEST_DATA) q = q.eq("is_test", false);
  return q;
}

async function ratingSummaries(ids: string[]): Promise<Map<string, RatingSummary>> {
  const map = new Map<string, RatingSummary>();
  if (ids.length === 0) return map;
  const { data } = await db().from("reviews").select("tradesperson_id, rating").in("tradesperson_id", ids).eq("hidden", false);
  const grouped = new Map<string, number[]>();
  for (const r of data ?? []) {
    grouped.set(r.tradesperson_id, [...(grouped.get(r.tradesperson_id) ?? []), r.rating]);
  }
  for (const id of ids) {
    const ratings = grouped.get(id) ?? [];
    map.set(id, {
      count: ratings.length,
      average: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
    });
  }
  return map;
}

function sortServices<T extends { services: Service[] }>(tp: T): T {
  tp.services.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  return tp;
}

export async function searchTradespeople(params: { trade?: string; where?: string; job?: string }): Promise<TradespersonCard[]> {
  // connection() tells Next.js to fetch fresh data on every visit rather than at build time.
  await connection();
  let q = visibleTradespeople();
  if (params.trade && isTradeId(params.trade)) q = q.eq("trade", params.trade);
  const { data, error } = await q.order("approved_at", { ascending: true });
  if (error) throw error;

  let results = (data ?? []) as unknown as (PublicTradesperson & { services: Service[] })[];

  const where = params.where?.trim();
  if (where) {
    const district = districtFromSearch(where);
    results = district
      ? results.filter((t) => coversDistrict(t.postcode_areas, district))
      : results.filter((t) => t.base_area.toLowerCase().includes(where.toLowerCase()));
  }

  const job = params.job?.trim().toLowerCase();
  if (job) {
    results = results.filter(
      (t) => t.services.some((s) => s.name.toLowerCase().includes(job) || s.description.toLowerCase().includes(job)) || t.bio.toLowerCase().includes(job),
    );
  }

  const ratings = await ratingSummaries(results.map((t) => t.id));
  // Real tradespeople before test ones.
  results.sort((a, b) => Number(a.is_test) - Number(b.is_test));
  return results.map((t) => sortServices({ ...t, rating: ratings.get(t.id)! }));
}

export async function getPublicTradesperson(slug: string) {
  await connection();
  const { data } = await visibleTradespeople().eq("slug", slug).maybeSingle();
  if (!data) return null;
  const tp = sortServices(data as unknown as PublicTradesperson & { services: Service[] });
  const { data: reviews } = await db()
    .from("reviews")
    .select("id, rating, comment, reviewer_name, created_at")
    .eq("tradesperson_id", tp.id)
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(50);
  const ratings = await ratingSummaries([tp.id]);
  return { ...tp, rating: ratings.get(tp.id)!, reviews: (reviews ?? []) as Pick<Review, "id" | "rating" | "comment" | "reviewer_name" | "created_at">[] };
}

/** Free start times for one job, for each day in the range. */
export async function getAvailability(tradespersonId: string, estimatedHours: number, from: string, days: number) {
  const today = londonDate();
  if (!isValidDateString(from) || from < today) from = today;
  const lastDay = addDays(today, BOOKING_WINDOW_DAYS - 1);
  days = Math.max(1, Math.min(days, BOOKING_WINDOW_DAYS));
  const to = addDays(from, days - 1) > lastDay ? lastDay : addDays(from, days - 1);
  if (from > lastDay) return [];

  const rangeStart = londonDayRange(from).start;
  const rangeEnd = londonDayRange(to).end;

  const [{ data: tp }, { data: bookings }, { data: daysOff }] = await Promise.all([
    db().from("tradespeople").select("working_hours").eq("id", tradespersonId).single(),
    db()
      .from("bookings")
      .select("starts_at, ends_at")
      .eq("tradesperson_id", tradespersonId)
      .in("status", ["pending", "accepted"])
      .lt("starts_at", rangeEnd.toISOString())
      .gt("ends_at", rangeStart.toISOString()),
    db().from("time_off").select("day").eq("tradesperson_id", tradespersonId).gte("day", from).lte("day", to),
  ]);

  const dayCount = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
  return slotsForRange({
    from,
    days: dayCount,
    workingHours: tp?.working_hours ?? {},
    durationMinutes: jobDurationMinutes(estimatedHours),
    busy: (bookings ?? []).map((b) => ({ start: new Date(b.starts_at), end: new Date(b.ends_at) })),
    daysOff: new Set((daysOff ?? []).map((d) => d.day as string)),
  });
}
