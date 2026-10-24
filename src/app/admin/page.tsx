import Link from "next/link";
import { TestBadge } from "@/components/badges";
import { requireAdmin } from "@/lib/auth";
import { formatDateShort } from "@/lib/format";
import { db } from "@/lib/supabase/admin";
import { tradeInfo } from "@/lib/trades";
import type { Tradesperson, TradespersonStatus } from "@/lib/types";

const TABS: { status: TradespersonStatus; label: string }[] = [
  { status: "pending", label: "Awaiting approval" },
  { status: "approved", label: "Approved" },
  { status: "suspended", label: "Suspended" },
  { status: "rejected", label: "Rejected" },
];

export default async function AdminTradespeoplePage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (TABS.find((t) => t.status === sp.status)?.status ?? "pending") as TradespersonStatus;

  const [{ data }, { data: all }] = await Promise.all([
    db()
      .from("tradespeople")
      .select("id, business_name, trade, base_area, contact_name, email, created_at, is_test, insurance_expiry, status")
      .eq("status", status)
      .order("created_at", { ascending: status === "pending" }),
    db().from("tradespeople").select("status"),
  ]);
  const counts = Object.fromEntries(TABS.map((t) => [t.status, (all ?? []).filter((r) => r.status === t.status).length]));
  const rows = (data ?? []) as Pick<Tradesperson, "id" | "business_name" | "trade" | "base_area" | "contact_name" | "email" | "created_at" | "is_test" | "insurance_expiry">[];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.status} href={`/admin?status=${t.status}`} className={`btn-sm rounded-full border ${t.status === status ? "border-brand-900 bg-brand-900 text-white" : "border-slate-300 bg-white"} btn`}>
            {t.label} ({counts[t.status]})
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="mt-6 text-slate-500">Nobody here.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {rows.map((tp) => (
            <li key={tp.id}>
              <Link href={`/admin/tradespeople/${tp.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:border-brand-600">
                <div>
                  <p className="font-bold">
                    {tp.business_name} <TestBadge show={tp.is_test} />
                  </p>
                  <p className="text-sm text-slate-600">
                    {tradeInfo(tp.trade).label} · {tp.base_area} · {tp.contact_name} · {tp.email}
                  </p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  Applied {formatDateShort(tp.created_at)}
                  {tp.insurance_expiry && <span className="block">Insurance to {formatDateShort(tp.insurance_expiry)}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
