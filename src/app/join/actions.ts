"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { notifyEmail, SITE_URL } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { confirmAccount, newApplicationAdmin } from "@/lib/emails";
import { checkFile, fileFrom, parseProfile, parseServices, parseWorkingHours, uploadFile } from "@/lib/profile-form";
import { db } from "@/lib/supabase/admin";
import { randomSuffix, slugify } from "@/lib/tokens";
import { emailField, fieldErrors, type FormState } from "@/lib/validation";

const accountSchema = z.object({
  email: emailField,
  password: z.string().min(8, "Use at least 8 characters").max(72),
  agree: z.literal("on", { message: "Please confirm the declaration" }),
});

export async function joinFixwell(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = accountSchema.safeParse(Object.fromEntries(formData));
  const profile = parseProfile(formData);
  const services = parseServices(formData);
  const hours = parseWorkingHours(formData);
  const insurance = fileFrom(formData, "insurance");

  const errors: Record<string, string> = {
    ...(account.success ? {} : fieldErrors(account.error)),
    ...profile.errors,
    ...services.errors,
    ...hours.errors,
  };
  if (!insurance) errors.insurance = "Upload your public liability insurance certificate";
  else {
    const fileError = checkFile(insurance, "insurance");
    if (fileError) errors.insurance = fileError;
  }
  if (!formData.get("insurance_expiry")) errors.insurance_expiry = "Enter the date your insurance runs out";

  if (Object.keys(errors).length || !account.success || !profile.data || !services.data || !hours.data || !insurance) {
    return { message: "Please check the highlighted fields.", errors };
  }

  // Create the login. We send the confirmation email ourselves (through Resend).
  const { data: link, error: linkError } = await db().auth.admin.generateLink({
    type: "signup",
    email: account.data.email,
    password: account.data.password,
  });
  if (linkError || !link.user) {
    if (linkError?.code === "email_exists" || /already/i.test(linkError?.message ?? "")) {
      return { message: "There's already an account with that email. Please log in instead.", errors: { email: "Already registered" } };
    }
    console.error("Sign-up failed", linkError);
    return { message: "Something went wrong creating your account. Please try again." };
  }
  const userId = link.user.id;

  let tradespersonId: string | null = null;
  try {
    let slug = slugify(profile.data.business_name) || "tradesperson";
    const { data: clash } = await db().from("tradespeople").select("id").eq("slug", slug).maybeSingle();
    if (clash) slug = `${slug}-${randomSuffix()}`;

    const { data: tp, error } = await db()
      .from("tradespeople")
      .insert({ ...profile.data, user_id: userId, email: account.data.email, slug, working_hours: hours.data, status: "pending" })
      .select("id")
      .single();
    if (error) throw error;
    tradespersonId = tp.id as string;

    const { error: svcError } = await db()
      .from("services")
      .insert(services.data.map((s, i) => ({ tradesperson_id: tradespersonId, name: s.name, description: s.description, estimated_hours: s.estimated_hours, sort_order: i })));
    if (svcError) throw svcError;

    const insurancePath = await uploadFile(insurance, "insurance", tradespersonId);
    await db().from("tradespeople").update({ insurance_path: insurancePath }).eq("id", tradespersonId);
  } catch (err) {
    console.error("Join failed, rolling back", err);
    if (tradespersonId) await db().from("tradespeople").delete().eq("id", tradespersonId);
    await db().auth.admin.deleteUser(userId);
    return { message: "Something went wrong saving your application. Please try again." };
  }

  const confirmUrl = `${SITE_URL}/auth/confirm?token_hash=${link.properties.hashed_token}&type=${link.properties.verification_type}&next=/dashboard`;
  await Promise.all([
    sendEmail(account.data.email, confirmAccount(profile.data.contact_name, confirmUrl)),
    sendEmail(notifyEmail(), newApplicationAdmin({ ...profile.data, id: tradespersonId, email: account.data.email, is_test: false })),
  ]);

  redirect("/join/thanks");
}
