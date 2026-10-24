"use client";

import { useActionState, useState } from "react";
import { ActionForm, FormMessage, SubmitButton } from "@/components/form";
import type { FormState } from "@/lib/validation";
import { cancelBookingAsAdmin } from "../actions";

export function AdminCancel({ id }: { id: string }) {
  const [state, action] = useActionState<FormState, FormData>(cancelBookingAsAdmin, {});
  const [open, setOpen] = useState(false);
  if (state.ok) return <div className="mt-2"><FormMessage state={state} /></div>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 text-xs font-semibold text-red-700 underline">
        Cancel booking…
      </button>
    );
  }
  return (
    <ActionForm action={action} className="mt-3 flex flex-wrap items-end gap-2">
      <input type="hidden" name="booking_id" value={id} />
      <input name="reason" placeholder="Reason (emailed to both)" className="input max-w-sm" />
      <SubmitButton className="btn-danger btn-sm" pendingText="Cancelling…">
        Cancel booking
      </SubmitButton>
      <FormMessage state={state} />
    </ActionForm>
  );
}
