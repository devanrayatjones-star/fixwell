"use client";

import { useActionState, useState } from "react";
import { ActionForm, FormMessage, SubmitButton, TextArea } from "@/components/form";
import type { FormState } from "@/lib/validation";
import { cancelBookingAsCustomer, leaveReview } from "./actions";

export function CancelForm({ reference, token }: { reference: string; token: string }) {
  const [state, action] = useActionState<FormState, FormData>(cancelBookingAsCustomer, {});
  const [open, setOpen] = useState(false);
  if (state.ok) return <div className="mt-4"><FormMessage state={state} /></div>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-danger mt-4">
        Cancel booking
      </button>
    );
  }
  return (
    <ActionForm action={action} className="mt-4 grid gap-3">
      <input type="hidden" name="reference" value={reference} />
      <input type="hidden" name="token" value={token} />
      <TextArea label="Reason (helps the tradesperson)" name="reason" rows={2} />
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-3">
        <SubmitButton className="btn-danger" pendingText="Cancelling…">
          Yes, cancel my booking
        </SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Keep booking
        </button>
      </div>
    </ActionForm>
  );
}

export function ReviewForm({ reference, token }: { reference: string; token: string }) {
  const [state, action] = useActionState<FormState, FormData>(leaveReview, {});
  const [rating, setRating] = useState(0);
  if (state.ok) return <div className="mt-4"><FormMessage state={state} /></div>;
  return (
    <ActionForm action={action} className="mt-4 grid gap-4">
      <input type="hidden" name="reference" value={reference} />
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="label">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              className={`h-11 w-11 text-3xl leading-none ${n <= rating ? "text-amber-500" : "text-slate-300"}`}
            >
              ★
            </button>
          ))}
        </div>
        {state.errors?.rating && <p className="field-error">{state.errors.rating}</p>}
      </fieldset>
      <TextArea label="Comments" name="comment" placeholder="What went well? Anything that could be better?" />
      <FormMessage state={state} />
      <SubmitButton pendingText="Sending…">Submit review</SubmitButton>
      <p className="text-xs text-slate-500">Your first name and review will be shown on their profile.</p>
    </ActionForm>
  );
}
