
// Drawer shell: two city slots (A / B), remove buttons, empty states.
// Per-metric bars come in Day 3.
// Props follow docs/prop-contracts.md: { cityA, cityB, onRemove, isOpen, onClose }.

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

function ComparisonDrawer({ cityA, cityB, onRemove, isOpen, onClose }) {
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

      <div className="grid grid-cols-2 gap-4">
        <CitySlot slot="A" city={cityA} onRemove={onRemove} />
        <CitySlot slot="B" city={cityB} onRemove={onRemove} />
      </div>

            {/* TODO (Day 4, #25): aligned per-metric bars for cityA vs cityB */}
      {!bothSelected && (
        <p className="mt-6 text-sm text-brand-muted">
          Pick two cities from your shortlist to see them side by side.
        </p>
      )}
    </aside>
  );
}

export default ComparisonDrawer;