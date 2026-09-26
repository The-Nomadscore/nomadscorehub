// ComparisonDrawer.jsx — Day 2 shell (Johnson).
// Aligned metric-by-metric graphing is the Day 3-4 ticket — this shell
// just proves both city slots wire correctly.

function ComparisonDrawer({ cityA, cityB, onRemove, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-brand-surface border-l border-brand-border p-6 z-50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg">Compare</h2>
        <button onClick={onClose} className="text-brand-muted text-sm">
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { slot: 'A', city: cityA },
          { slot: 'B', city: cityB },
        ].map(({ slot, city }) => (
          <div
            key={slot}
            className="border border-dashed border-brand-border rounded-card p-4 min-h-32 text-sm"
          >
            {city ? (
              <>
                <div className="flex justify-between">
                  <span>{city.name}</span>
                  <button
                    onClick={() => onRemove(slot)}
                    className="text-brand-muted"
                  >
                    ✕
                  </button>
                </div>
                {/* TODO (Day 3-4, Johnson): aligned per-metric bars for cityA vs cityB */}
              </>
            ) : (
              <span className="text-brand-muted">
                Select a city to compare
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ComparisonDrawer;