import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../login/actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  return (
    <div className="container-page py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Signed in as {user.email}</p>
          <h1 className="text-2xl font-extrabold">Fixwell admin</h1>
        </div>
        <form action={logout}>
          <button className="btn-secondary btn-sm">Log out</button>
        </form>
      </div>
      <nav className="mt-4 flex gap-1 border-b border-slate-200 text-sm font-semibold">
        <Link href="/admin" className="-mb-px border-b-2 border-transparent px-4 py-3 text-slate-600 hover:border-slate-300 hover:text-slate-900">
          Tradespeople
        </Link>
        <Link href="/admin/bookings" className="-mb-px border-b-2 border-transparent px-4 py-3 text-slate-600 hover:border-slate-300 hover:text-slate-900">
          Bookings
        </Link>
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
