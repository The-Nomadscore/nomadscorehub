import { Link } from 'react-router-dom';
import { buttonPrimary, buttonSmall, focusRing } from '../landing/styles.js';

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-brand-border bg-brand-bg">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-3.5">
        <Link
          to="/"
          className={`font-display text-2xl text-brand-text ${focusRing}`}
        >
          Admin Dashboard
        </Link>

        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-7 gap-y-2">
          <Link to="/explore" className={`${buttonPrimary} ${buttonSmall}`}>
            Visit App
          </Link>
        </nav>
      </div>
    </header>
  );
}