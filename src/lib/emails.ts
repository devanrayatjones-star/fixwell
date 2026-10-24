// The wording of every email Fixwell sends. Edit freely.
import "server-only";
import { CANCELLATION_CUTOFF_HOURS, SITE_NAME, SITE_URL } from "./config";
import { button, layout, p, rows, small } from "./email";
import { formatHours, formatPence, formatSlot } from "./format";
import { bookingToken } from "./tokens";
import { tradeInfo } from "./trades";
import type { Booking, Tradesperson } from "./types";

type TP = Pick<Tradesperson, "business_name" | "phone" | "email" | "trade" | "is_test" | "contact_name">;

/** The customer's private "view or cancel" link for a booking. */
export function bookingLink(b: Pick<Booking, "id" | "reference">) {
  return `${SITE_URL}/booking/${b.reference}?token=${bookingToken(b.id)}`;
}

function testPrefix(tp: Pick<Tradesperson, "is_test">) {
  return tp.is_test ? "[TEST] " : "";
}

function jobRows(b: Booking, tp: TP) {
  return rows([
    ["Reference", b.reference],
    ["Tradesperson", `${tp.business_name} (${tradeInfo(tp.trade).label})`],
    ["Job", `${b.service_name} (about ${formatHours(b.estimated_hours)})`],
    ["When", formatSlot(b.starts_at, b.ends_at)],
    ["Address", `${b.address}\n${b.postcode}`],
    ["Estimate", `${formatPence(b.estimate_pence)} (call-out ${formatPence(b.callout_fee_pence)} + ${formatHours(b.estimated_hours)} × ${formatPence(b.hourly_rate_pence)}/hr). Parts quoted on the day.`],
  ]);
}

function customerRows(b: Booking) {
  return rows([
    ["Customer", b.customer_name],
    ["Phone", b.customer_phone],
    ["Email", b.customer_email],
    ["Vehicle reg", b.vehicle_reg],
    ["Problem", b.problem_description],
    ["Early start", b.early_start_requested ? "Customer asked for work to start within the 14-day cancellation period" : null],
  ]);
}

// ---- Customer emails --------------------------------------------------------

export function bookingRequestedCustomer(b: Booking, tp: TP) {
  return layout(`${testPrefix(tp)}Booking request ${b.reference} received`, "We've sent your booking request", [
    p(`Hi ${b.customer_name}, thanks for booking with ${SITE_NAME}. ${tp.business_name} will confirm your appointment shortly, and we'll email you as soon as they do.`),
    jobRows(b, tp),
    button("View or cancel your booking", bookingLink(b)),
    small(`You can cancel online free of charge up to ${CANCELLATION_CUTOFF_HOURS} hours before the appointment. Keep this email: the link above is how you manage your booking.`),
  ]);
}

export function bookingAcceptedCustomer(b: Booking, tp: TP) {
  return layout(`${testPrefix(tp)}Confirmed: ${b.reference} on ${formatSlot(b.starts_at, b.ends_at)}`, "Your booking is confirmed", [
    p(`Good news, ${b.customer_name}. ${tp.business_name} has confirmed your booking.`),
    jobRows(b, tp),
    rows([["Their phone", tp.phone]]),
    button("View or cancel your booking", bookingLink(b)),
  ]);
}

export function bookingDeclinedCustomer(b: Booking, tp: TP, reason: string | null) {
  return layout(`${testPrefix(tp)}Booking ${b.reference} couldn't be confirmed`, "Sorry, this booking couldn't go ahead", [
    p(`Hi ${b.customer_name}, unfortunately ${tp.business_name} can't take your booking for ${formatSlot(b.starts_at, b.ends_at)}.`),
    reason ? rows([["Their note", reason]]) : null,
    p("You haven't been charged anything. Other local tradespeople may be free:"),
    button("Find another tradesperson", `${SITE_URL}/search?trade=${tp.trade}`),
  ]);
}

export function bookingExpiredCustomer(b: Booking, tp: TP) {
  return layout(`${testPrefix(tp)}Booking ${b.reference} wasn't confirmed`, "Your request wasn't confirmed in time", [
    p(`Hi ${b.customer_name}, ${tp.business_name} didn't confirm your request for ${formatSlot(b.starts_at, b.ends_at)} in time, so it has been closed. You haven't been charged anything.`),
    button("Find another tradesperson", `${SITE_URL}/search?trade=${tp.trade}`),
  ]);
}

export function bookingCancelledCustomer(b: Booking, tp: TP, byCustomer: boolean, reason: string | null) {
  return layout(
    `${testPrefix(tp)}Booking ${b.reference} cancelled`,
    byCustomer ? "Your booking has been cancelled" : `${tp.business_name} has cancelled your booking`,
    [
      p(
        byCustomer
          ? `Hi ${b.customer_name}, as requested we've cancelled your booking with ${tp.business_name} for ${formatSlot(b.starts_at, b.ends_at)}.`
          : `Hi ${b.customer_name}, sorry, ${tp.business_name} has had to cancel your booking for ${formatSlot(b.starts_at, b.ends_at)}.`,
      ),
      reason ? rows([["Reason", reason]]) : null,
      button("Book again", `${SITE_URL}/search?trade=${tp.trade}`),
    ],
  );
}

export function reviewRequestCustomer(b: Booking, tp: TP) {
  return layout(`${testPrefix(tp)}How did ${tp.business_name} do?`, "How did it go?", [
    p(`Hi ${b.customer_name}, ${tp.business_name} has marked your job (${b.service_name}) as complete. Would you leave a quick review? It helps other people in your area choose with confidence.`),
    button("Leave a review", `${bookingLink(b)}&review=1`),
  ]);
}

// ---- Tradesperson emails ----------------------------------------------------

export function bookingNewTradesperson(b: Booking, tp: TP) {
  return layout(`${testPrefix(tp)}New booking request ${b.reference}: ${formatSlot(b.starts_at, b.ends_at)}`, "You have a new booking request", [
    p(`Hi ${tp.contact_name}, a customer has requested a booking. Please accept or decline it in your dashboard. The time slot is held for you until you respond.`),
    jobRows(b, tp),
    customerRows(b),
    button("Accept or decline", `${SITE_URL}/dashboard`),
  ]);
}

export function bookingCancelledTradesperson(b: Booking, tp: TP, reason: string | null) {
  return layout(`${testPrefix(tp)}Booking ${b.reference} cancelled by customer`, "A customer has cancelled", [
    p(`${b.customer_name} has cancelled their booking for ${formatSlot(b.starts_at, b.ends_at)}. The slot is free again.`),
    reason ? rows([["Reason", reason]]) : null,
    button("Open dashboard", `${SITE_URL}/dashboard`),
  ]);
}

export function confirmAccount(name: string, link: string) {
  return layout(`Confirm your ${SITE_NAME} email address`, "Confirm your email address", [
    p(`Hi ${name}, thanks for applying to join ${SITE_NAME}. Please confirm your email address:`),
    button("Confirm email", link),
    p(`We check every tradesperson's accreditations and insurance before they appear on ${SITE_NAME}, usually within a couple of working days. We'll email you as soon as you're live. Meanwhile you can log in to add photos of your work.`),
    small("If you didn't apply, you can ignore this email."),
  ]);
}

export function passwordReset(link: string) {
  return layout(`Reset your ${SITE_NAME} password`, "Reset your password", [
    p("Someone (hopefully you) asked to reset your password. This link works once and expires in an hour."),
    button("Choose a new password", link),
    small("If you didn't ask for this, you can ignore this email; your password won't change."),
  ]);
}

export function applicationApproved(tp: TP, slug: string) {
  return layout(`You're live on ${SITE_NAME}`, "You've been approved", [
    p(`Hi ${tp.contact_name}, ${tp.business_name} is now live on ${SITE_NAME} and customers can book you. We'll email you every time a booking comes in.`),
    button("See your public profile", `${SITE_URL}/t/${slug}`),
  ]);
}

export function applicationRejected(tp: TP, reason: string | null) {
  return layout(`Your ${SITE_NAME} application`, "About your application", [
    p(`Hi ${tp.contact_name}, thanks for applying to ${SITE_NAME}. Unfortunately we can't approve ${tp.business_name} at the moment.`),
    reason ? rows([["Reason", reason]]) : null,
    p("If you think this is a mistake or you can provide more information, just reply to this email."),
  ]);
}

// ---- Admin emails (to you) --------------------------------------------------

export function newApplicationAdmin(tp: TP & { id: string; base_area: string }) {
  return layout(`New tradesperson application: ${tp.business_name}`, "New application to review", [
    rows([
      ["Business", tp.business_name],
      ["Trade", tradeInfo(tp.trade).label],
      ["Area", tp.base_area],
      ["Contact", `${tp.contact_name}, ${tp.phone}, ${tp.email}`],
    ]),
    button("Review application", `${SITE_URL}/admin/tradespeople/${tp.id}`),
  ]);
}

export function bookingCopyAdmin(b: Booking, tp: TP) {
  return layout(`${testPrefix(tp)}Booking ${b.reference} with ${tp.business_name}`, "New booking on Fixwell", [jobRows(b, tp), button("All bookings", `${SITE_URL}/admin/bookings`)]);
}

export function profileChangedAdmin(tp: TP & { id: string }, changed: string[]) {
  return layout(`${tp.business_name} updated their accreditations or insurance`, "Please re-check these details", [
    p(`${tp.business_name} changed: ${changed.join(", ")}.`),
    button("Open their record", `${SITE_URL}/admin/tradespeople/${tp.id}`),
  ]);
}
