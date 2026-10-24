import type { RatingSummary } from "@/lib/data";
import type { PublicTradesperson } from "@/lib/types";

/** Shows real reviews only. With no reviews yet it says "New", never a made-up score. */
export function RatingBadge({ rating }: { rating: RatingSummary }) {
  if (!rating.count || rating.average === null) {
    return <span className="badge bg-brand-50 text-brand-700">New</span>;
  }
  return (
    <span className="badge bg-amber-50 text-amber-800" aria-label={`Rated ${rating.average} out of 5 from ${rating.count} reviews`}>
      ★ {rating.average.toFixed(1)} <span className="font-normal text-amber-700">({rating.count})</span>
    </span>
  );
}

export function TestBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="badge bg-yellow-200 text-yellow-900" title="Example listing for trying out the site. Not a real business.">
      TEST DATA
    </span>
  );
}

type Accreditable = Pick<PublicTradesperson, "gas_safe_number" | "niceic_napit_number" | "imi_number" | "other_accreditations">;

export function accreditationList(tp: Accreditable): { label: string; value: string }[] {
  const list: { label: string; value: string }[] = [];
  if (tp.gas_safe_number) list.push({ label: "Gas Safe registered", value: tp.gas_safe_number });
  if (tp.niceic_napit_number) list.push({ label: "NICEIC / NAPIT", value: tp.niceic_napit_number });
  if (tp.imi_number) list.push({ label: "IMI accredited", value: tp.imi_number });
  if (tp.other_accreditations) list.push({ label: "Other", value: tp.other_accreditations });
  return list;
}

export function AccreditationBadges({ tp }: { tp: Accreditable }) {
  const list = accreditationList(tp).filter((a) => a.label !== "Other");
  return (
    <>
      {list.map((a) => (
        <span key={a.label} className="badge bg-emerald-50 text-emerald-800">
          ✓ {a.label}
        </span>
      ))}
    </>
  );
}
