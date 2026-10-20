import { Link } from 'react-router-dom';
import HeroGlobe from './HeroGlobe.jsx';
import { buttonLarge, buttonOutline, buttonPrimary, sectionLabel } from './styles.js';

// stats: optional array of { value, label }. Hidden until real data is loaded,
// so the hero never shows a made-up number.
// data-* attributes are markers read by useLandingMotion; they change nothing visually.
export default function Hero({ stats = null }) {
  return (
    <section
      id="top"
      className="mx-auto flex max-w-[1200px] scroll-mt-20 flex-wrap items-center gap-16 px-6 pb-20 pt-24"
    >
      <div data-hero-fade data-parallax="60" className="min-w-0 flex-[1_1_480px]">
        <p data-hero-item className={`mb-5 ${sectionLabel}`}>
          Remote work hubs, scored
        </p>
        <h1
          data-hero-item
          className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.05]"
        >
          Find your next city in minutes.
        </h1>
        <p data-hero-item className="mt-6 max-w-[540px] text-[19px] leading-relaxed text-brand-muted">
          NomadScore rates global remote-work hubs on cost of living, internet, safety and
          more, so you can compare cities and shortlist your favorites without the guesswork.
        </p>
        <div data-hero-item className="mt-9 flex flex-wrap gap-4">
          <Link to="/explore" className={`${buttonPrimary} ${buttonLarge}`}>
            Explore all cities
          </Link>
          <a href="#how" className={`${buttonOutline} ${buttonLarge}`}>
            See how it works
          </a>
        </div>
        {stats && (
          <dl
            data-reveal-late
            className="mt-12 flex flex-wrap gap-x-12 gap-y-6 border-t border-brand-border pt-7"
          >
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col-reverse">
                <dt className="mt-2 text-sm text-brand-muted">{label}</dt>
                <dd className="font-display text-4xl font-semibold leading-none">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <HeroGlobe />
    </section>
  );
}