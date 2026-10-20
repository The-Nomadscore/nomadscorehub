import { Link } from 'react-router-dom';
import {
  buttonLarge,
  buttonOutline,
  buttonSmall,
  focusRing,
  sectionHeading,
  sectionLabel,
} from './styles.js';

const TOP_COUNT = 3;

// City objects carry fullName ("Austin, United States"); show only the country part.
function countryOf(city) {
  const prefix = `${city.name}, `;
  return city.fullName?.startsWith(prefix) ? city.fullName.slice(prefix.length) : '';
}

function pickTopCities(cities) {
  return cities
    .filter((city) => city.hasScores && city.teleportCityScore != null)
    .sort((a, b) => b.teleportCityScore - a.teleportCityScore)
    .slice(0, TOP_COUNT);
}

function TopCityCard({ city }) {
  const country = countryOf(city);
  return (
    <li data-reveal-late className="min-w-0 flex-[1_1_300px]">
      <Link
        to="/explore"
        className={`block overflow-hidden rounded-card border border-brand-border bg-brand-surface transition hover:border-brand-muted ${focusRing}`}
      >
        <div className="relative h-[220px] bg-gradient-to-br from-[#2A4A55] to-[#122A32]">
          {city.heroImage && (
            <img
              src={city.heroImage}
              alt={`Photo of ${city.name}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          )}
          <span className="absolute left-4 top-4 rounded-pill bg-brand-accentSoft px-3.5 py-1.5 text-sm font-semibold text-brand-accent">
            {city.teleportCityScore} / 100
          </span>
        </div>
        <div className="p-6">
          <h3 className="font-display text-2xl font-semibold">{city.name}</h3>
          {country && <p className="mt-1.5 text-[15px] text-brand-muted">{country}</p>}
        </div>
      </Link>
    </li>
  );
}

function CardSkeleton() {
  return (
    <li aria-hidden="true" className="min-w-0 flex-[1_1_300px]">
      <div className="animate-pulse overflow-hidden rounded-card border border-brand-border bg-brand-surface">
        <div className="h-[220px] bg-brand-border/60" />
        <div className="space-y-3 p-6">
          <div className="h-6 w-1/2 rounded bg-brand-border/60" />
          <div className="h-4 w-1/3 rounded bg-brand-border/60" />
        </div>
      </div>
    </li>
  );
}

export default function TopCities({ cities, loading, hasError, onRetry }) {
  const topCities = pickTopCities(cities);

  let content;
  if (loading) {
    content = (
      <ul className="mt-14 flex flex-wrap gap-6" aria-label="Loading top cities">
        {Array.from({ length: TOP_COUNT }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </ul>
    );
  } else if (hasError) {
    content = (
      <div
        role="alert"
        className="mx-auto mt-14 max-w-[520px] rounded-card border border-brand-border bg-brand-surface p-8 text-center"
      >
        <p>We couldn&apos;t load the top cities right now.</p>
        <button
          type="button"
          onClick={onRetry}
          className={`${buttonOutline} ${buttonSmall} mt-5`}
        >
          Try again
        </button>
      </div>
    );
  } else if (topCities.length === 0) {
    content = (
      <p className="mt-14 text-center text-brand-muted">No scored cities to show yet.</p>
    );
  } else {
    content = (
      <>
        <ul className="mt-14 flex flex-wrap gap-6">
          {topCities.map((city) => (
            <TopCityCard key={city.id} city={city} />
          ))}
        </ul>
        <div data-reveal-late className="mt-12 flex justify-center">
          <Link to="/explore" className={`${buttonOutline} ${buttonLarge}`}>
            See all cities
          </Link>
        </div>
      </>
    );
  }

  return (
    <section id="top-cities" className="mx-auto max-w-[1200px] scroll-mt-20 px-6 py-24">
      <div data-reveal className="mx-auto max-w-[640px] text-center">
        <p className={`mb-4 ${sectionLabel}`}>Top cities</p>
        <h2 className={sectionHeading}>Where nomads score highest</h2>
        <p className="mt-4 text-[17px] leading-relaxed text-brand-muted">
          Ranked by overall score across up to 17 liveability metrics.
        </p>
      </div>
      {content}
    </section>
  );
}