import type { Metadata } from "next";
import Link from "next/link";
import { requireTradesperson } from "@/lib/auth";
import { logout } from "../login/actions";
import { DashboardNav } from "./nav";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const tp = await requireTradesperson();
  return (
    <div className="container-page py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Dashboard</p>
          <h1 className="text-2xl font-extrabold">{tp.business_name}</h1>
        </div>
        <form action={logout}>
          <button className="btn-secondary btn-sm">Log out</button>
        </form>
      </div>

      {tp.status === "pending" && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Awaiting approval.</strong> We&apos;re checking your accreditations and insurance. You&apos;ll appear on Fixwell once approved. Meanwhile, set your hours and add photos.
        </p>
      )}
      {tp.status === "rejected" && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">
          <strong>Application not approved.</strong> {tp.rejection_reason ?? ""} Reply to our email if you&apos;d like us to look again.
        </p>
      )}
      {tp.status === "suspended" && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">
          <strong>Your listing is paused</strong> and hidden from customers. Please get in touch with us.
        </p>
      )}
      {tp.status === "approved" && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <strong>You&apos;re live.</strong>{" "}
          <Link href={`/t/${tp.slug}`} className="underline">
            View your public profile
          </Link>
        </p>
      )}

      <DashboardNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
