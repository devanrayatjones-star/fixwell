"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth";
import { SITE_URL } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { passwordReset } from "@/lib/emails";
import { db } from "@/lib/supabase/admin";
import { createAuthClient } from "@/lib/supabase/server";
import { emailField, fieldErrors, type FormState } from "@/lib/validation";

/** Only allow redirects to pages on this site. */
function safeNext(next: unknown, fallback: string): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email: emailField, password: z.string().min(1, "Enter your password") }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { message: "Please confirm your email address first. Check your inbox for the link we sent." };
    }
    return { message: "Email or password is incorrect." };
  }
  redirect(safeNext(formData.get("next"), isAdminEmail(parsed.data.email) ? "/admin" : "/dashboard"));
}

export async function logout() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email: emailField }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  // We email the link ourselves (via Resend) so you don't have to set up email inside Supabase.
  const { data, error } = await db().auth.admin.generateLink({ type: "recovery", email: parsed.data.email });
  if (!error && data.properties?.hashed_token) {
    const link = `${SITE_URL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery&next=/account/reset-password`;
    await sendEmail(parsed.data.email, passwordReset(link));
  }
  // Same message either way, so nobody can use this form to find out who has an account.
  return { ok: true, message: "If there's an account for that email, we've sent a password reset link. It expires in an hour." };
}

export async function setNewPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ password: z.string().min(8, "Use at least 8 characters").max(72), confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createAuthClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { message: "Your reset link has expired. Please request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { message: error.code === "same_password" ? "That's your current password. Choose a new one." : "Couldn't update your password. Please try again." };
  redirect(isAdminEmail(user.user.email) ? "/admin" : "/dashboard");
}
