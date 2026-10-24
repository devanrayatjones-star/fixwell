import { TRADES } from "@/lib/trades";

/** Plain HTML form: works without JavaScript and keeps the search in the URL. */
export function SearchForm({ trade = "", where = "", job = "", compact = false }: { trade?: string; where?: string; job?: string; compact?: boolean }) {
  return (
    <form action="/search" method="get" className={`grid gap-3 ${compact ? "sm:grid-cols-[1fr_1fr_1fr_auto]" : "sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"}`}>
      <div>
        <label htmlFor="trade" className="label">
          Trade
        </label>
        <select id="trade" name="trade" defaultValue={trade} className="input">
          <option value="">Any trade</option>
          {TRADES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="where" className="label">
          Postcode or area
        </label>
        <input id="where" name="where" defaultValue={where} placeholder="e.g. BS1 4DJ or Bristol" className="input" autoComplete="postal-code" />
      </div>
      <div>
        <label htmlFor="job" className="label">
          Job (optional)
        </label>
        <input id="job" name="job" defaultValue={job} placeholder="e.g. boiler service" className="input" />
      </div>
      <div className="flex items-end">
        <button type="submit" className="btn-primary w-full">
          Search
        </button>
      </div>
    </form>
  );
}
