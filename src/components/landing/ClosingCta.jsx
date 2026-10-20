import { Link } from 'react-router-dom';
import { buttonLarge, buttonPrimary } from './styles.js';

export default function ClosingCta() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-24">
      <div data-revealclassName="rounded-[2rem] border border-brand-border bg-brand-surface px-8 py-[4.5rem] text-center">
        <h2 className="mx-auto max-w-[640px] font-display text-[clamp(1.875rem,4vw,2.5rem)] font-semibold leading-[1.15]">
          Ready to pick your next base?
        </h2>
        <p className="mx-auto mt-4 max-w-[520px] text-[17px] leading-relaxed text-brand-muted">
          Browse every city, filter by what matters to you, and build your shortlist.
        </p>
        <div className="mt-9 flex justify-center">
          <Link to="/explore" className={`${buttonPrimary} ${buttonLarge}`}>
            Explore all cities
          </Link>
        </div>
      </div>
    </section>
  );
}