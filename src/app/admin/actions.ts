"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { applicationApproved, applicationRejected, bookingCancelledCustomer, bookingCancelledTradesperson } from "@/lib/emails";
import { db } from "@/lib/supabase/admin";
import type { Booking, Tradesperson } from "@/lib/types";
import type { FormState } from "@/lib/validation";

async function loadTradesperson(id: string) {
  const { data } = await db().from("tradespeople").select("*").eq("id", id).maybeSingle();
  return data as Tradesperson | null;
}

export async function saveAdminNotes(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const notes = String(formData.get("admin_notes") ?? "").slice(0, 10000);
  const { error } = await db().from("tradespeople").update({ admin_notes: notes }).eq("id", id);
  if (error) return { message: "Couldn't save notes." };
  revalidatePath(`/admin/tradespeople/${id}`);
  return { ok: true, message: "Notes saved." };
}

export async function setTradespersonStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000) || null;
  const tp = await loadTradesperson(id);
  if (!tp) return { message: "Not found." };

  if (status === "approved") {
    if (!tp.is_test && !tp.insurance_path) return { message: "There's no insurance certificate on file. Ask them to upload one before approving." };
    await db().from("tradespeople").update({ status, approved_at: tp.approved_at ?? new Date().toISOString(), rejection_reason: null }).eq("id", id);
    if (tp.status !== "approved" && !tp.is_test) await sendEmail(tp.email, applicationApproved(tp, tp.slug));
  } else if (status === "rejected") {
    await db().from("tradespeople").update({ status, rejection_reason: reason }).eq("id", id);
    if (!tp.is_test) await sendEmail(tp.email, applicationRejected(tp, reason));
  } else if (status === "suspended") {
    await db().from("tradespeople").update({ status }).eq("id", id);
  } else {
    return { message: "Unknown status." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/tradespeople/${id}`);
  return { ok: true, message: `Status changed to ${status}.` };
}

export async function setReviewHidden(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("review_id"));
  const hidden = formData.get("hidden") === "true";
  const { data } = await db().from("reviews").update({ hidden }).eq("id", id).select("tradesperson_id").maybeSingle();
  if (data) revalidatePath(`/admin/tradespeople/${data.tradesperson_id}`);
}

export async function cancelBookingAsAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("booking_id"));
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500) || "Cancelled by Fixwell";
  const { data } = await db()
    .from("bookings")
    .update({ status: "cancelled", cancelled_by: "admin", cancelled_at: new Date().toISOString(), cancel_reason: reason })
    .eq("id", id)
    .in("status", ["pending", "accepted"])
    .select("*, tradespeople(*)")
    .maybeSingle();
  if (!data) return { message: "This booking can't be cancelled." };
  const { tradespeople: tp, ...booking } = data as Booking & { tradespeople: Tradesperson };
  await Promise.all([
    sendEmail(booking.customer_email, bookingCancelledCustomer(booking, tp, false, reason)),
    tp.is_test ? Promise.resolve(true) : sendEmail(tp.email, bookingCancelledTradesperson(booking, tp, reason)),
  ]);
  revalidatePath("/admin/bookings");
  return { ok: true, message: "Booking cancelled and both sides emailed." };
}
