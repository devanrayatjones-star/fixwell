"use client";

import { useState } from "react";
import { WEEKDAYS, type WorkingHours } from "@/lib/availability";
import { TRADES } from "@/lib/trades";
import { Field, TextArea } from "./form";

type Errors = Record<string, string>;

export type ProfileDefaults = {
  business_name?: string;
  contact_name?: string;
  phone?: string;
  trade?: string;
  base_area?: string;
  postcode_areas?: string[];
  hourly_rate_pence?: number;
  callout_fee_pence?: number;
  bio?: string;
  gas_safe_number?: string | null;
  niceic_napit_number?: string | null;
  imi_number?: string | null;
  other_accreditations?: string | null;
  insurance_expiry?: string | null;
};

const toPounds = (p?: number) => (p === undefined ? "" : (p / 100).toFixed(p % 100 ? 2 : 0));

export function BusinessFields({ d = {}, errors = {} }: { d?: ProfileDefaults; errors?: Errors }) {
  const [trade, setTrade] = useState(d.trade ?? "");
  return (
    <>
      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-bold">Your business</legend>
        <Field label="Business name" name="business_name" required defaultValue={d.business_name} error={errors.business_name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" name="contact_name" required autoComplete="name" defaultValue={d.contact_name} error={errors.contact_name} />
          <Field label="Business phone" name="phone" type="tel" required autoComplete="tel" defaultValue={d.phone} error={errors.phone} hint="Shown to customers once you accept a booking." />
        </div>
        <div>
          <label htmlFor="trade" className="label">
            Trade
          </label>
          <select id="trade" name="trade" required value={trade} onChange={(e) => setTrade(e.target.value)} className={`input ${errors.trade ? "input-error" : ""}`}>
            <option value="" disabled>
              Choose your trade
            </option>
            {TRADES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.trade && <p className="field-error">{errors.trade}</p>}
        </div>
        <TextArea label="About your business" name="bio" defaultValue={d.bio} maxLength={1500} hint="What you do, your experience, anything customers should know." error={errors.bio} />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-bold">Area and prices</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Town or area you're based in" name="base_area" required placeholder="e.g. Bristol" defaultValue={d.base_area} error={errors.base_area} />
          <Field
            label="Postcode districts you cover"
            name="postcode_areas"
            required
            placeholder="e.g. BS1, BS2, BS16"
            defaultValue={d.postcode_areas?.join(", ")}
            error={errors.postcode_areas}
            hint="The first part of the postcode. Use just the letters (e.g. BS) to cover a whole area."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hourly rate (£)" name="hourly_rate" required inputMode="decimal" placeholder="e.g. 50" defaultValue={toPounds(d.hourly_rate_pence)} error={errors.hourly_rate} />
          <Field label="Call-out fee (£)" name="callout_fee" required inputMode="decimal" placeholder="e.g. 35" defaultValue={toPounds(d.callout_fee_pence)} error={errors.callout_fee} hint="Charged once per visit. Enter 0 if none." />
        </div>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-bold">Accreditations</legend>
        <p className="-mt-2 text-sm text-slate-600">We check these against the official registers before approving you.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Gas Safe number" name="gas_safe_number" required={trade === "gas_engineer"} defaultValue={d.gas_safe_number ?? ""} error={errors.gas_safe_number} />
          <Field label="NICEIC / NAPIT number" name="niceic_napit_number" required={trade === "electrician"} defaultValue={d.niceic_napit_number ?? ""} error={errors.niceic_napit_number} />
          <Field label="IMI number" name="imi_number" defaultValue={d.imi_number ?? ""} error={errors.imi_number} />
        </div>
        <Field label="Other qualifications or memberships" name="other_accreditations" defaultValue={d.other_accreditations ?? ""} placeholder="e.g. TrustMark, City & Guilds" error={errors.other_accreditations} />
      </fieldset>
    </>
  );
}

type ServiceRow = { key: number; id?: string; name: string; description: string; hours: string };

export function ServicesEditor({ d = [], error }: { d?: { id?: string; name: string; description: string; estimated_hours: number }[]; error?: string }) {
  const [rows, setRows] = useState<ServiceRow[]>(() =>
    d.length
      ? d.map((s, i) => ({ key: i, id: s.id, name: s.name, description: s.description, hours: String(s.estimated_hours) }))
      : [{ key: 0, name: "", description: "", hours: "" }],
  );
  const [nextKey, setNextKey] = useState(rows.length);
  const update = (key: number, patch: Partial<ServiceRow>) => setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-2 text-lg font-bold">Services and prices</legend>
      <p className="-mt-2 text-sm text-slate-600">
        The jobs customers can book, with how long each usually takes. Price estimate = call-out fee + hours × hourly rate.
      </p>
      {rows.map((row, i) => (
        <div key={row.key} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_110px_auto] sm:items-end">
          <input type="hidden" name="service_id" value={row.id ?? ""} />
          <div>
            <label className="label" htmlFor={`sn-${row.key}`}>
              Service {i + 1}
            </label>
            <input id={`sn-${row.key}`} name="service_name" className="input" placeholder="e.g. Boiler service" value={row.name} onChange={(e) => update(row.key, { name: e.target.value })} maxLength={80} />
          </div>
          <div>
            <label className="label" htmlFor={`sd-${row.key}`}>
              Short description <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input id={`sd-${row.key}`} name="service_description" className="input" value={row.description} onChange={(e) => update(row.key, { description: e.target.value })} maxLength={200} />
          </div>
          <div>
            <label className="label" htmlFor={`sh-${row.key}`}>
              Hours
            </label>
            <input id={`sh-${row.key}`} name="service_hours" className="input" type="number" min="0.5" max="10" step="0.5" placeholder="1.5" value={row.hours} onChange={(e) => update(row.key, { hours: e.target.value })} />
          </div>
          <button type="button" onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))} disabled={rows.length === 1} className="btn-secondary btn-sm" aria-label={`Remove service ${i + 1}`}>
            Remove
          </button>
        </div>
      ))}
      {error && <p className="field-error">{error}</p>}
      <button
        type="button"
        onClick={() => {
          setRows((r) => [...r, { key: nextKey, name: "", description: "", hours: "" }]);
          setNextKey((k) => k + 1);
        }}
        className="btn-secondary btn-sm justify-self-start"
      >
        + Add another service
      </button>
    </fieldset>
  );
}

const DEFAULT_HOURS: WorkingHours = Object.fromEntries(["1", "2", "3", "4", "5"].map((d) => [d, { start: "08:00", end: "17:00" }]));

export function WorkingHoursEditor({ d, error }: { d?: WorkingHours; error?: string }) {
  const initial = d && Object.keys(d).length ? d : DEFAULT_HOURS;
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(WEEKDAYS.map((w) => [w.iso, !!initial[w.iso]])));
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-lg font-bold">Working hours</legend>
      <p className="-mt-1 mb-1 text-sm text-slate-600">Customers can only book start times when the whole job fits inside these hours.</p>
      {WEEKDAYS.map((w) => (
        <div key={w.iso} className="grid grid-cols-[110px_1fr] items-center gap-3 sm:grid-cols-[140px_1fr]">
          <label className="flex min-h-11 items-center gap-2 font-medium">
            <input type="checkbox" name={`wh_${w.iso}_on`} checked={on[w.iso]} onChange={(e) => setOn((o) => ({ ...o, [w.iso]: e.target.checked }))} className="h-5 w-5" />
            {w.label}
          </label>
          {on[w.iso] ? (
            <div className="flex items-center gap-2">
              <input type="time" name={`wh_${w.iso}_start`} defaultValue={initial[w.iso]?.start ?? "08:00"} step={1800} className="input max-w-32" aria-label={`${w.label} start`} />
              <span className="text-slate-500">to</span>
              <input type="time" name={`wh_${w.iso}_end`} defaultValue={initial[w.iso]?.end ?? "17:00"} step={1800} className="input max-w-32" aria-label={`${w.label} finish`} />
            </div>
          ) : (
            <span className="text-sm text-slate-400">Not working</span>
          )}
        </div>
      ))}
      {error && <p className="field-error">{error}</p>}
    </fieldset>
  );
}
