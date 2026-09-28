// ShortlistDrawer.jsx — Day 2 shell (Erick).
// In-memory only today. localStorage persistence is the Day 3 ticket.

function ShortlistDrawer({ cities, onRemove, onSelectForCompare, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-brand-surface border-t border-brand-border p-5 max-h-64 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg">Shortlist ({cities.length})</h2>
        <button onClick={onClose} className="text-brand-muted text-sm">
          Close
        </button>
      </div>

      {cities.length === 0 ? (
        <p className="text-brand-muted text-sm">
          Heart a city to add it here.
        </p>
      ) : (
        <ul className="space-y-2">
          {cities.map((city) => (
            <li
              key={city.id}
              className="flex items-center justify-between text-sm"
            >
              <span>{city.name}</span>
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