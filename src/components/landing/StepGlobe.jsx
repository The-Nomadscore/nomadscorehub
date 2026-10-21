import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import GlobeFallback from './globe/GlobeFallback.jsx';
import { hasWebGL } from './globe/webgl.js';

const StepGlobeScene = lazy(() => import('./globe/StepGlobeScene.jsx'));

// The globe beside "How it works". The 3D scene is only created once the section
// is close to the screen, so the page does not hold a second WebGL context early.
// Decorative: the steps carry the same information as text.
export default function StepGlobe({ cities = [], step = 0 }) {
  const containerRef = useRef(null);
  const [webglAvailable] = useState(hasWebGL);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!webglAvailable || !node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: '400px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [webglAvailable]);

  return (
    <div ref={containerRef} aria-hidden="true" className="relative aspect-square w-full">
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          ready ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <GlobeFallback />
      </div>
      {webglAvailable && near && (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Suspense fallback={null}>
            <StepGlobeScene cities={cities} step={step} onReady={() => setReady(true)} />
          </Suspense>
        </div>
      )}
    </div>
  );
}