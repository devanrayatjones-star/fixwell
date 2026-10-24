"use client";

import { useActionState, useState } from "react";
import { ActionForm, FormMessage, SubmitButton, TextArea } from "@/components/form";
import type { BookingStatus } from "@/lib/types";
import type { FormState } from "@/lib/validation";
import { acceptBooking, cancelBookingAsTradesperson, completeBooking, declineBooking } from "./actions";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function BookingActions({ id, status, started }: { id: string; status: BookingStatus; started: boolean }) {
  const [mode, setMode] = useState<"decline" | "cancel" | null>(null);
  if (status === "pending") {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton id={id} action={acceptBooking} label="Accept" pending="Accepting…" className="btn-primary btn-sm" />
        {mode === "decline" ? (
          <ReasonForm id={id} action={declineBooking} label="Decline booking" placeholder="Optional note for the customer, e.g. fully booked that day" onCancel={() => setMode(null)} />
        ) : (
          <button type="button" className="btn-secondary btn-sm" onClick={() => setMode("decline")}>
            Decline
          </button>
        )}
      </div>
    );
  }
  if (status === "accepted") {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {started && <ActionButton id={id} action={completeBooking} label="Mark job complete" pending="Saving…" className="btn-dark btn-sm" />}
        {!started &&
          (mode === "cancel" ? (
            <ReasonForm id={id} action={cancelBookingAsTradesperson} label="Cancel booking" placeholder="Reason for the customer (required)" onCancel={() => setMode(null)} required />
          ) : (
            <button type="button" className="btn-danger btn-sm" onClick={() => setMode("cancel")}>
              Cancel booking
            </button>
          ))}
      </div>
    );
  }
  return null;
}

function ActionButton({ id, action, label, pending, className }: { id: string; action: Action; label: string; pending: string; className: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <ActionForm action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="booking_id" value={id} />
      <SubmitButton className={className} pendingText={pending}>
        {label}
      </SubmitButton>
      <FormMessage state={state} />
    </ActionForm>
  );
}

function ReasonForm({ id, action, label, placeholder, onCancel, required }: { id: string; action: Action; label: string; placeholder: string; onCancel: () => void; required?: boolean }) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <ActionForm action={formAction} className="grid w-full gap-2">
      <input type="hidden" name="booking_id" value={id} />
      <TextArea label="Message to the customer" name="reason" rows={2} placeholder={placeholder} required={required} />
      <FormMessage state={state} />
      <div className="flex gap-2">
        <SubmitButton className="btn-danger btn-sm" pendingText="Saving…">
          {label}
        </SubmitButton>
        <button type="button" className="btn-secondary btn-sm" onClick={onCancel}>
          Back
        </button>
      </div>
    </ActionForm>
  );
}
