import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { TradespersonCard } from "@/components/tradesperson-card";
import { SERVICE_AREA } from "@/lib/config";
import { searchTradespeople } from "@/lib/data";
import { TRADES } from "@/lib/trades";

export default async function HomePage() {
  const featured = (await searchTradespeople({})).slice(0, 6);

  return (
    <>
      <section className="bg-gradient-to-b from-brand-900 to-brand-700 pb-16 text-white">
        <div className="container-page pt-12 sm:pt-20">
          <p className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-sm">Now booking in {SERVICE_AREA}</p>
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">Book a trusted local tradesperson in minutes</h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-100">
            Mechanics, plumbers, electricians, gas engineers and more. Every one checked by us, with clear prices before you book.
          </p>
          <div className="card mt-8 p-4 text-slate-900 sm:p-6">
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="container-page -mt-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {TRADES.map((t) => (
            <Link key={t.id} href={`/search?trade=${t.id}`} className="card flex flex-col items-center gap-2 p-4 text-center hover:border-brand-600">
              <span aria-hidden className="text-3xl">
                {t.icon}
              </span>
              <span className="text-sm font-semibold">{t.plural}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page mt-16">
        <h2 className="text-2xl font-bold">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Choose", "Search by trade and postcode. Compare hourly rates, call-out fees and accreditations."],
            ["Book", "Pick the job, a date and a free time slot. See your price estimate before you confirm."],
            ["Relax", "Get a booking reference by email. View or cancel any time from the link we send you."],
          ].map(([title, text], i) => (
            <li key={title} className="card p-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-100 font-bold text-accent-700">{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {featured.length > 0 && (
        <section className="container-page mt-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold">Tradespeople near you</h2>
            <Link href="/search" className="text-sm font-semibold text-accent-600 hover:underline">
              See all →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((tp) => (
              <TradespersonCard key={tp.id} tp={tp} />
            ))}
          </div>
        </section>
      )}

      <section className="container-page mt-16">
        <div className="card flex flex-col items-start gap-4 bg-brand-50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-xl font-bold">Are you a tradesperson?</h2>
            <p className="mt-1 text-slate-600">Get bookings from local customers. Set your own prices and working hours.</p>
          </div>
          <Link href="/join" className="btn-dark">
            Join Fixwell
          </Link>
        </div>
      </section>
    </>
  );
}
