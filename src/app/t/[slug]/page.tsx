import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { accreditationList, RatingBadge, TestBadge } from "@/components/badges";
import { WEEKDAYS } from "@/lib/availability";
import { CANCELLATION_CUTOFF_HOURS } from "@/lib/config";
import { getPublicTradesperson } from "@/lib/data";
import { estimatePence, formatDateShort, formatHours, formatPence } from "@/lib/format";
import { publicPhotoUrl } from "@/lib/supabase/admin";
import { tradeInfo } from "@/lib/trades";

export async function generateMetadata({ params }: PageProps<"/t/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tp = await getPublicTradesperson(slug);
  if (!tp) return { title: "Not found" };
  return {
    title: `${tp.business_name}: ${tradeInfo(tp.trade).label} in ${tp.base_area}`,
    description: tp.bio.slice(0, 160),
    robots: tp.is_test ? { index: false } : undefined,
  };
}

export default async function TradespersonPage({ params }: PageProps<"/t/[slug]">) {
  const { slug } = await params;
  const tp = await getPublicTradesperson(slug);
  if (!tp) notFound();
  const trade = tradeInfo(tp.trade);
  const accreditations = accreditationList(tp);

  return (
    <div className="container-page pt-8 pb-24 lg:pb-8">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href={`/search?trade=${tp.trade}`} className="hover:underline">
          ← {trade.plural}
        </Link>
      </nav>

      {tp.is_test && (
        <div className="mb-4 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          <strong>Test listing.</strong> This is example data for trying out Fixwell. It isn&apos;t a real business. Bookings go to the site owner.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-3xl">
                {trade.icon}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold sm:text-3xl">{tp.business_name}</h1>
                <p className="mt-1 text-slate-600">
                  {trade.label} · Based in {tp.base_area}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <TestBadge show={tp.is_test} />
                  <RatingBadge rating={tp.rating} />
                </div>
              </div>
            </div>
            {tp.bio && <p className="mt-5 whitespace-pre-line text-slate-700">{tp.bio}</p>}
            <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-slate-500">Hourly rate</dt>
                <dd className="text-xl font-bold">{formatPence(tp.hourly_rate_pence)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Call-out fee</dt>
                <dd className="text-xl font-bold">{formatPence(tp.callout_fee_pence)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Areas covered</dt>
                <dd className="font-medium">{tp.postcode_areas.join(", ") || tp.base_area}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-xl font-bold">Services</h2>
            <p className="mt-1 text-sm text-slate-500">Estimate = call-out fee + (estimated hours × hourly rate). Parts quoted on the day.</p>
            <ul className="mt-4 divide-y divide-slate-100">
              {tp.services.map((s) => (
                <li key={s.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    {s.description && <p className="text-sm text-slate-600">{s.description}</p>}
                    <p className="mt-0.5 text-sm text-slate-500">About {formatHours(s.estimated_hours)}</p>
                  </div>
                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <p className="text-lg font-bold">{formatPence(estimatePence(tp.callout_fee_pence, tp.hourly_rate_pence, s.estimated_hours))}</p>
                      <p className="text-xs text-slate-500">estimate + parts</p>
                    </div>
                    <Link href={`/t/${tp.slug}/book?service=${s.id}`} className="btn-primary btn-sm">
                      Book
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {tp.photo_paths.length > 0 && (
            <section className="card p-5 sm:p-6">
              <h2 className="text-xl font-bold">Photos of their work</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {tp.photo_paths.map((path) => (
                  // eslint-disable-next-line @next/next/no-img-element -- photos are served straight from Supabase Storage
                  <img key={path} src={publicPhotoUrl(path)} alt={`Work by ${tp.business_name}`} loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
                ))}
              </div>
            </section>
          )}

          <section className="card p-5 sm:p-6">
            <h2 className="text-xl font-bold">Reviews</h2>
            {tp.reviews.length === 0 ? (
              <p className="mt-2 text-slate-600">No reviews yet. {tp.business_name} is new to Fixwell. Only customers who&apos;ve had a completed job can leave a review.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {tp.reviews.map((r) => (
                  <li key={r.id} className="border-b border-slate-100 pb-4 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500" aria-label={`${r.rating} out of 5`}>
                        {"★".repeat(r.rating)}
                        <span className="text-slate-300">{"★".repeat(5 - r.rating)}</span>
                      </span>
                      <span className="text-sm font-semibold">{r.reviewer_name}</span>
                      <span className="text-sm text-slate-400">{formatDateShort(r.created_at)}</span>
                    </div>
                    {r.comment && <p className="mt-1 whitespace-pre-line text-slate-700">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <Link href={`/t/${tp.slug}/book`} className="btn-primary w-full">
              Book {tp.business_name}
            </Link>
            <p className="mt-2 text-center text-sm text-slate-500">Free to book. Cancel online up to {CANCELLATION_CUTOFF_HOURS} hours before.</p>
          </div>

          <div className="card p-5">
            <h2 className="font-bold">Accreditations</h2>
            {accreditations.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No trade accreditations listed.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {accreditations.map((a) => (
                  <li key={a.label}>
                    <span className="font-medium text-emerald-700">✓ {a.label}</span>
                    <span className="block text-slate-500">{a.value}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-500">Public liability insurance checked by Fixwell before listing.</p>
          </div>

          <div className="card p-5">
            <h2 className="font-bold">Working hours</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {WEEKDAYS.map((d) => {
                const h = tp.working_hours[d.iso];
                return (
                  <li key={d.iso} className="flex justify-between">
                    <span className="text-slate-600">{d.label}</span>
                    <span className={h ? "font-medium" : "text-slate-400"}>{h ? `${h.start}–${h.end}` : "Closed"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>

      {/* Always-visible book button on phones */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        <Link href={`/t/${tp.slug}/book`} className="btn-primary w-full">
          Book · from {formatPence(tp.callout_fee_pence)} call-out + {formatPence(tp.hourly_rate_pence)}/hr
        </Link>
      </div>
    </div>
  );
}
