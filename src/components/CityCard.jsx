function CityCard({ city, isShortlisted, onToggleShortlist, onOpenDetail }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden aspect-[2/3] cursor-pointer group"
      onClick={() => onOpenDetail(city.id)}
    >
      <img
        src={city.heroImage ? city.heroImage : 'https://i.pinimg.com/1200x/a1/cd/44/a1cd44f6617beebb9794877ef59082a1.jpg'}
        alt={city.fullName}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/5 to-transparent" />

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleShortlist(city.id);
        }}
        className="absolute top-4 right-4 w-10 h-10 rounded-pill bg-white/20 backdrop-blur-sm
                   flex items-center justify-center text-white"
      >
        <span className="text-2xl">
          {isShortlisted ? '♥' : '♡'}
        </span>
        
      </button>

      {/* <div className="absolute top-4 left-4 px-3 py-1 rounded-pill bg-brand-accentSoft text-brand-accent text-sm font-medium">
        {Math.round(city.teleportCityScore)} / 100
      </div> */}

      { (!city.teleportCityScore || city.teleportCityScore < 90) ? null : 
        <div className="absolute top-4 left-4 px-2 py-2 rounded-md bg-white/75 text-brand-bg text-sm font-medium">
          {'{ Nomad Best }'}
        </div>
      }

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="text-xs font-medium px-2 py-0.5 w-fit rounded-sm bg-white/75 text-brand-bg">{city.fullName.split(",")[1].trim()}</div>

        <h3 className="font-display font-medium text-2xl text-brand-text mt-2">{city.name}</h3>
        {/* <p className="text-brand-muted text-sm mt-1">{city.fullName}</p> */}

        <p className="text-brand-accent text-sm mt-1">{city.teleportCityScore ? `${city.teleportCityScore}/100` : 'N/A'} ⸱ score </p>
      </div>
    </div>
  );
}

export default CityCard;