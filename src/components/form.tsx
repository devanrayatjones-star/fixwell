"use client";

import { createContext, useContext, useTransition } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/validation";

const PendingContext = createContext(false);

/**
 * A form that sends to a server action WITHOUT clearing what the person typed
 * (a plain <form action={…}> resets all fields when the action finishes,
 * which loses everything if there was a validation error).
 */
export function ActionForm({
  action,
  children,
  ...props
}: Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> & { action: (formData: FormData) => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      {...props}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
    </form>
  );
}

export function SubmitButton({ children, pendingText, className = "btn-primary", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const status = useFormStatus();
  const pending = useContext(PendingContext) || status.pending;
  return (
    <button type="submit" disabled={pending || rest.disabled} className={className} {...rest}>
      {pending ? (pendingText ?? "Please wait…") : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState | undefined }) {
  if (!state?.message) return null;
  return (
    <div role="status" className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
      {state.message}
    </div>
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  className = "",
  inputClassName = "",
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string; hint?: string; inputClassName?: string }) {
  return (
    <div className={className}>
      <label htmlFor={input.id ?? name} className="label">
        {label}
        {input.required ? null : <span className="font-normal text-slate-400"> (optional)</span>}
      </label>
      <input id={input.id ?? name} name={name} className={`input ${error ? "input-error" : ""} ${inputClassName}`} aria-invalid={!!error} {...input} />
      {error ? <p className="field-error">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function TextArea({
  label,
  name,
  error,
  hint,
  className = "",
  ...input
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string; error?: string; hint?: string }) {
  return (
    <div className={className}>
      <label htmlFor={input.id ?? name} className="label">
        {label}
        {input.required ? null : <span className="font-normal text-slate-400"> (optional)</span>}
      </label>
      <textarea id={input.id ?? name} name={name} rows={4} className={`input ${error ? "input-error" : ""}`} aria-invalid={!!error} {...input} />
      {error ? <p className="field-error">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}
