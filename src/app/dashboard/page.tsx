import { requireTradesperson } from "@/lib/auth";
import { formatHours, formatPence, formatSlot } from "@/lib/format";
import { db } from "@/lib/supabase/admin";
import { isoDaysAgo, isPast } from "@/lib/time";
import { STATUS_LABELS, type Booking } from "@/lib/types";
import { BookingActions } from "./booking-actions";

export default async function DashboardBookingsPage() {
  const tp = await requireTradesperson();
  const since = isoDaysAgo(60);
  const { data } = await db()
    .from("bookings")
    .select("*")
    .eq("tradesperson_id", tp.id)
    .or(`status.in.(pending,accepted),starts_at.gte.${since}`)
    .order("starts_at", { ascending: true })
    .limit(300);
  const bookings = (data ?? []) as Booking[];

  const pending = bookings.filter((b) => b.status === "pending");
  const toComplete = bookings.filter((b) => b.status === "accepted" && isPast(b.starts_at));
  const upcoming = bookings.filter((b) => b.status === "accepted" && !isPast(b.starts_at));
  const past = bookings.filter((b) => !["pending", "accepted"].includes(b.status)).reverse();

  return (
    <div className="grid gap-8">
      <Section title="Needs your response" empty="No new requests." bookings={pending} highlight />
      {toComplete.length > 0 && <Section title="Mark as complete" empty="" bookings={toComplete} />}
      <Section title="Upcoming" empty="No confirmed bookings coming up." bookings={upcoming} />
      <Section title="Recent history" empty="Nothing yet." bookings={past} />
    </div>
  );
}

function Section({ title, empty, bookings, highlight }: { title: string; empty: string; bookings: Booking[]; highlight?: boolean }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-lg font-bold">
        {title}
        {bookings.length > 0 && <span className={`badge ${highlight ? "bg-accent-600 text-white" : "bg-slate-200 text-slate-700"}`}>{bookings.length}</span>}
      </h2>
      {bookings.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="mt-3 grid gap-3">
          {bookings.map((b) => (
            <BookingCard key={b.id} b={b} />
          ))}
        </ul>
      )}
    </section>
  );
}

function BookingCard({ b }: { b: Booking }) {
  return (
    <li className={`card p-4 sm:p-5 ${b.status === "pending" ? "border-accent-500" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold">{formatSlot(b.starts_at, b.ends_at)}</p>
          <p className="text-sm text-slate-600">
            {b.service_name} · about {formatHours(b.estimated_hours)} · {formatPence(b.estimate_pence)} estimate
          </p>
        </div>
        <span className="badge bg-slate-100 text-slate-700">
          {STATUS_LABELS[b.status]} · {b.reference}
        </span>
      </div>
      {b.customer_name && (
        <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[120px_1fr]">
          <dt className="text-slate-500">Customer</dt>
          <dd>{b.customer_name}</dd>
          <dt className="text-slate-500">Phone</dt>
          <dd>
            <a href={`tel:${b.customer_phone}`} className="text-brand-700 underline">
              {b.customer_phone}
            </a>
          </dd>
          <dt className="text-slate-500">Address</dt>
          <dd>
            {b.address}, {b.postcode}
          </dd>
          {b.vehicle_reg && (
            <>
              <dt className="text-slate-500">Vehicle reg</dt>
              <dd className="font-mono">{b.vehicle_reg}</dd>
            </>
          )}
          <dt className="text-slate-500">Problem</dt>
          <dd className="whitespace-pre-line">{b.problem_description}</dd>
          {b.early_start_requested && (
            <>
              <dt className="text-slate-500">Early start</dt>
              <dd>Customer asked for work to start within the 14-day cancellation period</dd>
            </>
          )}
          {(b.decline_reason || b.cancel_reason) && (
            <>
              <dt className="text-slate-500">Note</dt>
              <dd>
                {b.cancel_reason ?? b.decline_reason}
                {b.cancelled_by ? ` (cancelled by ${b.cancelled_by})` : ""}
              </dd>
            </>
          )}
        </dl>
      )}
      <BookingActions id={b.id} status={b.status} started={isPast(b.starts_at)} />
    </li>
  );
}
