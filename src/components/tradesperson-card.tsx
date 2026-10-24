import Link from "next/link";
import type { TradespersonCard as Card } from "@/lib/data";
import { formatPence } from "@/lib/format";
import { tradeInfo } from "@/lib/trades";
import { AccreditationBadges, RatingBadge, TestBadge } from "./badges";

export function TradespersonCard({ tp }: { tp: Card }) {
  const trade = tradeInfo(tp.trade);
  return (
    <Link href={`/t/${tp.slug}`} className="card group flex flex-col p-5 transition hover:border-brand-600 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-2xl">
          {trade.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-bold text-slate-900 group-hover:text-brand-700">{tp.business_name}</h3>
          </div>
          <p className="text-sm text-slate-600">
            {trade.label} · {tp.base_area}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <TestBadge show={tp.is_test} />
        <RatingBadge rating={tp.rating} />
        <AccreditationBadges tp={tp} />
      </div>
      {tp.services.length > 0 && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-600">{tp.services.map((s) => s.name).join(" · ")}</p>
      )}
      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <div className="text-sm text-slate-600">
          <span className="text-lg font-bold text-slate-900">{formatPence(tp.hourly_rate_pence)}</span>/hr
          <span className="mx-1.5 text-slate-300">|</span>
          {formatPence(tp.callout_fee_pence)} call-out
        </div>
        <span className="text-sm font-semibold text-accent-600 group-hover:underline">View & book →</span>
      </div>
    </Link>
  );
}
