/* eslint-disable react/no-unknown-property -- react-three-fiber tags use props such as args and position */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { BackSide, CanvasTexture } from 'three';
import landDots from './landDots.json';
import { hasCoordinates, latLonToVector3, rotationYForLongitude } from './geo.js';

const CAMERA = { position: [0, 0, 3.4], fov: 40 };
// Tilt the north pole slightly toward the viewer and start with Africa facing us.
const INITIAL_ROTATION = [0.35, rotationYForLongitude(20), 0];
const stopPropagation = (event) => event.stopPropagation();

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function createDotTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  context.beginPath();
  context.arc(16, 16, 14, 0, Math.PI * 2);
  context.fillStyle = '#ffffff';
  context.fill();
  return new CanvasTexture(canvas);
}

// The dotted continents, drawn as one set of points.
function LandDots() {
  const positions = useMemo(() => {
    const array = new Float32Array(landDots.length * 3);
    landDots.forEach(([lat, lon], index) => {
      array.set(latLonToVector3(lat, lon, 1), index * 3);
    });
    return array;
  }, []);
  const texture = useMemo(createDotTexture, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={landDots.length}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        color="#6F8F99"
        size={0.024}
        sizeAttenuation
        alphaTest={0.4}
      />
    </points>
  );
}

// A dark ball that hides the dots (and pins) on the far side, plus a faint rim glow.
// It swallows pointer events so pins behind the globe cannot be hovered.
function Planet() {
  return (
    <>
      <mesh onPointerOver={stopPropagation} onPointerMove={stopPropagation}>
        <sphereGeometry args={[0.99, 48, 48]} />
        <meshBasicMaterial color="#0F222A" />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.07, 48, 48]} />
        <meshBasicMaterial color="#E5A15C" transparent opacity={0.07} side={BackSide} />
      </mesh>
    </>
  );
}

function CityPin({ city, phase, onHover }) {
  const halo = useRef(null);
  const position = useMemo(
    () => latLonToVector3(city.latitude, city.longitude, 1.005),
    [city.latitude, city.longitude]
  );

  useFrame(({ clock }) => {
    if (!halo.current) return;
    const pulse = 1 + 0.4 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 2 + phase));
    halo.current.scale.setScalar(pulse);
  });

  const handleMove = (event) => {
    event.stopPropagation();
    onHover(city, { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
  };

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshBasicMaterial color="#E5A15C" />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color="#E5A15C" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      {/* A larger invisible target, so the pin is easy to hover. */}
      <mesh onPointerOver={handleMove} onPointerMove={handleMove} onPointerOut={() => onHover(null)}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Globe({ pins, spinning, onHover }) {
  const group = useRef(null);

  useFrame((_, delta) => {
    if (spinning && group.current) group.current.rotation.y += delta * 0.1;
  });

  return (
    <group ref={group} rotation={INITIAL_ROTATION}>
      <Planet />
      <LandDots />
      {pins.map((city, index) => (
        <CityPin key={city.id} city={city} phase={index * 1.3} onHover={onHover} />
      ))}
    </group>
  );
}

function scoreLabel(city) {
  return city.teleportCityScore != null ? `${city.teleportCityScore} / 100` : 'Not scored';
}

// cities: city objects with latitude/longitude. onReady: called when the 3D
// renderer has started, so the page can fade out the CSS placeholder.
export default function GlobeScene({ cities, onReady }) {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(true);
  const [hover, setHover] = useState(null);
  const reducedMotion = usePrefersReducedMotion();

  // Stop rendering while the globe is scrolled out of view.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const isHovering = Boolean(hover);
  useEffect(() => {
    document.body.style.cursor = isHovering ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [isHovering]);

  const pins = useMemo(() => cities.filter(hasCoordinates), [cities]);
  const handleHover = useCallback(
    (city, point) => setHover(city ? { city, ...point } : null),
    []
  );
  const animate = visible && !reducedMotion;

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={CAMERA}
        gl={{ antialias: true, alpha: true }}
        frameloop={animate ? 'always' : 'demand'}
        onCreated={onReady}
      >
        <Globe pins={pins} spinning={animate && !hover} onHover={handleHover} />
      </Canvas>
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-pill border border-brand-border bg-brand-surface px-3 py-1.5 text-sm text-brand-text"
          style={{ left: hover.x, top: hover.y - 12 }}
        >
          <span className="font-semibold">{hover.city.name}</span>
          <span className="text-brand-muted"> · {scoreLabel(hover.city)}</span>
        </div>
      )}
    </div>
  );
}