import { Link } from 'react-router-dom';
import { buttonPrimary, buttonSmall, focusRing } from './styles.js';

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-brand-border bg-brand-bg">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-3.5">
        <Link
          to="/"
          className={`font-display text-[28px] font-semibold text-brand-text ${focusRing}`}
        >
          NomadScore
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-7 gap-y-2">
          <a
            href="#how"
            className={`py-3 text-[15px] text-brand-muted hover:text-brand-text ${focusRing}`}
          >
            How it works
          </a>
          <a
            href="#top-cities"
            className={`py-3 text-[15px] text-brand-muted hover:text-brand-text ${focusRing}`}
          >
            Top cities
          </a>
          <Link to="/explore" className={`${buttonPrimary} ${buttonSmall}`}>
            Explore cities
          </Link>
        </nav>
      </div>
    </header>
  );
}