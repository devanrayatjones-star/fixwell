import { requireTradesperson } from "@/lib/auth";
import { formatDateShort } from "@/lib/format";
import { db, publicPhotoUrl } from "@/lib/supabase/admin";
import type { Service } from "@/lib/types";
import { deletePhoto } from "./actions";
import { InsuranceForm, PhotoUploader, ProfileForm } from "./forms";

export default async function ProfilePage() {
  const tp = await requireTradesperson();
  const { data } = await db().from("services").select("*").eq("tradesperson_id", tp.id).order("sort_order");
  const services = (data ?? []) as Service[];

  return (
    <div className="grid gap-6">
      <section className="card p-5 sm:p-6">
        {/* Only the editable fields go to the browser (never admin notes etc.) */}
        <ProfileForm
          tp={{
            business_name: tp.business_name,
            contact_name: tp.contact_name,
            phone: tp.phone,
            trade: tp.trade,
            base_area: tp.base_area,
            postcode_areas: tp.postcode_areas,
            hourly_rate_pence: tp.hourly_rate_pence,
            callout_fee_pence: tp.callout_fee_pence,
            bio: tp.bio,
            gas_safe_number: tp.gas_safe_number,
            niceic_napit_number: tp.niceic_napit_number,
            imi_number: tp.imi_number,
            other_accreditations: tp.other_accreditations,
          }}
          services={services.map((s) => ({ id: s.id, name: s.name, description: s.description, estimated_hours: Number(s.estimated_hours) }))} />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold">Photos of your work</h2>
        <p className="mt-1 text-sm text-slate-600">Up to 12 photos. They&apos;re shown on your public profile.</p>
        {tp.photo_paths.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tp.photo_paths.map((path) => (
              <li key={path} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- served straight from Supabase Storage */}
                <img src={publicPhotoUrl(path)} alt="" className="aspect-square w-full rounded-xl object-cover" />
                <form action={deletePhoto} className="absolute top-2 right-2">
                  <input type="hidden" name="path" value={path} />
                  <button className="rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-red-700 shadow">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <PhotoUploader />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold">Public liability insurance</h2>
        <p className="mt-1 text-sm text-slate-600">
          {tp.insurance_path ? "Certificate on file" : "No certificate on file"}
          {tp.insurance_expiry ? `, expires ${formatDateShort(tp.insurance_expiry)}` : ""}. Upload your new certificate when you renew.
        </p>
        <InsuranceForm />
      </section>
    </div>
  );
}
