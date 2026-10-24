"use server";

import { revalidatePath } from "next/cache";
import { requireTradesperson } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { bookingAcceptedCustomer, bookingCancelledCustomer, bookingDeclinedCustomer, reviewRequestCustomer } from "@/lib/emails";
import { parseWorkingHours } from "@/lib/profile-form";
import { db } from "@/lib/supabase/admin";
import { addDays, isValidDateString, londonDate, londonDayRange } from "@/lib/time";
import type { Booking, BookingStatus } from "@/lib/types";
import type { FormState } from "@/lib/validation";

/**
 * Moves one of the logged-in tradesperson's bookings from one status to
 * another. The status check happens inside the database update, so a
 * double-click or two open tabs can't, say, accept an already-declined booking.
 */
async function transition(bookingId: string, from: BookingStatus[], patch: Partial<Booking>) {
  const tp = await requireTradesperson();
  const { data } = await db()
    .from("bookings")
    .update(patch)
    .eq("id", bookingId)
    .eq("tradesperson_id", tp.id)
    .in("status", from)
    .select("*")
    .maybeSingle();
  return { tp, booking: data as Booking | null };
}

function reasonFrom(formData: FormData) {
  return String(formData.get("reason") ?? "").trim().slice(0, 500) || null;
}

export async function acceptBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const { tp, booking } = await transition(String(formData.get("booking_id")), ["pending"], { status: "accepted", responded_at: new Date().toISOString() });
  if (!booking) return { message: "This booking can no longer be accepted." };
  await sendEmail(booking.customer_email, bookingAcceptedCustomer(booking, tp), tp.email);
  revalidatePath("/dashboard");
  return { ok: true, message: "Accepted. We've emailed the customer." };
}

export async function declineBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const reason = reasonFrom(formData);
  const { tp, booking } = await transition(String(formData.get("booking_id")), ["pending"], {
    status: "declined",
    responded_at: new Date().toISOString(),
    decline_reason: reason,
  });
  if (!booking) return { message: "This booking can no longer be declined." };
  await sendEmail(booking.customer_email, bookingDeclinedCustomer(booking, tp, reason));
  revalidatePath("/dashboard");
  return { ok: true, message: "Declined. We've let the customer know." };
}

export async function cancelBookingAsTradesperson(_prev: FormState, formData: FormData): Promise<FormState> {
  const reason = reasonFrom(formData);
  if (!reason) return { message: "Please give the customer a reason." };
  const { tp, booking } = await transition(String(formData.get("booking_id")), ["accepted"], {
    status: "cancelled",
    cancelled_by: "tradesperson",
    cancelled_at: new Date().toISOString(),
    cancel_reason: reason,
  });
  if (!booking) return { message: "This booking can no longer be cancelled." };
  await sendEmail(booking.customer_email, bookingCancelledCustomer(booking, tp, false, reason));
  revalidatePath("/dashboard");
  return { ok: true, message: "Cancelled. We've emailed the customer." };
}

export async function completeBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const tp = await requireTradesperson();
  const id = String(formData.get("booking_id"));
  const { data: existing } = await db().from("bookings").select("starts_at").eq("id", id).eq("tradesperson_id", tp.id).maybeSingle();
  if (!existing || new Date(existing.starts_at) > new Date()) return { message: "You can mark a job complete once it has started." };

  const { booking } = await transition(id, ["accepted"], { status: "completed", completed_at: new Date().toISOString() });
  if (!booking) return { message: "This booking can't be marked complete." };
  await sendEmail(booking.customer_email, reviewRequestCustomer(booking, tp));
  revalidatePath("/dashboard");
  return { ok: true, message: "Marked complete. We've asked the customer for a review." };
}

export async function saveWorkingHours(_prev: FormState, formData: FormData): Promise<FormState> {
  const tp = await requireTradesperson();
  const hours = parseWorkingHours(formData);
  if (!hours.data) return { message: hours.errors.working_hours, errors: hours.errors };
  const { error } = await db().from("tradespeople").update({ working_hours: hours.data }).eq("id", tp.id);
  if (error) return { message: "Couldn't save. Please try again." };
  revalidatePath("/dashboard/availability");
  return { ok: true, message: "Working hours saved. Existing bookings are not affected." };
}

export async function addDayOff(_prev: FormState, formData: FormData): Promise<FormState> {
  const tp = await requireTradesperson();
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") || from);
  const today = londonDate();
  if (!isValidDateString(from) || !isValidDateString(to) || to < from) return { message: "Choose a valid date (or date range)." };
  if (from < today) return { message: "Days off must be today or later." };
  const days: string[] = [];
  for (let d = from; d <= to && days.length <= 120; d = addDays(d, 1)) days.push(d);
  if (days.length > 90) return { message: "Please block out up to 90 days at a time." };

  // Don't let a day off silently strand a customer: they must handle bookings first.
  const { data: clashes } = await db()
    .from("bookings")
    .select("reference, starts_at")
    .eq("tradesperson_id", tp.id)
    .in("status", ["pending", "accepted"])
    .gte("starts_at", londonDayRange(from).start.toISOString())
    .lt("starts_at", londonDayRange(to).end.toISOString());
  if (clashes?.length) {
    return { message: `You have ${clashes.length} booking${clashes.length > 1 ? "s" : ""} then (${clashes.map((c) => c.reference).join(", ")}). Decline or cancel ${clashes.length > 1 ? "them" : "it"} first.` };
  }

  const { error } = await db()
    .from("time_off")
    .upsert(days.map((day) => ({ tradesperson_id: tp.id, day })), { onConflict: "tradesperson_id,day", ignoreDuplicates: true });
  if (error) return { message: "Couldn't save. Please try again." };
  revalidatePath("/dashboard/availability");
  return { ok: true, message: days.length === 1 ? "Day off added." : `${days.length} days off added.` };
}

export async function removeDayOff(formData: FormData) {
  const tp = await requireTradesperson();
  const day = String(formData.get("day") ?? "");
  if (!isValidDateString(day)) return;
  await db().from("time_off").delete().eq("tradesperson_id", tp.id).eq("day", day);
  revalidatePath("/dashboard/availability");
}
