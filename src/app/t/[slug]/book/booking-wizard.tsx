"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useMemo, useState } from "react";
import { ActionForm, Field, FormMessage, SubmitButton, TextArea } from "@/components/form";
import { estimatePence, formatDateLong, formatHours, formatPence } from "@/lib/format";
import { addDays } from "@/lib/time";
import { createBooking, type BookingFormState } from "./actions";

type ServiceOption = { id: string; name: string; description: string; estimated_hours: number };
type Slot = { start: string; end: string; label: string };
type Day = { date: string; slots: Slot[] };
type Step = "job" | "date" | "time" | "details";

const STEPS: { id: Step; label: string }[] = [
  { id: "job", label: "Job" },
  { id: "date", label: "Date" },
  { id: "time", label: "Time" },
  { id: "details", label: "Your details" },
];

export function BookingWizard({
  tradesperson,
  services,
  preselectedServiceId,
}: {
  tradesperson: { slug: string; business_name: string; trade: string; hourly_rate_pence: number; callout_fee_pence: number };
  services: ServiceOption[];
  preselectedServiceId?: string;
}) {
  const initialService = services.find((s) => s.id === preselectedServiceId) ?? null;
  const [step, setStep] = useState<Step>(initialService ? "date" : "job");
  const [service, setService] = useState<ServiceOption | null>(initialService);
  const [days, setDays] = useState<Day[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [state, formAction] = useActionState<BookingFormState, FormData>(createBooking, {});

  const loadAvailability = useCallback(
    async (serviceId: string) => {
      setDays(null);
      setLoadError(false);
      try {
        const res = await fetch(`/api/availability?slug=${encodeURIComponent(tradesperson.slug)}&service=${serviceId}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const body = (await res.json()) as { days: Day[] };
        setDays(body.days);
      } catch {
        setLoadError(true);
      }
    },
    [tradesperson.slug],
  );

  useEffect(() => {
    // Fetch free slots whenever the chosen job changes (different jobs take different lengths of time).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (service) loadAvailability(service.id);
  }, [service, loadAvailability]);

  // If the slot was taken while the customer was filling in the form, send them back to pick another.
  useEffect(() => {
    if (state.slotTaken && service) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlot(null);
      setStep("time");
      loadAvailability(service.id);
    }
  }, [state, service, loadAvailability]);

  const selectedDay = days?.find((d) => d.date === date) ?? null;
  const estimate = service ? estimatePence(tradesperson.callout_fee_pence, tradesperson.hourly_rate_pence, service.estimated_hours) : null;
  const withinFourteenDays = useMemo(() => (date && days?.length ? date < addDays(days[0].date, 14) : false), [date, days]);
  const errors = state.errors ?? {};

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="mt-6 grid gap-6">
      <ol className="flex gap-1.5" aria-label="Booking steps">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= stepIndex ? "bg-accent-600" : "bg-slate-200"}`} />
            <span className={`mt-1 block text-xs ${i === stepIndex ? "font-semibold text-slate-900" : "text-slate-500"}`}>{s.label}</span>
          </li>
        ))}
      </ol>

      {(service || slot) && (
        <div className="card flex flex-col gap-1 bg-brand-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            {service && (
              <p>
                <span className="font-semibold">{service.name}</span> · about {formatHours(service.estimated_hours)}
              </p>
            )}
            {slot && (
              <p className="text-slate-700">
                {formatDateLong(slot.start)} at {slot.label}
              </p>
            )}
          </div>
          {estimate !== null && (
            <div className="sm:text-right">
              <p className="text-lg font-bold">{formatPence(estimate)} estimate</p>
              <p className="text-xs text-slate-600">
                {formatPence(tradesperson.callout_fee_pence)} call-out + {formatHours(service!.estimated_hours)} × {formatPence(tradesperson.hourly_rate_pence)}. Parts quoted on the day.
              </p>
            </div>
          )}
        </div>
      )}

      {step === "job" && (
        <section className="card p-5">
          <h2 className="text-lg font-bold">What do you need doing?</h2>
          <div className="mt-4 grid gap-3">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setService(s);
                  setDate(null);
                  setSlot(null);
                  setStep("date");
                }}
                className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-left hover:border-brand-600 ${service?.id === s.id ? "border-brand-600 bg-brand-50" : "border-slate-200"}`}
              >
                <span>
                  <span className="block font-semibold">{s.name}</span>
                  {s.description && <span className="block text-sm text-slate-600">{s.description}</span>}
                  <span className="block text-sm text-slate-500">About {formatHours(s.estimated_hours)}</span>
                </span>
                <span className="shrink-0 font-bold">{formatPence(estimatePence(tradesperson.callout_fee_pence, tradesperson.hourly_rate_pence, s.estimated_hours))}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "date" && (
        <section className="card p-5">
          <h2 className="text-lg font-bold">Choose a date</h2>
          {loadError ? (
            <p className="mt-3 text-red-700">
              Couldn&apos;t load availability.{" "}
              <button type="button" className="underline" onClick={() => service && loadAvailability(service.id)}>
                Try again
              </button>
            </p>
          ) : !days ? (
            <p className="mt-3 text-slate-500">Loading availability…</p>
          ) : days.every((d) => d.slots.length === 0) ? (
            <p className="mt-3 text-slate-600">No free slots in the next few weeks. Please check back soon or try another tradesperson.</p>
          ) : (
            <Calendar
              days={days}
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setSlot(null);
                setStep("time");
              }}
            />
          )}
          <BackButton onClick={() => setStep("job")} />
        </section>
      )}

      {step === "time" && (
        <section className="card p-5">
          <h2 className="text-lg font-bold">Choose a start time</h2>
          {state.slotTaken && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{state.message}</p>}
          {date && <p className="mt-1 text-slate-600">{formatDateLong(`${date}T12:00:00Z`)}</p>}
          {!days ? (
            <p className="mt-3 text-slate-500">Loading…</p>
          ) : !selectedDay || selectedDay.slots.length === 0 ? (
            <p className="mt-3 text-slate-600">No times left on this day. Please choose another date.</p>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {selectedDay.slots.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  onClick={() => {
                    setSlot(s);
                    setStep("details");
                  }}
                  className={`min-h-11 rounded-xl border font-semibold hover:border-brand-600 ${slot?.start === s.start ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <BackButton onClick={() => setStep("date")} />
        </section>
      )}

      {step === "details" && service && slot && (
        <ActionForm action={formAction} className="card grid gap-4 p-5" noValidate>
          <h2 className="text-lg font-bold">Your details</h2>
          <input type="hidden" name="slug" value={tradesperson.slug} />
          <input type="hidden" name="service_id" value={service.id} />
          <input type="hidden" name="starts_at" value={slot.start} />
          {/* Spam trap, hidden from people */}
          <div className="hidden" aria-hidden>
            <label>
              Website <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <Field label="Full name" name="customer_name" required autoComplete="name" error={errors.customer_name} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" name="customer_phone" type="tel" required autoComplete="tel" error={errors.customer_phone} />
            <Field label="Email" name="customer_email" type="email" required autoComplete="email" error={errors.customer_email} hint="We'll send your confirmation here." />
          </div>
          <Field label="Address" name="address" required autoComplete="street-address" placeholder="House number, street, town" error={errors.address} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Postcode" name="postcode" required autoComplete="postal-code" inputClassName="uppercase" error={errors.postcode} />
            {tradesperson.trade === "mechanic" && (
              <Field label="Vehicle registration" name="vehicle_reg" required inputClassName="uppercase" placeholder="AB12 CDE" error={errors.vehicle_reg} />
            )}
          </div>
          <TextArea
            label="Describe the problem"
            name="problem_description"
            required
            placeholder={tradesperson.trade === "mechanic" ? "e.g. Grinding noise when braking, car is a 2015 Ford Focus" : "e.g. Kitchen tap dripping constantly, mixer tap"}
            error={errors.problem_description}
          />

          {withinFourteenDays && (
            <label className={`flex gap-3 rounded-xl border p-4 text-sm ${errors.early_start ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
              <input type="checkbox" name="early_start" className="mt-0.5 h-5 w-5 shrink-0" />
              <span>
                <strong>I ask for the work to start within my 14-day cancellation period.</strong> I understand I can still cancel, but if work has started I may have to pay for what&apos;s been done, and once the work is finished I lose the right to cancel.
                {errors.early_start && <span className="mt-1 block text-red-700">{errors.early_start}</span>}
              </span>
            </label>
          )}

          <label className={`flex gap-3 text-sm ${errors.terms ? "text-red-700" : ""}`}>
            <input type="checkbox" name="terms" required className="mt-0.5 h-5 w-5 shrink-0" />
            <span>
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="font-medium underline">
                booking terms
              </Link>{" "}
              and have read the{" "}
              <Link href="/privacy" target="_blank" className="font-medium underline">
                privacy policy
              </Link>
              .{errors.terms && <span className="block">{errors.terms}</span>}
            </span>
          </label>

          {!state.slotTaken && <FormMessage state={state} />}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <BackButton onClick={() => setStep("time")} />
            <SubmitButton pendingText="Sending booking…">Request booking</SubmitButton>
          </div>
          <p className="text-xs text-slate-500">No payment now. You pay {tradesperson.business_name} directly for the work. Parts are quoted on the day.</p>
        </ActionForm>
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-4 text-sm font-medium text-slate-600 hover:underline sm:mt-0">
      ← Back
    </button>
  );
}

const weekdayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

function Calendar({ days, selected, onSelect }: { days: Day[]; selected: string | null; onSelect: (d: string) => void }) {
  // One grid per month, weeks starting on Monday.
  const months: { label: string; days: Day[] }[] = [];
  for (const d of days) {
    const label = monthFmt.format(new Date(`${d.date}T00:00:00Z`));
    if (months.at(-1)?.label !== label) months.push({ label, days: [] });
    months.at(-1)!.days.push(d);
  }

  return (
    <div className="mt-4 space-y-5">
      {months.map((m) => {
        const pad = (new Date(`${m.days[0].date}T00:00:00Z`).getUTCDay() + 6) % 7;
        return (
          <div key={m.label}>
            <p className="mb-2 text-sm font-semibold text-slate-700">{m.label}</p>
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-slate-500">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-1.5">
              {Array.from({ length: pad }, (_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {m.days.map((d) => {
                const dt = new Date(`${d.date}T00:00:00Z`);
                const available = d.slots.length > 0;
                return (
                  <button
                    key={d.date}
                    type="button"
                    disabled={!available}
                    onClick={() => onSelect(d.date)}
                    aria-label={`${weekdayFmt.format(dt)} ${dayFmt.format(dt)} ${m.label}${available ? `, ${d.slots.length} times free` : ", fully booked or closed"}`}
                    className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm ${
                      selected === d.date
                        ? "bg-brand-600 font-bold text-white"
                        : available
                          ? "border border-brand-100 bg-white font-semibold text-slate-900 hover:border-brand-600"
                          : "cursor-not-allowed text-slate-300"
                    }`}
                  >
                    {dayFmt.format(dt)}
                    {available && selected !== d.date && <span className="mt-0.5 h-1 w-1 rounded-full bg-accent-500" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="text-xs text-slate-500">Dates with a dot have free times. All times are UK time.</p>
    </div>
  );
}
