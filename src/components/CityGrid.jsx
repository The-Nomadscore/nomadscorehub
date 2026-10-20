// CityGrid.jsx — Day 2 shell (Gabriel).
// Maps cities to CityCard. Real filtering happens upstream (App passes
// down an already-filtered `cities` array once Day 3's filters land).

import CityCard from './CityCard.jsx';

function CityGrid({ cities, shortlistedIds, onToggleShortlist, onOpenDetail }) {
  if (cities.length === 0) {
    return (
      <p className="text-brand-muted text-center py-12">
        No cities match your filters yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
      {cities.map((city) => (
        <CityCard
          key={city.id}
          city={city}
          isShortlisted={shortlistedIds.includes(city.id)}
          onToggleShortlist={onToggleShortlist}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
}

export default CityGrid;