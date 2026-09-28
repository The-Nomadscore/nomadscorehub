// ComparisonDrawer.jsx — Day 3 (Johnson).
// Two city slots (A / B) filled from the shortlist. When both slots are
// full and a 3rd city is picked, the drawer asks which slot to replace (#17).
// Props: see docs/prop-contracts.md.

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
    </aside>
  );
}

export default ComparisonDrawer;
