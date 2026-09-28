// CityGrid.jsx — Day 2 shell (Erick).
// Maps cities to CityCard. Real filtering happens upstream (App passes
// down an already-filtered `cities` array once Day 3's filters land).

import CityCard from './CityCard.jsx';

function CityGrid({ cities, shortlistedIds, onToggleShortlist, onOpenDetail, searchTerm }) {

  if (cities.length === 0) {
    return (
      <p className="text-brand-muted text-center py-12">
        No cities match your filters yet.
      </p>
    )
  }

  return (
    <div className='flex flex-col gap-6 pt-6'>
      {searchTerm.trim().length > 0 ? null : <h2 className='font-display font-medium text-2xl text-brand-bg '>Top 5 Nomad's choice</h2>}
      

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
    </div>)
}

export default CityGrid;