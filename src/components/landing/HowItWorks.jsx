import { sectionHeading, sectionLabel } from './styles.js';

const STEPS = [
  {
    title: 'Search and filter',
    text: 'Type a city, or set minimums for internet speed, affordability and safety to narrow the list instantly.',
  },
  {
    title: 'Compare side by side',
    text: 'Put two cities head to head and see every score lined up, metric by metric.',
  },
  {
    title: 'Shortlist and plan',
    text: 'Heart the cities you like, then save trip itineraries so your shortlist turns into a plan.',
  },
];

// relative z-[1]: this opaque section paints above the hero, so the hero's
// slower-moving text appears to slide underneath it while scrolling.
export default function HowItWorks() {
  return (
    <section
      id="how"
      className="relative z-[1] scroll-mt-20 border-y border-brand-border bg-brand-surface"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <div data-reveal className="mx-auto max-w-[640px] text-center">
          <p className={`mb-4 ${sectionLabel}`}>How it works</p>
          <h2 className={sectionHeading}>From overwhelmed to shortlisted in three steps</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-brand-muted">
            No spreadsheets, no twenty open tabs. Just the numbers that matter for working from
            somewhere new.
          </p>
        </div>
        <ol className="mt-14 flex flex-wrap gap-6">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              data-reveal
              className="min-w-0 flex-[1_1_280px] rounded-card border border-brand-border bg-brand-bg p-8"
            >
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-accentSoft font-display text-xl font-semibold text-brand-accent"
              >
                {index + 1}
              </span>
              <h3 className="mb-2.5 mt-6 font-display text-2xl font-semibold">{step.title}</h3>
              <p className="text-base leading-relaxed text-brand-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}