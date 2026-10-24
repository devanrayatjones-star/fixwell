import { NextResponse, type NextRequest } from "next/server";
import { BOOKING_WINDOW_DAYS, SHOW_TEST_DATA } from "@/lib/config";
import { getAvailability } from "@/lib/data";
import { db } from "@/lib/supabase/admin";

// GET /api/availability?slug=…&service=…  → free start times for the next few weeks
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  const serviceId = request.nextUrl.searchParams.get("service") ?? "";
  if (!slug || !/^[0-9a-f-]{36}$/.test(serviceId)) {
    return NextResponse.json({ error: "Missing tradesperson or service" }, { status: 400 });
  }

  let q = db().from("tradespeople").select("id, services!inner(id, estimated_hours)").eq("slug", slug).eq("status", "approved").eq("services.id", serviceId);
  if (!SHOW_TEST_DATA) q = q.eq("is_test", false);
  const { data: tp } = await q.maybeSingle();
  const service = tp?.services?.[0];
  if (!tp || !service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const days = await getAvailability(tp.id, Number(service.estimated_hours), "", BOOKING_WINDOW_DAYS);
  return NextResponse.json({ days }, { headers: { "Cache-Control": "no-store" } });
}
