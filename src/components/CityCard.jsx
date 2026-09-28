import { hasScores } from '../utils/cityScores.js';

function CityCard({ city, isShortlisted, onToggleShortlist, onOpenDetail }) {
  const canShortlist = hasScores(city);

  return (
    <div
      className="relative rounded-card overflow-hidden aspect-[4/5] cursor-pointer group"
      onClick={() => onOpenDetail(city.id)}
    >
      <img
        src={city.heroImage}
        alt={city.fullName}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleShortlist(city.id);
        }}
        disabled={!canShortlist}
        aria-pressed={isShortlisted}
        aria-label={
          isShortlisted
            ? `Remove ${city.name} from shortlist`
            : `Add ${city.name} to shortlist`
        }
        title={canShortlist ? undefined : 'No score data yet, so this city can’t be shortlisted'}
        className="absolute top-4 right-4 w-9 h-9 rounded-pill bg-white/20 backdrop-blur-sm
                   flex items-center justify-center text-white
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isShortlisted ? '♥' : '♡'}
      </button>

      <div className="absolute top-4 left-4 px-3 py-1 rounded-pill bg-brand-accentSoft text-brand-accent text-sm font-medium">
        {Math.round(city.teleportCityScore)} / 100
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="font-display text-2xl text-brand-text">{city.name}</h3>
        <p className="text-brand-muted text-sm mt-1">{city.fullName}</p>
      </div>
    </div>
  );
}

export default CityCard;