// CityDetailModal.jsx — Day 2 shell (Deborah).
// Real imagery/summary wiring lands Day 4 once api.js hits live data.
// sample-data label added under the city name (Erick).
// D4: "Plan a trip" button starts an itinerary for this city.

import ScoreBar from './ScoreBar.jsx';

function CityDetailModal({ city, onClose, onPlanTrip }) {
  if (!city) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50"
      onClick={onClose}
    >
      <div
        className="bg-brand-surface rounded-card max-w-2xl w-full max-h-[85vh] overflow-y-auto overscroll-contain p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-48 w-full rounded-card overflow-hidden mb-4 bg-brand-muted/20">
          {city.heroImage ? (
            <img
              src={city.heroImage}
              alt={city.fullName || city.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-brand-muted text-sm">
              No image available
            </div>
          )}
        </div>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl">{city.name}</h2>
            <p className="text-brand-muted text-sm">{city.fullName}</p>
            {city.isSampleData && (
              <p className="text-brand-muted text-xs mt-1">Sample data</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPlanTrip(city.id)}
              className="px-4 py-2 rounded-pill bg-brand-accent text-brand-bg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Plan a trip
            </button>
            <button onClick={onClose} className="text-brand-muted">
              Close
            </button>
          </div>
        </div>

        <p className="text-brand-text text-sm mb-6">
          {city.summary || 'No summary available for this city yet.'}
        </p>

        {city.hasScores ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {city.scores.map((s) => (
              <ScoreBar key={s.id} label={s.name} scoreOutOf10={s.scoreOutOf10} />
            ))}
          </div>
        ) : (
          <p className="text-brand-muted text-sm">
            Liveability scores are not available for this city yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default CityDetailModal;