"use server";

import { revalidatePath } from "next/cache";
import { requireTradesperson } from "@/lib/auth";
import { notifyEmail } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { profileChangedAdmin } from "@/lib/emails";
import { checkFile, fileFrom, parseProfile, parseServices, uploadFile } from "@/lib/profile-form";
import { db } from "@/lib/supabase/admin";
import type { Tradesperson } from "@/lib/types";
import type { FormState } from "@/lib/validation";

const MAX_PHOTOS = 12;

const CHECKED_FIELDS: [keyof Tradesperson, string][] = [
  ["gas_safe_number", "Gas Safe number"],
  ["niceic_napit_number", "NICEIC/NAPIT number"],
  ["imi_number", "IMI number"],
  ["trade", "trade"],
];

function refresh(tp: Tradesperson) {
  revalidatePath("/dashboard/profile");
  revalidatePath(`/t/${tp.slug}`);
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const tp = await requireTradesperson();
  const profile = parseProfile(formData);
  const services = parseServices(formData);
  if (!profile.data || !services.data) return { message: "Please check the highlighted fields.", errors: { ...profile.errors, ...services.errors } };

  const { error } = await db().from("tradespeople").update(profile.data).eq("id", tp.id);
  if (error) return { message: "Couldn't save. Please try again." };

  // Sync services: update kept ones, add new ones, delete removed ones.
  // (Past bookings keep their own copy of the job name and price.)
  const { data: existing } = await db().from("services").select("id").eq("tradesperson_id", tp.id);
  const keepIds = new Set(services.data.map((s) => s.id).filter(Boolean));
  const toDelete = (existing ?? []).map((s) => s.id as string).filter((id) => !keepIds.has(id));
  if (toDelete.length) await db().from("services").delete().in("id", toDelete).eq("tradesperson_id", tp.id);
  for (const [i, s] of services.data.entries()) {
    const row = { name: s.name, description: s.description, estimated_hours: s.estimated_hours, sort_order: i };
    if (s.id) await db().from("services").update(row).eq("id", s.id).eq("tradesperson_id", tp.id);
    else await db().from("services").insert({ ...row, tradesperson_id: tp.id });
  }

  const changed = CHECKED_FIELDS.filter(([key]) => (tp[key] ?? null) !== ((profile.data as Record<string, unknown>)[key] ?? null)).map(([, label]) => label);
  if (changed.length && tp.status !== "pending") await sendEmail(notifyEmail(), profileChangedAdmin(tp, changed));

  refresh(tp);
  return { ok: true, message: "Profile saved." };
}

export async function uploadPhoto(_prev: FormState, formData: FormData): Promise<FormState> {
  const tp = await requireTradesperson();
  const file = fileFrom(formData, "photo");
  if (!file) return { message: "Choose a photo first." };
  const problem = checkFile(file, "photo");
  if (problem) return { message: problem };
  if (tp.photo_paths.length >= MAX_PHOTOS) return { message: `You can have up to ${MAX_PHOTOS} photos. Remove one first.` };
  try {
    const path = await uploadFile(file, "photo", tp.id);
    await db().from("tradespeople").update({ photo_paths: [...tp.photo_paths, path] }).eq("id", tp.id);
  } catch (err) {
    console.error("Photo upload failed", err);
    return { message: "Upload failed. Please try again." };
  }
  refresh(tp);
  return { ok: true, message: "Photo added." };
}

export async function deletePhoto(formData: FormData) {
  const tp = await requireTradesperson();
  const path = String(formData.get("path") ?? "");
  if (!tp.photo_paths.includes(path)) return;
  await db().storage.from("photos").remove([path]);
  await db().from("tradespeople").update({ photo_paths: tp.photo_paths.filter((p) => p !== path) }).eq("id", tp.id);
  refresh(tp);
}

export async function updateInsurance(_prev: FormState, formData: FormData): Promise<FormState> {
  const tp = await requireTradesperson();
  const file = fileFrom(formData, "insurance");
  const expiry = String(formData.get("insurance_expiry") ?? "");
  if (!file) return { message: "Choose your new certificate." };
  const problem = checkFile(file, "insurance");
  if (problem) return { message: problem };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return { message: "Enter the expiry date." };
  try {
    const path = await uploadFile(file, "insurance", tp.id);
    await db().from("tradespeople").update({ insurance_path: path, insurance_expiry: expiry }).eq("id", tp.id);
    if (tp.insurance_path) await db().storage.from("insurance").remove([tp.insurance_path]);
  } catch (err) {
    console.error("Insurance upload failed", err);
    return { message: "Upload failed. Please try again." };
  }
  if (tp.status !== "pending") await sendEmail(notifyEmail(), profileChangedAdmin(tp, ["insurance certificate"]));
  refresh(tp);
  return { ok: true, message: "Insurance updated. We'll check the new certificate." };
}
