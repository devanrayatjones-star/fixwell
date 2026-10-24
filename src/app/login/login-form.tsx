"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ActionForm, Field, FormMessage, SubmitButton } from "@/components/form";
import type { FormState } from "@/lib/validation";
import { login, requestPasswordReset, setNewPassword } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<FormState, FormData>(login, {});
  return (
    <ActionForm action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" name="email" type="email" required autoComplete="email" error={state.errors?.email} />
      <Field label="Password" name="password" type="password" required autoComplete="current-password" error={state.errors?.password} />
      <FormMessage state={state} />
      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
      <Link href="/forgot-password" className="text-center text-sm text-slate-600 hover:underline">
        Forgotten your password?
      </Link>
    </ActionForm>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <ActionForm action={action} className="grid gap-4">
      <Field label="Email" name="email" type="email" required autoComplete="email" error={state.errors?.email} />
      <FormMessage state={state} />
      <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
    </ActionForm>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(setNewPassword, {});
  return (
    <ActionForm action={action} className="grid gap-4">
      <Field label="New password" name="password" type="password" required autoComplete="new-password" minLength={8} error={state.errors?.password} hint="At least 8 characters." />
      <Field label="Confirm new password" name="confirm" type="password" required autoComplete="new-password" error={state.errors?.confirm} />
      <FormMessage state={state} />
      <SubmitButton pendingText="Saving…">Save password</SubmitButton>
    </ActionForm>
  );
}
