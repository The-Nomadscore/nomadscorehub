// ItineraryList.jsx — all itineraries, with an empty state.
// Props documented in docs/prop-contracts.md.

import ItineraryCard from './ItineraryCard.jsx';

function ItineraryList({ itineraries, cities, onCreate, onEdit, onDelete }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-brand-text">Itineraries</h2>
        <button
          onClick={onCreate}
          className="px-5 py-2 rounded-pill bg-brand-accent text-brand-bg font-medium hover:opacity-90 transition-opacity"
        >
          + New itinerary
        </button>
      </div>

      {itineraries.length === 0 ? (
        <div className="bg-brand-surface border border-brand-border rounded-card p-10 text-center space-y-2">
          <p className="font-display text-xl text-brand-text">No itineraries yet</p>
          <p className="text-brand-muted text-sm">
            Pick a city and plan your first stay.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {itineraries.map((it) => (
            <ItineraryCard
              key={it.id}
              itinerary={it}
              city={cities.find((c) => c.id === it.cityId) ?? null}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default ItineraryList;