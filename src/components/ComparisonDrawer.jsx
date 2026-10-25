// ComparisonDrawer.jsx — Johnson.
// Compares 2 to 4 shortlisted cities (C1, #144): one column per city and one
// row per metric. The best value in each row is highlighted; when every city
// has the same score the row is marked as a tie. On phone widths the table
// scrolls sideways while the metric names stay pinned on the left.
// Picking a city when the list is full shows a "limit reached" message that
// lets the user replace one of the compared cities, or cancel (#17).
// Props: see docs/prop-contracts.md.

function formatScore(value) {
  return typeof value === 'number' ? value.toFixed(1) : '—';
}

// Merge every city's score list into one ordered list of metric rows, so
// each metric lines up even if a city is missing a score.
// Each row: { id, name, values: (number|null)[], best: number|null, isTie }
function buildMetricRows(cities) {
  const rows = new Map();
  cities.forEach((city, col) => {
    (city?.scores ?? []).forEach((s) => {
      const row = rows.get(s.id) ?? { id: s.id, name: s.name, values: cities.map(() => null) };
      row.values[col] = typeof s.scoreOutOf10 === 'number' ? s.scoreOutOf10 : null;
      rows.set(s.id, row);
    });
  });
  return [...rows.values()].map((row) => {
    const present = row.values.filter((v) => v !== null);
    const best = present.length ? Math.max(...present) : null;
    // A tie only when at least two cities have a score and they all match.
    const isTie = present.length > 1 && present.every((v) => v === best);
    return { ...row, best, isTie };
  });
}

function LimitPrompt({ pendingCity, cities, maxCompare, onReplace, onCancelReplace }) {
  return (
    <div
      role="alert"
      className="mb-6 rounded-card border border-brand-accent bg-brand-accentSoft p-4 text-sm"
    >
      <p className="text-brand-text">
        You can compare up to {maxCompare} cities at a time. Remove one, or replace one with{' '}
        <span className="font-medium">{pendingCity.name}</span>:
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {cities.map((city) => (
          <button
            key={city.id}
            onClick={() => onReplace(city.id)}
            className="px-3 py-1 rounded-pill bg-brand-accent text-brand-bg font-medium"
          >
            Replace {city.name}
          </button>
        ))}
        <button onClick={onCancelReplace} className="px-3 py-1 text-brand-muted hover:text-brand-text">
          Cancel
        </button>
      </div>
    </div>
  );
}

function CityHeader({ city, wins, onRemove }) {
  return (
    <div className="border border-brand-border rounded-card p-3 text-sm h-full">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="font-medium text-brand-text truncate" title={city.name}>{city.name}</div>
          <div className="text-xs text-brand-muted truncate" title={city.fullName}>{city.fullName}</div>
        </div>
        <button
          onClick={() => onRemove(city.id)}
          className="text-brand-muted hover:text-brand-text shrink-0"
          aria-label={`Remove ${city.name} from comparison`}
        >
          ✕
        </button>
      </div>
      <div className="mt-2 text-xs text-brand-muted">
        Overall{' '}
        <span className="text-brand-text font-medium">
          {typeof city.teleportCityScore === 'number' ? city.teleportCityScore.toFixed(1) : '—'}
        </span>
        /100
      </div>
      {wins !== null && (
        <div className="mt-1 text-xs text-brand-muted">
          Best in <span className="text-brand-accent font-semibold">{wins}</span>{' '}
          {wins === 1 ? 'metric' : 'metrics'}
        </div>
      )}
    </div>
  );
}

function ScoreCell({ value, isBest }) {
  const pct = typeof value === 'number' ? Math.max(0, Math.min(100, value * 10)) : 0;
  return (
    <div>
      <span className={`text-xs ${isBest ? 'text-brand-accent font-semibold' : 'text-brand-muted'}`}>
        {formatScore(value)}
        {isBest && <span className="sr-only"> (best)</span>}
      </span>
      <div className="mt-1 h-1.5 rounded-pill bg-brand-border overflow-hidden">
        <div
          className={`h-full rounded-pill transition-all duration-300 ${
            isBest ? 'bg-brand-accent' : 'bg-brand-muted'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ComparisonDrawer({
  cities,
  maxCompare,
  pendingCity = null,
  onRemove,
  onReplace,
  onCancelReplace,
  isOpen,
  onClose,
}) {
  if (!isOpen) return null;

  const canCompare = cities.length >= 2;
  const rows = canCompare ? buildMetricRows(cities) : [];
  // Rows each city is best in (ties where everyone matches don't count).
  const wins = cities.map((_, col) =>
    rows.filter((r) => !r.isTie && r.best !== null && r.values[col] === r.best).length,
  );
  const ties = rows.filter((r) => r.isTie).length;

  return (
    <aside
      role="dialog"
      aria-label="Compare cities"
      className="fixed inset-y-0 right-0 w-full sm:w-[32rem] lg:w-[46rem] bg-brand-surface border-l border-brand-border p-4 sm:p-6 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg">
          Compare{' '}
          <span className="text-sm text-brand-muted font-sans">
            {cities.length} of {maxCompare}
          </span>
        </h2>
        <button onClick={onClose} className="text-brand-muted text-sm hover:text-brand-text">
          Close
        </button>
      </div>

      {pendingCity && (
        <LimitPrompt
          pendingCity={pendingCity}
          cities={cities}
          maxCompare={maxCompare}
          onReplace={onReplace}
          onCancelReplace={onCancelReplace}
        />
      )}

      {cities.length === 0 && (
        <p className="text-sm text-brand-muted">
          Pick 2 to {maxCompare} cities from your shortlist to see them side by side.
        </p>
      )}

      {cities.length === 1 && (
        <>
          <div className="max-w-[14rem]">
            <CityHeader city={cities[0]} wins={null} onRemove={onRemove} />
          </div>
          <p className="mt-6 text-sm text-brand-muted">
            Pick at least one more city from your shortlist to compare (up to {maxCompare}).
          </p>
        </>
      )}

      {canCompare && (
        <>
          {ties > 0 && (
            <p className="mb-3 text-xs text-brand-muted">
              {ties} {ties === 1 ? 'metric is' : 'metrics are'} tied across every city.
            </p>
          )}
          {/* Scrolls sideways on narrow screens; the metric column stays put. */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            {/* table-fixed keeps every city column the same width, so a long
                name is cut off with "…" instead of widening the table. The
                min width (metric column + 8rem per city + gaps) is what makes
                it scroll on phones; 4 cities fit the lg drawer without it. */}
            <table
              className="w-full table-fixed border-separate border-spacing-x-2 border-spacing-y-3 text-left"
              style={{ minWidth: `${7 + cities.length * 8.5 + 0.5}rem` }}
            >
              <caption className="sr-only">
                Scores out of 10 per metric. The best score in each row is highlighted.
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-brand-surface w-28 min-w-[7rem] align-bottom text-xs font-medium text-brand-muted"
                  >
                    Metric
                  </th>
                  {cities.map((city, col) => (
                    <th key={city.id} scope="col" className="min-w-[8rem] align-top font-normal">
                      <CityHeader city={city} wins={wins[col]} onRemove={onRemove} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-brand-surface text-xs font-normal text-brand-muted align-top pr-2"
                    >
                      {row.name}
                      {row.isTie && <span className="ml-1">(tie)</span>}
                    </th>
                    {row.values.map((value, col) => (
                      <td key={cities[col].id} className="align-top">
                        <ScoreCell
                          value={value}
                          isBest={!row.isTie && value !== null && value === row.best}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </aside>
  );
}

export default ComparisonDrawer;
