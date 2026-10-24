import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatPence, formatSlot } from "@/lib/format";
import { db } from "@/lib/supabase/admin";
import { STATUS_LABELS, type Booking, type BookingStatus } from "@/lib/types";
import { AdminCancel } from "./cancel";

const FILTERS: (BookingStatus | "all")[] = ["all", "pending", "accepted", "completed", "cancelled", "declined", "expired"];

export default async function AdminBookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = FILTERS.find((f) => f === sp.status) ?? "all";

  let q = db().from("bookings").select("*, tradespeople(business_name, is_test)").order("starts_at", { ascending: false }).limit(200);
  if (status !== "all") q = q.eq("status", status);
  const { data } = await q;
  const rows = (data ?? []) as (Booking & { tradespeople: { business_name: string; is_test: boolean } })[];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f} href={`/admin/bookings?status=${f}`} className={`btn btn-sm rounded-full border ${f === status ? "border-brand-900 bg-brand-900 text-white" : "border-slate-300 bg-white"}`}>
            {f === "all" ? "All" : STATUS_LABELS[f]}
          </Link>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">Showing the latest {rows.length} bookings.</p>
      <ul className="mt-2 grid gap-3">
        {rows.map((b) => (
          <li key={b.id} className="card p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold">
                  {b.reference} · {b.tradespeople.business_name}
                </p>
                <p className="text-slate-600">
                  {formatSlot(b.starts_at, b.ends_at)} · {b.service_name} · {formatPence(b.estimate_pence)}
                </p>
                <p className="text-slate-600">
                  {b.customer_name ?? "(details removed after retention period)"} {b.customer_phone && `· ${b.customer_phone}`} {b.customer_email && `· ${b.customer_email}`}{" "}
                  {b.postcode && `· ${b.postcode}`}
                </p>
                {b.cancel_reason && (
                  <p className="text-slate-500">
                    Cancelled by {b.cancelled_by}: {b.cancel_reason}
                  </p>
                )}
              </div>
              <span className="badge bg-slate-100 text-slate-700">{STATUS_LABELS[b.status]}</span>
            </div>
            {(b.status === "pending" || b.status === "accepted") && <AdminCancel id={b.id} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
