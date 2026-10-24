import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TestBadge } from "@/components/badges";
import { getPublicTradesperson } from "@/lib/data";
import { tradeInfo } from "@/lib/trades";
import { BookingWizard } from "./booking-wizard";

export const metadata: Metadata = { title: "Book", robots: { index: false } };

export default async function BookPage({ params, searchParams }: PageProps<"/t/[slug]/book">) {
  const { slug } = await params;
  const sp = await searchParams;
  const tp = await getPublicTradesperson(slug);
  if (!tp) notFound();
  const preselected = typeof sp.service === "string" ? sp.service : undefined;

  return (
    <div className="container-page max-w-3xl py-8">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href={`/t/${tp.slug}`} className="hover:underline">
          ← Back to {tp.business_name}
        </Link>
      </nav>
      <h1 className="text-2xl font-extrabold sm:text-3xl">Book {tp.business_name}</h1>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-slate-600">
        {tradeInfo(tp.trade).label} · {tp.base_area} <TestBadge show={tp.is_test} />
      </p>
      {tp.services.length === 0 ? (
        <p className="card mt-6 p-6">This tradesperson hasn&apos;t listed any services yet.</p>
      ) : (
        <BookingWizard
          tradesperson={{
            slug: tp.slug,
            business_name: tp.business_name,
            trade: tp.trade,
            hourly_rate_pence: tp.hourly_rate_pence,
            callout_fee_pence: tp.callout_fee_pence,
          }}
          services={tp.services.map((s) => ({ id: s.id, name: s.name, description: s.description, estimated_hours: Number(s.estimated_hours) }))}
          preselectedServiceId={preselected}
        />
      )}
    </div>
  );
}
