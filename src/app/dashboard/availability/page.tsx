import { requireTradesperson } from "@/lib/auth";
import { formatDateLong } from "@/lib/format";
import { db } from "@/lib/supabase/admin";
import { londonDate } from "@/lib/time";
import { removeDayOff } from "../actions";
import { DayOffForm, HoursForm } from "./forms";

export default async function AvailabilityPage() {
  const tp = await requireTradesperson();
  const today = londonDate();
  const { data } = await db().from("time_off").select("day").eq("tradesperson_id", tp.id).gte("day", today).order("day");
  const daysOff = (data ?? []).map((d) => d.day as string);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-5 sm:p-6">
        <HoursForm hours={tp.working_hours} />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold">Days off</h2>
        <p className="mt-1 text-sm text-slate-600">Customers can&apos;t book you on these days.</p>
        <DayOffForm today={today} />
        {daysOff.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No days off booked.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {daysOff.map((day) => (
              <li key={day} className="flex items-center justify-between gap-2 py-2">
                <span>{formatDateLong(`${day}T12:00:00Z`)}</span>
                <form action={removeDayOff}>
                  <input type="hidden" name="day" value={day} />
                  <button className="text-sm font-medium text-red-700 hover:underline">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
