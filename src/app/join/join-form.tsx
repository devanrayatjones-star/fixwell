"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/form";
import { BusinessFields, ServicesEditor, WorkingHoursEditor } from "@/components/profile-fields";
import type { FormState } from "@/lib/validation";
import { joinFixwell } from "./actions";

export function JoinForm() {
  const [state, action] = useActionState<FormState, FormData>(joinFixwell, {});
  const e = state.errors ?? {};
  return (
    <ActionForm action={action} className="card mt-6 grid gap-8 p-5 sm:p-6" noValidate>
      <BusinessFields errors={e} />
      <ServicesEditor error={e.services} />
      <WorkingHoursEditor error={e.working_hours} />

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-bold">Public liability insurance</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="insurance" className="label">
              Insurance certificate
            </label>
            <input id="insurance" name="insurance" type="file" accept="application/pdf,image/jpeg,image/png" className="input file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:font-medium" />
            {e.insurance ? <p className="field-error">{e.insurance}</p> : <p className="hint">PDF, JPG or PNG, up to 4 MB. Only Fixwell staff can see it.</p>}
          </div>
          <Field label="Insurance expiry date" name="insurance_expiry" type="date" required error={e.insurance_expiry} />
        </div>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-lg font-bold">Your login</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" name="email" type="email" required autoComplete="email" error={e.email} hint="Booking notifications go here." />
          <Field label="Password" name="password" type="password" required autoComplete="new-password" minLength={8} error={e.password} hint="At least 8 characters." />
        </div>
        <label className={`flex gap-3 text-sm ${e.agree ? "text-red-700" : ""}`}>
          <input type="checkbox" name="agree" className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            I confirm the details above are true, I hold the accreditations and insurance listed, and I agree to Fixwell storing my details as described in the{" "}
            <Link href="/privacy" target="_blank" className="underline">
              privacy policy
            </Link>
            .{e.agree && <span className="block">{e.agree}</span>}
          </span>
        </label>
      </fieldset>

      <FormMessage state={state} />
      <SubmitButton pendingText="Sending application…">Send application</SubmitButton>
    </ActionForm>
  );
}
