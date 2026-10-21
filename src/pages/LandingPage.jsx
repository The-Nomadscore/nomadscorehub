import { useRef } from 'react';
import { useAsync } from '../hooks/useAsync.js';
import { getCities } from '../services/api.js';
import LandingHeader from '../components/landing/LandingHeader.jsx';
import Hero from '../components/landing/Hero.jsx';
import HowItWorks from '../components/landing/HowItWorks.jsx';
import TopCities from '../components/landing/TopCities.jsx';
import ClosingCta from '../components/landing/ClosingCta.jsx';
import LandingFooter from '../components/landing/LandingFooter.jsx';
import useLandingMotion from '../components/landing/useLandingMotion.js';

// Hero numbers come from the loaded data, so they are never made up.
// Returns null (stats hidden) until there is something real to show.
function buildStats(cities) {
  const scored = cities.filter((city) => city.hasScores);
  if (scored.length === 0) return null;

  const metricCount = Math.max(...scored.map((city) => city.scores.length));
  return [
    { value: scored.length, label: 'cities scored' },
    { value: metricCount, label: 'liveability metrics' },
    { value: 'Free', label: 'to explore' },
  ];
}

export default function LandingPage() {
  const { data, loading, error, refetch } = useAsync(() => getCities(), []);
  const cities = data ?? [];

  // Scroll motion is driven from one place; sections only carry data-* markers.
  const mainRef = useRef(null);
  useLandingMotion(mainRef, { ready: !loading });

  return (
    <>
      <LandingHeader />
      <main ref={mainRef}>
        <Hero stats={buildStats(cities)} cities={cities} />
        <HowItWorks cities={cities} />
        <TopCities
          cities={cities}
          loading={loading}
          hasError={Boolean(error)}
          onRetry={refetch}
        />
        <ClosingCta />
      </main>
      <LandingFooter />
    </>
  );
}