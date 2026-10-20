function CityCard({ city, isShortlisted, onToggleShortlist, onOpenDetail }) {
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
        className="absolute top-4 right-4 w-9 h-9 rounded-pill bg-white/20 backdrop-blur-sm
                   flex items-center justify-center text-white"
      >
        {isShortlisted ? '♥' : '♡'}
      </button>

      <div
        className={`absolute top-4 left-4 px-3 py-1 rounded-pill text-sm font-medium ${
          city.hasScores
            ? 'bg-brand-accentSoft text-brand-accent'
            : 'bg-black/40 text-brand-muted'
        }`}
      >
        {city.hasScores
          ? `${Math.round(city.teleportCityScore)} / 100`
          : 'Limited data'}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="font-display text-2xl text-brand-text">{city.name}</h3>
        <p className="text-brand-muted text-sm mt-1">{city.fullName}</p>
      </div>
    </div>
  );
}

export default CityCard;