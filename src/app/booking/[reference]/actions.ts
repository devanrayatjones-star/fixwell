"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CANCELLATION_CUTOFF_HOURS, notifyEmail } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { bookingCancelledCustomer, bookingCancelledTradesperson } from "@/lib/emails";
import { db } from "@/lib/supabase/admin";
import { hoursUntil } from "@/lib/time";
import { tokenMatches } from "@/lib/tokens";
import type { Booking, Tradesperson } from "@/lib/types";
import { fieldErrors, type FormState } from "@/lib/validation";

async function loadBookingWithToken(reference: string, token: string) {
  const { data } = await db().from("bookings").select("*, tradespeople(*)").eq("reference", reference).maybeSingle();
  if (!data || !tokenMatches(token, data.id)) return null;
  const { tradespeople, ...booking } = data;
  return { booking: booking as Booking, tp: tradespeople as Tradesperson };
}

export async function cancelBookingAsCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  const reference = String(formData.get("reference") ?? "");
  const token = String(formData.get("token") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500) || null;
  const found = await loadBookingWithToken(reference, token);
  if (!found) return { message: "We couldn't find that booking." };
  const { booking, tp } = found;

  if (!["pending", "accepted"].includes(booking.status)) return { message: "This booking can't be cancelled." };
  const hoursToGo = hoursUntil(booking.starts_at);
  if (hoursToGo < CANCELLATION_CUTOFF_HOURS) {
    return { message: `It's less than ${CANCELLATION_CUTOFF_HOURS} hours to your appointment, so please phone ${tp.business_name} to cancel.` };
  }

  // Only cancel if still active, so a double-click can't send two sets of emails.
  const { data: updated } = await db()
    .from("bookings")
    .update({ status: "cancelled", cancelled_by: "customer", cancelled_at: new Date().toISOString(), cancel_reason: reason })
    .eq("id", booking.id)
    .in("status", ["pending", "accepted"])
    .select("*")
    .maybeSingle();
  if (!updated) return { message: "This booking can't be cancelled." };

  await Promise.all([
    sendEmail(booking.customer_email, bookingCancelledCustomer(updated as Booking, tp, true, null)),
    sendEmail(tp.is_test ? notifyEmail() : tp.email, bookingCancelledTradesperson(updated as Booking, tp, reason)),
  ]);
  revalidatePath(`/booking/${reference}`);
  return { ok: true, message: "Your booking has been cancelled. We've emailed you a confirmation." };
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Choose a star rating").max(5),
  comment: z.string().trim().max(2000).optional().default(""),
});

export async function leaveReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const reference = String(formData.get("reference") ?? "");
  const token = String(formData.get("token") ?? "");
  const found = await loadBookingWithToken(reference, token);
  if (!found) return { message: "We couldn't find that booking." };
  const { booking } = found;
  if (booking.status !== "completed") return { message: "You can leave a review once the job is marked complete." };

  const parsed = reviewSchema.safeParse({ rating: formData.get("rating") ?? 0, comment: formData.get("comment") ?? "" });
  if (!parsed.success) return { message: "Please choose a star rating.", errors: fieldErrors(parsed.error) };

  // First name only, so reviews don't publish people's full names.
  const reviewerName = (booking.customer_name ?? "Customer").split(/\s+/)[0];
  const { error } = await db().from("reviews").insert({
    booking_id: booking.id,
    tradesperson_id: booking.tradesperson_id,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    reviewer_name: reviewerName,
  });
  if (error?.code === "23505") return { message: "You've already reviewed this booking. Thank you!" };
  if (error) return { message: "Something went wrong. Please try again." };

  revalidatePath(`/booking/${reference}`);
  return { ok: true, message: "Thanks for your review!" };
}
