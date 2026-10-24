import type { Metadata } from "next";
import Link from "next/link";
import { TestBadge } from "@/components/badges";
import { CANCELLATION_CUTOFF_HOURS } from "@/lib/config";
import { formatHours, formatPence, formatSlot } from "@/lib/format";
import { db } from "@/lib/supabase/admin";
import { hoursUntil } from "@/lib/time";
import { tokenMatches } from "@/lib/tokens";
import { tradeInfo } from "@/lib/trades";
import { STATUS_LABELS, type Booking, type Tradesperson } from "@/lib/types";
import { CancelForm, ReviewForm } from "./forms";

export const metadata: Metadata = { title: "Your booking", robots: { index: false, follow: false } };

const STATUS_STYLES: Record<Booking["status"], string> = {
  pending: "bg-amber-100 text-amber-900",
  accepted: "bg-emerald-100 text-emerald-900",
  completed: "bg-brand-100 text-brand-800",
  declined: "bg-slate-200 text-slate-700",
  cancelled: "bg-slate-200 text-slate-700",
  expired: "bg-slate-200 text-slate-700",
};

export default async function BookingPage({ params, searchParams }: PageProps<"/booking/[reference]">) {
  const { reference } = await params;
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  const { data } = await db().from("bookings").select("*, tradespeople(business_name, slug, phone, trade, is_test)").eq("reference", reference.toUpperCase()).maybeSingle();

  if (!data || !tokenMatches(token, data.id)) {
    return (
      <div className="container-page max-w-xl py-16 text-center">
        <h1 className="text-2xl font-bold">Booking not found</h1>
        <p className="mt-2 text-slate-600">Please use the link in your confirmation email. If you&apos;ve lost it, contact the tradesperson directly.</p>
      </div>
    );
  }

  const { tradespeople, ...rest } = data;
  const booking = rest as Booking;
  const tp = tradespeople as Pick<Tradesperson, "business_name" | "slug" | "phone" | "trade" | "is_test">;
  const isNew = sp.new === "1";
  const hoursToGo = hoursUntil(booking.starts_at);
  const active = booking.status === "pending" || booking.status === "accepted";
  const canCancelOnline = active && hoursToGo >= CANCELLATION_CUTOFF_HOURS;

  let hasReview = false;
  if (booking.status === "completed") {
    const { count } = await db().from("reviews").select("id", { count: "exact", head: true }).eq("booking_id", booking.id);
    hasReview = (count ?? 0) > 0;
  }

  return (
    <div className="container-page max-w-2xl py-8">
      {isNew && (
        <div className="mb-6 rounded-2xl bg-emerald-50 p-5 text-emerald-900">
          <h1 className="text-xl font-bold">Booking request sent ✓</h1>
          <p className="mt-1">
            Your reference is <strong>{booking.reference}</strong>. We&apos;ve emailed you a confirmation with a link back to this page. {tp.business_name} will confirm shortly.
          </p>
        </div>
      )}

      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-slate-500">Booking reference</p>
            <p className="font-mono text-2xl font-bold tracking-wide">{booking.reference}</p>
          </div>
          <span className={`badge px-3 py-1 text-sm ${STATUS_STYLES[booking.status]}`}>{STATUS_LABELS[booking.status]}</span>
        </div>
        <TestBadge show={tp.is_test} />

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-[160px_1fr]">
          <dt className="text-slate-500">Tradesperson</dt>
          <dd>
            <Link href={`/t/${tp.slug}`} className="font-semibold hover:underline">
              {tp.business_name}
            </Link>{" "}
            · {tradeInfo(tp.trade).label}
            {booking.status === "accepted" && <span className="block">Phone: {tp.phone}</span>}
          </dd>
          <dt className="text-slate-500">Job</dt>
          <dd>
            {booking.service_name} (about {formatHours(booking.estimated_hours)})
          </dd>
          <dt className="text-slate-500">When</dt>
          <dd className="font-semibold">{formatSlot(booking.starts_at, booking.ends_at)}</dd>
          {booking.address && (
            <>
              <dt className="text-slate-500">Address</dt>
              <dd>
                {booking.address}, {booking.postcode}
              </dd>
            </>
          )}
          {booking.vehicle_reg && (
            <>
              <dt className="text-slate-500">Vehicle</dt>
              <dd className="font-mono">{booking.vehicle_reg}</dd>
            </>
          )}
          <dt className="text-slate-500">Price estimate</dt>
          <dd>
            <span className="text-lg font-bold">{formatPence(booking.estimate_pence)}</span>
            <span className="block text-slate-500">
              {formatPence(booking.callout_fee_pence)} call-out + {formatHours(booking.estimated_hours)} × {formatPence(booking.hourly_rate_pence)}/hr. Parts quoted on the day.
            </span>
          </dd>
          {booking.decline_reason && (
            <>
              <dt className="text-slate-500">Note</dt>
              <dd>{booking.decline_reason}</dd>
            </>
          )}
        </dl>
      </div>

      {booking.status === "cancelled" && (
        <p className="card mt-6 p-5 text-slate-700">
          This booking was cancelled{booking.cancelled_by === "customer" ? " at your request" : booking.cancelled_by === "tradesperson" ? ` by ${tp.business_name}` : ""}. Nothing is owed.{" "}
          <Link href={`/search?trade=${tp.trade}`} className="font-semibold text-accent-600 hover:underline">
            Book again
          </Link>
        </p>
      )}

      {canCancelOnline && (
        <div className="card mt-6 p-5 sm:p-6">
          <h2 className="text-lg font-bold">Need to cancel?</h2>
          <p className="mt-1 text-sm text-slate-600">Cancelling is free up to {CANCELLATION_CUTOFF_HOURS} hours before your appointment.</p>
          <CancelForm reference={booking.reference} token={token} />
        </div>
      )}
      {active && !canCancelOnline && (
        <p className="card mt-6 p-5 text-sm text-slate-600">
          Your appointment is less than {CANCELLATION_CUTOFF_HOURS} hours away. To cancel or change it, please phone {tp.business_name}
          {booking.status === "accepted" ? ` on ${tp.phone}` : ""}.
        </p>
      )}

      {booking.status === "completed" && (
        <div className="card mt-6 p-5 sm:p-6">
          {hasReview ? (
            <p className="text-slate-700">Thanks, you&apos;ve reviewed this job.</p>
          ) : (
            <>
              <h2 className="text-lg font-bold">How did {tp.business_name} do?</h2>
              <ReviewForm reference={booking.reference} token={token} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
