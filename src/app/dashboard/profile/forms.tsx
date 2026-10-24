"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/form";
import { BusinessFields, ServicesEditor, type ProfileDefaults } from "@/components/profile-fields";
import type { FormState } from "@/lib/validation";
import { updateInsurance, updateProfile, uploadPhoto } from "./actions";

export function ProfileForm({ tp, services }: { tp: ProfileDefaults; services: { id: string; name: string; description: string; estimated_hours: number }[] }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, {});
  const e = state.errors ?? {};
  return (
    <ActionForm action={action} className="grid gap-8" noValidate>
      <BusinessFields d={tp} errors={e} />
      <ServicesEditor d={services} error={e.services} />
      <FormMessage state={state} />
      <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
    </ActionForm>
  );
}

/** Phone photos are often 5+ MB, so shrink them in the browser before upload. */
async function shrinkImage(file: File, maxSide = 1600): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export function PhotoUploader() {
  const [state, action] = useActionState<FormState, FormData>(uploadPhoto, {});
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-4 grid gap-2">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          const small = await shrinkImage(file);
          const fd = new FormData();
          fd.set("photo", small);
          setBusy(false);
          startTransition(() => action(fd));
          e.target.value = "";
        }}
      />
      <button type="button" onClick={() => input.current?.click()} disabled={pending || busy} className="btn-secondary justify-self-start">
        {pending || busy ? "Uploading…" : "+ Add a photo"}
      </button>
      <FormMessage state={state} />
    </div>
  );
}

export function InsuranceForm() {
  const [state, action] = useActionState<FormState, FormData>(updateInsurance, {});
  return (
    <ActionForm action={action} className="mt-4 grid gap-4 sm:grid-cols-[1fr_200px_auto] sm:items-end">
      <div>
        <label htmlFor="insurance" className="label">
          New certificate
        </label>
        <input id="insurance" name="insurance" type="file" accept="application/pdf,image/jpeg,image/png" className="input file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5" />
      </div>
      <Field label="Expiry date" name="insurance_expiry" type="date" required />
      <SubmitButton className="btn-dark" pendingText="Uploading…">
        Upload
      </SubmitButton>
      <div className="sm:col-span-3">
        <FormMessage state={state} />
      </div>
    </ActionForm>
  );
}
