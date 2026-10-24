import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { TradespersonCard } from "@/components/tradesperson-card";
import { searchTradespeople } from "@/lib/data";
import { isTradeId, tradeInfo } from "@/lib/trades";

export const metadata: Metadata = { title: "Find a tradesperson" };

function param(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.slice(0, 100) ?? "";
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const trade = param(sp.trade);
  const where = param(sp.where);
  const job = param(sp.job);
  const results = await searchTradespeople({ trade, where, job });
  const tradeLabel = isTradeId(trade) ? tradeInfo(trade).plural : "Tradespeople";

  return (
    <div className="container-page py-8">
      <div className="card p-4 sm:p-5">
        <SearchForm trade={trade} where={where} job={job} compact />
      </div>

      <h1 className="mt-8 text-2xl font-bold">
        {tradeLabel}
        {where ? ` covering ${where}` : ""}
      </h1>
      <p className="mt-1 text-slate-600">
        {results.length} {results.length === 1 ? "result" : "results"}
      </p>

      {results.length === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <p className="text-lg font-semibold">No one matches that search yet</p>
          <p className="mt-2 text-slate-600">Try a nearby postcode district, a different job description, or any trade.</p>
          <Link href="/search" className="btn-secondary mt-4">
            Clear search
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((tp) => (
            <TradespersonCard key={tp.id} tp={tp} />
          ))}
        </div>
      )}
    </div>
  );
}
