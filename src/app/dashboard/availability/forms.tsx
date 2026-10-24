"use client";

import { useActionState } from "react";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/form";
import { WorkingHoursEditor } from "@/components/profile-fields";
import type { WorkingHours } from "@/lib/availability";
import type { FormState } from "@/lib/validation";
import { addDayOff, saveWorkingHours } from "../actions";

export function HoursForm({ hours }: { hours: WorkingHours }) {
  const [state, action] = useActionState<FormState, FormData>(saveWorkingHours, {});
  return (
    <ActionForm action={action} className="grid gap-4">
      <WorkingHoursEditor d={hours} />
      <FormMessage state={state} />
      <SubmitButton pendingText="Saving…">Save working hours</SubmitButton>
    </ActionForm>
  );
}

export function DayOffForm({ today }: { today: string }) {
  const [state, action] = useActionState<FormState, FormData>(addDayOff, {});
  return (
    <ActionForm action={action} className="mt-4 grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="From" name="from" type="date" required min={today} />
        <Field label="To" name="to" type="date" min={today} hint="Leave empty for one day" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-dark" pendingText="Saving…">
        Block out
      </SubmitButton>
    </ActionForm>
  );
}
