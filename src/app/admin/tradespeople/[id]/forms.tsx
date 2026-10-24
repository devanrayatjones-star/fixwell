"use client";

import { useActionState, useState } from "react";
import { ActionForm, FormMessage, SubmitButton, TextArea } from "@/components/form";
import type { TradespersonStatus } from "@/lib/types";
import type { FormState } from "@/lib/validation";
import { saveAdminNotes, setTradespersonStatus } from "../../actions";

export function NotesForm({ id, notes }: { id: string; notes: string }) {
  const [state, action] = useActionState<FormState, FormData>(saveAdminNotes, {});
  return (
    <ActionForm action={action} className="mt-3 grid gap-3">
      <input type="hidden" name="id" value={id} />
      <TextArea label="Notes" name="admin_notes" defaultValue={notes} rows={8} />
      <FormMessage state={state} />
      <SubmitButton className="btn-dark btn-sm" pendingText="Saving…">
        Save notes
      </SubmitButton>
    </ActionForm>
  );
}

export function StatusControls({ id, status }: { id: string; status: TradespersonStatus }) {
  const [state, action] = useActionState<FormState, FormData>(setTradespersonStatus, {});
  const [rejecting, setRejecting] = useState(false);
  return (
    <div className="mt-3 grid gap-3">
      <FormMessage state={state} />
      {status !== "approved" && (
        <ActionForm action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="approved" />
          <SubmitButton className="btn-primary w-full" pendingText="Approving…">
            {status === "suspended" ? "Reinstate" : "Approve: show on site"}
          </SubmitButton>
        </ActionForm>
      )}
      {status === "approved" && (
        <ActionForm action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="suspended" />
          <SubmitButton className="btn-danger w-full" pendingText="Saving…">
            Suspend (hide from site)
          </SubmitButton>
        </ActionForm>
      )}
      {status !== "rejected" &&
        (rejecting ? (
          <ActionForm action={action} className="grid gap-2">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value="rejected" />
            <TextArea label="Reason (emailed to them)" name="reason" rows={3} />
            <SubmitButton className="btn-danger" pendingText="Saving…">
              Reject application
            </SubmitButton>
          </ActionForm>
        ) : (
          <button type="button" className="btn-secondary" onClick={() => setRejecting(true)}>
            Reject…
          </button>
        ))}
      <p className="text-xs text-slate-500">Nobody appears on the site until approved. Approving emails them that they&apos;re live.</p>
    </div>
  );
}
