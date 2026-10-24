import Link from "next/link";
import { notFound } from "next/navigation";
import { TestBadge } from "@/components/badges";
import { WEEKDAYS } from "@/lib/availability";
import { requireAdmin } from "@/lib/auth";
import { formatDateShort, formatHours, formatPence } from "@/lib/format";
import { db, publicPhotoUrl } from "@/lib/supabase/admin";
import { tradeInfo } from "@/lib/trades";
import type { Review, Service, Tradesperson } from "@/lib/types";
import { setReviewHidden } from "../../actions";
import { NotesForm, StatusControls } from "./forms";

// Official registers to check numbers against.
const REGISTERS = {
  gas_safe: "https://www.gassaferegister.co.uk/find-an-engineer/",
  niceic: "https://www.niceic.com/find-a-contractor",
  napit: "https://www.napit.org.uk/",
  imi: "https://www.theimi.org.uk/",
};

export default async function AdminTradespersonPage({ params }: PageProps<"/admin/tradespeople/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { data } = await db().from("tradespeople").select("*, services(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const tp = data as Tradesperson & { services: Service[] };
  const { data: reviewRows } = await db().from("reviews").select("*").eq("tradesperson_id", tp.id).order("created_at", { ascending: false });
  const reviews = (reviewRows ?? []) as Review[];

  // Insurance is private: create a link that works for 10 minutes.
  let insuranceUrl: string | null = null;
  if (tp.insurance_path) {
    const { data: signed } = await db().storage.from("insurance").createSignedUrl(tp.insurance_path, 600);
    insuranceUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-6">
        <section className="card p-5 sm:p-6">
          <Link href="/admin" className="text-sm text-slate-500 hover:underline">
            ← All tradespeople
          </Link>
          <h2 className="mt-2 text-2xl font-extrabold">
            {tp.business_name} <TestBadge show={tp.is_test} />
          </h2>
          <p className="text-slate-600">
            {tradeInfo(tp.trade).label} · {tp.base_area} · status: <strong>{tp.status}</strong>
          </p>
          {tp.status === "approved" && (
            <Link href={`/t/${tp.slug}`} className="text-sm text-accent-600 hover:underline">
              View public profile →
            </Link>
          )}
          <dl className="mt-4 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[180px_1fr]">
            <dt className="text-slate-500">Contact</dt>
            <dd>{tp.contact_name}</dd>
            <dt className="text-slate-500">Email</dt>
            <dd>
              <a href={`mailto:${tp.email}`} className="underline">
                {tp.email}
              </a>
            </dd>
            <dt className="text-slate-500">Phone</dt>
            <dd>{tp.phone}</dd>
            <dt className="text-slate-500">Areas</dt>
            <dd>{tp.postcode_areas.join(", ")}</dd>
            <dt className="text-slate-500">Rates</dt>
            <dd>
              {formatPence(tp.hourly_rate_pence)}/hr · {formatPence(tp.callout_fee_pence)} call-out
            </dd>
            <dt className="text-slate-500">Applied</dt>
            <dd>
              {formatDateShort(tp.created_at)} · last updated {formatDateShort(tp.updated_at)}
            </dd>
            <dt className="text-slate-500">About</dt>
            <dd className="whitespace-pre-line">{tp.bio || "—"}</dd>
          </dl>
        </section>

        <section className="card p-5 sm:p-6">
          <h3 className="text-lg font-bold">Accreditations and insurance: please verify</h3>
          <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[180px_1fr]">
            <dt className="text-slate-500">Gas Safe</dt>
            <dd>
              {tp.gas_safe_number ?? "—"}{" "}
              {tp.gas_safe_number && (
                <a href={REGISTERS.gas_safe} target="_blank" rel="noreferrer" className="text-accent-600 underline">
                  Check register
                </a>
              )}
            </dd>
            <dt className="text-slate-500">NICEIC / NAPIT</dt>
            <dd>
              {tp.niceic_napit_number ?? "—"}{" "}
              {tp.niceic_napit_number && (
                <>
                  <a href={REGISTERS.niceic} target="_blank" rel="noreferrer" className="text-accent-600 underline">
                    NICEIC
                  </a>{" "}
                  ·{" "}
                  <a href={REGISTERS.napit} target="_blank" rel="noreferrer" className="text-accent-600 underline">
                    NAPIT
                  </a>
                </>
              )}
            </dd>
            <dt className="text-slate-500">IMI</dt>
            <dd>
              {tp.imi_number ?? "—"}{" "}
              {tp.imi_number && (
                <a href={REGISTERS.imi} target="_blank" rel="noreferrer" className="text-accent-600 underline">
                  Check register
                </a>
              )}
            </dd>
            <dt className="text-slate-500">Other</dt>
            <dd>{tp.other_accreditations ?? "—"}</dd>
            <dt className="text-slate-500">Insurance</dt>
            <dd>
              {insuranceUrl ? (
                <a href={insuranceUrl} target="_blank" rel="noreferrer" className="font-semibold text-accent-600 underline">
                  Open certificate
                </a>
              ) : (
                "No certificate uploaded"
              )}
              {tp.insurance_expiry && <span> · expires {formatDateShort(tp.insurance_expiry)}</span>}
            </dd>
          </dl>
        </section>

        <section className="card p-5 sm:p-6">
          <h3 className="text-lg font-bold">Services</h3>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {tp.services
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((s) => (
                <li key={s.id} className="flex justify-between gap-2 py-2">
                  <span>
                    {s.name}
                    {s.description && <span className="text-slate-500"> · {s.description}</span>}
                  </span>
                  <span className="shrink-0 text-slate-600">{formatHours(s.estimated_hours)}</span>
                </li>
              ))}
          </ul>
          <h3 className="mt-6 text-lg font-bold">Working hours</h3>
          <p className="mt-1 text-sm text-slate-600">
            {WEEKDAYS.filter((d) => tp.working_hours[d.iso])
              .map((d) => `${d.short} ${tp.working_hours[d.iso]!.start}–${tp.working_hours[d.iso]!.end}`)
              .join(" · ") || "None set"}
          </p>
          {tp.photo_paths.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {tp.photo_paths.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element -- served straight from Supabase Storage
                <img key={p} src={publicPhotoUrl(p)} alt="" className="aspect-square rounded-lg object-cover" />
              ))}
            </div>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <h3 className="text-lg font-bold">Reviews ({reviews.length})</h3>
          {reviews.length === 0 && <p className="mt-2 text-sm text-slate-500">None yet.</p>}
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {reviews.map((r) => (
              <li key={r.id} className={`flex items-start justify-between gap-3 py-3 ${r.hidden ? "opacity-50" : ""}`}>
                <div>
                  <span className="text-amber-500">{"★".repeat(r.rating)}</span> {r.reviewer_name} · {formatDateShort(r.created_at)}
                  {r.comment && <p className="text-slate-700">{r.comment}</p>}
                </div>
                <form action={setReviewHidden}>
                  <input type="hidden" name="review_id" value={r.id} />
                  <input type="hidden" name="hidden" value={String(!r.hidden)} />
                  <button className="text-xs font-semibold text-slate-600 underline">{r.hidden ? "Show" : "Hide"}</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="grid gap-6 self-start lg:sticky lg:top-20">
        <section className="card p-5">
          <h3 className="font-bold">Decision</h3>
          <StatusControls id={tp.id} status={tp.status} />
        </section>
        <section className="card p-5">
          <h3 className="font-bold">Verification notes (private)</h3>
          <p className="mt-1 text-xs text-slate-500">e.g. &quot;Checked Gas Safe register 24/10/2026, valid. Insurance £2m with Simply Business, to 01/2027.&quot;</p>
          <NotesForm id={tp.id} notes={tp.admin_notes} />
        </section>
      </aside>
    </div>
  );
}
