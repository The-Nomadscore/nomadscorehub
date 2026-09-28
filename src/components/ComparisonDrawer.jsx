// ComparisonDrawer.jsx — Day 4 (Johnson).
// Two city slots (A / B) filled from the shortlist. When both slots are
// full and a 3rd city is picked, the drawer asks which slot to replace (#17).
// Day 4 (#25): metric bars aligned row-by-row, city A growing left and
// city B growing right from a shared centre line; the winner of each
// metric is highlighted, ties are marked.
// Props: see docs/prop-contracts.md.

function formatScore(value) {
  return typeof value === 'number' ? value.toFixed(1) : '—';
}

// Merge both cities' score lists into one ordered list of metric rows,
// so each metric lines up even if one city is missing a score.
function buildMetricRows(cityA, cityB) {
  const rows = new Map();
  const add = (city, key) => {
    (city?.scores ?? []).forEach((s) => {
      const row = rows.get(s.id) ?? { id: s.id, name: s.name, a: null, b: null };
      row[key] = s.scoreOutOf10;
      rows.set(s.id, row);
    });
  };
  add(cityA, 'a');
  add(cityB, 'b');
  return [...rows.values()];
}

function MetricBar({ value, side, isWinner }) {
  const pct = typeof value === 'number' ? Math.max(0, Math.min(100, value * 10)) : 0;
  return (
    <div
      className={`h-2 flex-1 rounded-pill bg-brand-border overflow-hidden flex ${
        side === 'A' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`h-full rounded-pill transition-all duration-300 ${
          isWinner ? 'bg-brand-accent' : 'bg-brand-muted'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ReplacePrompt({ pendingCity, cityA, cityB, onReplace, onCancelReplace }) {
  return (
    <div
      role="alert"
      className="mb-6 rounded-card border border-brand-accent bg-brand-accentSoft p-4 text-sm"
    >
      <p className="text-brand-text">
        You can compare 2 cities at a time. Replace which one with{' '}
        <span className="font-medium">{pendingCity.name}</span>?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => onReplace('A')}
          className="px-3 py-1 rounded-pill bg-brand-accent text-brand-bg font-medium"
        >
          Replace {cityA?.name ?? 'A'}
        </button>
        <button
          onClick={() => onReplace('B')}
          className="px-3 py-1 rounded-pill bg-brand-accent text-brand-bg font-medium"
        >
          Replace {cityB?.name ?? 'B'}
        </button>
        <button onClick={onCancelReplace} className="px-3 py-1 text-brand-muted hover:text-brand-text">
          Cancel
        </button>
      </div>
    </div>
  );
}

function CitySlot({ slot, city, onRemove }) {
  if (!city) {
    return (
      <div className="border border-dashed border-brand-border rounded-card p-4 text-sm text-brand-muted flex items-center justify-center min-h-20 text-center">
        Select a city to compare (slot {slot})
      </div>
    );
  }
  return (
    <div className="border border-brand-border rounded-card p-4 text-sm">
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="font-medium text-brand-text">{city.name}</div>
          <div className="text-xs text-brand-muted">{city.fullName}</div>
        </div>
        <button
          onClick={() => onRemove(slot)}
          className="text-brand-muted hover:text-brand-text"
          aria-label={`Remove ${city.name} from comparison`}
        >
          ✕
        </button>
      </div>
      <div className="mt-3 text-xs text-brand-muted">
        Overall{' '}
        <span className="text-brand-text font-medium">
          {typeof city.teleportCityScore === 'number'
            ? city.teleportCityScore.toFixed(1)
            : '—'}
        </span>
        /100
      </div>
    </div>
  );
}

function ComparisonDrawer({
  cityA,
  cityB,
  pendingCity = null,
  onRemove,
  onReplace,
  onCancelReplace,
  isOpen,
  onClose,
}) {
  if (!isOpen) return null;

  const bothSelected = Boolean(cityA && cityB);
  const rows = bothSelected ? buildMetricRows(cityA, cityB) : [];
  const winsA = rows.filter((r) => r.a !== null && r.b !== null && r.a > r.b).length;
  const winsB = rows.filter((r) => r.a !== null && r.b !== null && r.b > r.a).length;
  const ties = rows.filter((r) => r.a !== null && r.b !== null && r.a === r.b).length;

  return (
    <aside
      role="dialog"
      aria-label="Compare cities"
      className="fixed inset-y-0 right-0 w-full sm:w-[28rem] bg-brand-surface border-l border-brand-border p-6 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg">Compare</h2>
        <button onClick={onClose} className="text-brand-muted text-sm hover:text-brand-text">
          Close
        </button>
      </div>

      {pendingCity && (
        <ReplacePrompt
          pendingCity={pendingCity}
          cityA={cityA}
          cityB={cityB}
          onReplace={onReplace}
          onCancelReplace={onCancelReplace}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <CitySlot slot="A" city={cityA} onRemove={onRemove} />
        <CitySlot slot="B" city={cityB} onRemove={onRemove} />
      </div>

      {!bothSelected && (
        <p className="mt-6 text-sm text-brand-muted">
          Pick two cities from your shortlist to see them side by side.
        </p>
      )}

      {bothSelected && (
        <>
          <div className="mt-6 flex justify-between text-xs text-brand-muted">
            <span>
              {cityA.name} leads in <span className="text-brand-text">{winsA}</span>
            </span>
            {ties > 0 && <span>{ties} tied</span>}
            <span>
              {cityB.name} leads in <span className="text-brand-text">{winsB}</span>
            </span>
          </div>

          {/* Column headers so each side of the bars is labelled */}
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-brand-text">
            <span className="flex-1 text-right pr-10 truncate">{cityA.name}</span>
            <span className="flex-1 pl-10 truncate">{cityB.name}</span>
          </div>

          <ul className="mt-4 space-y-4">
            {rows.map((row) => {
              const aWins = row.a !== null && (row.b === null || row.a > row.b);
              const bWins = row.b !== null && (row.a === null || row.b > row.a);
              const isTie = row.a !== null && row.a === row.b;
              return (
                <li key={row.id}>
                  <div className="text-xs text-center text-brand-muted mb-1">
                    {row.name}
                    {isTie && <span className="ml-1">(tie)</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-8 text-right text-xs ${aWins ? 'text-brand-accent font-semibold' : 'text-brand-muted'}`}>
                      {formatScore(row.a)}
                    </span>
                    <MetricBar value={row.a} side="A" isWinner={aWins} />
                    <MetricBar value={row.b} side="B" isWinner={bWins} />
                    <span className={`w-8 text-xs ${bWins ? 'text-brand-accent font-semibold' : 'text-brand-muted'}`}>
                      {formatScore(row.b)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </aside>
  );
}

export default ComparisonDrawer;