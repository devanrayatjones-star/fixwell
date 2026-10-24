"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { jobDurationMinutes } from "@/lib/availability";
import { notifyEmail, SHOW_TEST_DATA } from "@/lib/config";
import { getAvailability } from "@/lib/data";
import { sendEmail } from "@/lib/email";
import { bookingCopyAdmin, bookingNewTradesperson, bookingRequestedCustomer } from "@/lib/emails";
import { estimatePence } from "@/lib/format";
import { coversDistrict, outwardCode, postcodeExists } from "@/lib/postcode";
import { db } from "@/lib/supabase/admin";
import { londonDate, addDays } from "@/lib/time";
import { hashToken, newAccessToken, newBookingReference } from "@/lib/tokens";
import type { Booking, Tradesperson } from "@/lib/types";
import { emailField, fieldErrors, type FormState, normaliseVehicleReg, phoneField, postcodeField } from "@/lib/validation";

export type BookingFormState = FormState & { slotTaken?: boolean };

const schema = z.object({
  slug: z.string().min(1).max(80),
  service_id: z.string().uuid("Choose a job"),
  starts_at: z.string().datetime({ message: "Choose a time" }),
  customer_name: z.string().trim().min(2, "Enter your name").max(100),
  customer_phone: phoneField,
  customer_email: emailField,
  address: z.string().trim().min(5, "Enter the address for the job").max(300),
  postcode: postcodeField,
  vehicle_reg: z.string().trim().max(12).optional().default(""),
  problem_description: z.string().trim().min(10, "Tell them a little about the problem (at least 10 characters)").max(2000),
  early_start: z.literal("on").optional(),
  terms: z.literal("on", { message: "Please accept the booking terms" }),
  website: z.string().max(0).optional(), // hidden spam trap: real people leave it empty
});

export async function createBooking(_prev: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error) };
  }
  const input = parsed.data;

  // Look up the tradesperson and job fresh from the database. Never trust prices from the browser.
  let tpQuery = db().from("tradespeople").select("*").eq("slug", input.slug).eq("status", "approved");
  if (!SHOW_TEST_DATA) tpQuery = tpQuery.eq("is_test", false);
  const { data: tpRow } = await tpQuery.maybeSingle();
  const tp = tpRow as Tradesperson | null;
  if (!tp) return { message: "Sorry, this tradesperson isn't taking bookings right now." };

  const { data: service } = await db().from("services").select("*").eq("id", input.service_id).eq("tradesperson_id", tp.id).maybeSingle();
  if (!service) return { message: "That job is no longer available. Please choose another.", errors: { service_id: "Choose a job" } };

  const errors: Record<string, string> = {};

  let vehicleReg: string | null = null;
  if (tp.trade === "mechanic") {
    vehicleReg = normaliseVehicleReg(input.vehicle_reg);
    if (!vehicleReg) errors.vehicle_reg = "Enter your vehicle registration, like AB12 CDE";
  }

  const district = outwardCode(input.postcode);
  if (tp.postcode_areas.length > 0 && !coversDistrict(tp.postcode_areas, district)) {
    errors.postcode = `${tp.business_name} doesn't cover ${district}. Covered areas: ${tp.postcode_areas.join(", ")}.`;
  } else if (!(await postcodeExists(input.postcode))) {
    errors.postcode = "We couldn't find that postcode. Please check it.";
  }

  // Is the chosen time still one we'd offer? (working hours, days off, notice, not already taken)
  const startsAt = new Date(input.starts_at);
  const day = londonDate(startsAt);
  const [availability] = await getAvailability(tp.id, Number(service.estimated_hours), day, 1);
  const stillFree = availability?.date === day && availability.slots.some((s) => new Date(s.start).getTime() === startsAt.getTime());
  if (!stillFree) {
    return { message: "Sorry, that time has just been taken. Please pick another slot.", slotTaken: true };
  }

  // 14-day cancellation right: work starting inside the 14 days needs the customer's express request.
  const withinCoolingOff = day < addDays(londonDate(), 14);
  if (withinCoolingOff && !input.early_start) {
    errors.early_start = "This appointment is within 14 days. Tick this box to ask for the work to start sooner, or choose a later date.";
  }

  if (Object.keys(errors).length) return { message: "Please check the highlighted fields.", errors };

  const endsAt = new Date(startsAt.getTime() + jobDurationMinutes(Number(service.estimated_hours)) * 60_000);
  const token = newAccessToken();

  let booking: Booking | null = null;
  for (let attempt = 0; attempt < 5 && !booking; attempt++) {
    const { data, error } = await db()
      .from("bookings")
      .insert({
        reference: newBookingReference(),
        access_token_hash: hashToken(token),
        tradesperson_id: tp.id,
        service_id: service.id,
        service_name: service.name,
        estimated_hours: service.estimated_hours,
        hourly_rate_pence: tp.hourly_rate_pence,
        callout_fee_pence: tp.callout_fee_pence,
        estimate_pence: estimatePence(tp.callout_fee_pence, tp.hourly_rate_pence, Number(service.estimated_hours)),
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        customer_email: input.customer_email,
        address: input.address,
        postcode: input.postcode,
        vehicle_reg: vehicleReg,
        problem_description: input.problem_description,
        early_start_requested: !!input.early_start,
        terms_accepted_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (!error) {
      booking = data as Booking;
    } else if (error.code === "23P01") {
      // Exclusion constraint: someone else booked an overlapping slot a moment ago.
      return { message: "Sorry, that time has just been taken. Please pick another slot.", slotTaken: true };
    } else if (error.code !== "23505") {
      // 23505 = reference clash (very unlikely); anything else is a real error.
      console.error("Booking insert failed", error);
      return { message: "Something went wrong saving your booking. Please try again." };
    }
  }
  if (!booking) return { message: "Something went wrong saving your booking. Please try again." };

  // Test tradespeople have made-up email addresses, so their notifications go to you instead.
  const tradespersonInbox = tp.is_test ? notifyEmail() : tp.email;
  await Promise.all([
    sendEmail(booking.customer_email, bookingRequestedCustomer(booking, tp, token), tp.is_test ? undefined : tp.email),
    sendEmail(tradespersonInbox, bookingNewTradesperson(booking, tp), booking.customer_email ?? undefined),
    tp.is_test ? Promise.resolve(true) : sendEmail(notifyEmail(), bookingCopyAdmin(booking, tp)),
  ]);

  redirect(`/booking/${booking.reference}?token=${token}&new=1`);
}
