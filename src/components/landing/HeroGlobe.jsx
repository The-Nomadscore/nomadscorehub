import { Suspense, lazy, useState } from 'react';
import GlobeFallback from './globe/GlobeFallback.jsx';
import { hasWebGL } from './globe/webgl.js';

// The 3D scene (three.js) is a separate chunk, downloaded only on this page.
const GlobeScene = lazy(() => import('./globe/GlobeScene.jsx'));

// Decorative, so hidden from assistive technology. The same cities are listed
// in the Top cities section and in the app.
export default function HeroGlobe({ cities = [] }) {
  const [webglAvailable] = useState(hasWebGL);
  const [ready, setReady] = useState(false);

  return (
    <div
      aria-hidden="true"
      data-parallax="120"
      className="flex min-w-0 flex-[1_1_340px] justify-center"
    >
      <div className="relative aspect-square w-[440px] max-w-full">
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            ready ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <GlobeFallback />
        </div>
        {webglAvailable && (
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              ready ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Suspense fallback={null}>
              <GlobeScene cities={cities} onReady={() => setReady(true)} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}