// ShortlistDrawer.jsx — Day 3 polish (Erick).
// Adds reorder (up/down), remove-without-closing, and a helpful empty state.

function ShortlistDrawer({ cities, onRemove, onReorder, onSelectForCompare, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-brand-surface border-t border-brand-border p-5 max-h-64 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg">Shortlist ({cities.length})</h2>
        <button onClick={onClose} className="text-brand-muted text-sm">
          Close
        </button>
      </div>

      {cities.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-brand-text text-sm">Your shortlist is empty.</p>
          <p className="text-brand-muted text-sm mt-1">
            Heart a city from the grid to save it here for comparing later.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {cities.map((city, index) => (
            <li
              key={city.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <button
                    onClick={() => onReorder(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${city.name} up`}
                    className="text-brand-muted disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => onReorder(index, 1)}
                    disabled={index === cities.length - 1}
                    aria-label={`Move ${city.name} down`}
                    className="text-brand-muted disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                  >
                    ▼
                  </button>
                </div>
                <span>{city.name}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onSelectForCompare(city.id)}
                  className="text-brand-accent"
                >
                  Compare
                </button>
                <button
                  onClick={() => onRemove(city.id)}
                  className="text-brand-muted"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ShortlistDrawer;