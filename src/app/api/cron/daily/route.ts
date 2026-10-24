import { NextResponse, type NextRequest } from "next/server";
import { RETENTION_MONTHS } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { bookingExpiredCustomer } from "@/lib/emails";
import { db } from "@/lib/supabase/admin";
import type { Booking, Tradesperson } from "@/lib/types";

// Run once a day by Vercel Cron (see vercel.json). Vercel sends
// "Authorization: Bearer <CRON_SECRET>" so nobody else can trigger it.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // 1. Requests the tradesperson never answered before the appointment time.
  const { data: expired, error: expireError } = await db()
    .from("bookings")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("starts_at", new Date().toISOString())
    .select("*, tradespeople(*)");
  if (expireError) console.error("Expiring bookings failed", expireError);
  for (const row of expired ?? []) {
    const { tradespeople: tp, ...booking } = row as Booking & { tradespeople: Tradesperson };
    await sendEmail(booking.customer_email, bookingExpiredCustomer(booking, tp));
  }

  // 2. Delete customer personal details from finished bookings after the retention period.
  const { data: anonymised, error: anonError } = await db().rpc("anonymise_old_bookings", { retention: `${RETENTION_MONTHS} months` });
  if (anonError) console.error("Anonymising bookings failed", anonError);

  return NextResponse.json({ expired: expired?.length ?? 0, anonymised: anonymised ?? 0 });
}
