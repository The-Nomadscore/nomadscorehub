/* eslint-disable react/no-unknown-property -- react-three-fiber tags use props such as args and position */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { hasCoordinates, latLonToVector3, rotationYForLongitude } from './geo.js';
import { arcPoints, cityVector, topCities, viewFor } from './story.js';
import { LandDots, Planet } from './parts.jsx';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

const CAMERA = { position: [0, 0, 3.4], fov: 40 };
const REST_TILT = 0.35;

// Moves a value toward a target; jumps straight there when `snap` is set.
function approach(current, target, delta, speed, snap) {
  return snap ? target : current + (target - current) * (1 - Math.exp(-delta * speed));
}

function StepPin({ city, emphasis, phase, snap }) {
  const group = useRef(null);
  const dot = useRef(null);
  const halo = useRef(null);
  const level = useRef(1);
  const size = useRef(1);
  const position = useMemo(
    () => latLonToVector3(city.latitude, city.longitude, 1.005),
    [city.latitude, city.longitude]
  );

  useFrame(({ clock }, delta) => {
    if (!group.current || !dot.current || !halo.current) return;
    level.current = approach(level.current, emphasis === 'dim' ? 0.2 : 1, delta, 5, snap);
    size.current = approach(size.current, emphasis === 'focus' ? 1.6 : 1, delta, 5, snap);
    group.current.scale.setScalar(size.current);
    dot.current.material.opacity = level.current;
    const pulse = 1 + 0.4 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 2 + phase));
    halo.current.scale.setScalar(pulse);
    halo.current.material.opacity = 0.25 * level.current;
  });

  return (
    <group ref={group} position={position}>
      <mesh ref={dot}>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshBasicMaterial color="#E5A15C" transparent />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color="#E5A15C" transparent opacity={0.25} depthWrite={false} />
      </mesh>
    </group>
  );
}

// A glowing line between two cities that draws itself in.
function Arc({ from, to, active, snap }) {
  const progress = useRef(0);
  const line = useMemo(() => {
    const points = arcPoints(from, to);
    if (points.length === 0) return null;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
    const material = new LineBasicMaterial({ color: '#E5A15C', transparent: true, opacity: 0.95 });
    return new Line(geometry, material);
  }, [from, to]);

  useEffect(
    () => () => {
      if (!line) return;
      line.geometry.dispose();
      line.material.dispose();
    },
    [line]
  );

  useFrame((_, delta) => {
    if (!line) return;
    progress.current = approach(progress.current, active ? 1 : 0, delta, 2.5, snap);
    const count = line.geometry.attributes.position.count;
    line.geometry.setDrawRange(0, Math.round(progress.current * count));
    line.visible = progress.current > 0.01;
  });

  return line ? <primitive object={line} /> : null;
}

// A ring lying on the surface around a city, like a "saved" marker.
function Ring({ city, active, snap }) {
  const mesh = useRef(null);
  const level = useRef(0);
  const { position, quaternion } = useMemo(() => {
    const point = latLonToVector3(city.latitude, city.longitude, 1.012);
    const q = new Quaternion().setFromUnitVectors(
      new Vector3(0, 0, 1),
      new Vector3(...point).normalize()
    );
    return { position: point, quaternion: q };
  }, [city.latitude, city.longitude]);

  useFrame(({ clock }, delta) => {
    if (!mesh.current) return;
    level.current = approach(level.current, active ? 1 : 0, delta, 4, snap);
    const pulse = 1 + 0.12 * Math.sin(clock.elapsedTime * 2.2);
    mesh.current.scale.setScalar((0.6 + 0.4 * level.current) * pulse);
    mesh.current.material.opacity = 0.9 * level.current;
    mesh.current.visible = level.current > 0.01;
  });

  return (
    <group position={position} quaternion={quaternion}>
      <mesh ref={mesh}>
        <ringGeometry args={[0.075, 0.092, 40]} />
        <meshBasicMaterial color="#E5A15C" transparent opacity={0} side={DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// step 0: every pin lit and the globe turning. step 1: the top two cities with an
// arc between them. step 2: the top three, each ringed.
function StoryGlobe({ cities, step, snap }) {
  const group = useRef(null);
  const invalidate = useThree((state) => state.invalidate);

  const pins = useMemo(() => cities.filter(hasCoordinates), [cities]);
  const ranked = useMemo(() => topCities(cities, 3), [cities]);
  const pair = useMemo(() => ranked.slice(0, 2), [ranked]);
  const pairVectors = useMemo(() => pair.map((city) => cityVector(city)), [pair]);
  const rankedVectors = useMemo(() => ranked.map((city) => cityVector(city)), [ranked]);

  const focus = step === 1 ? pair : step === 2 ? ranked : [];
  const focusIds = new Set(focus.map((city) => city.id));
  const view = useMemo(() => {
    if (step === 1) return viewFor(pairVectors);
    if (step === 2) return viewFor(rankedVectors);
    return null;
  }, [step, pairVectors, rankedVectors]);

  // When rendering is paused (reduced motion, or scrolled away), draw one frame
  // for each change.
  useEffect(() => {
    invalidate();
  }, [step, snap, cities, invalidate]);

  useFrame((_, delta) => {
    const globe = group.current;
    if (!globe) return;
    globe.rotation.x = approach(globe.rotation.x, view ? view.rotationX : REST_TILT, delta, 3.5, snap);
    if (view) {
      const gap = view.rotationY - globe.rotation.y;
      const shortest = Math.atan2(Math.sin(gap), Math.cos(gap));
      globe.rotation.y += approach(0, shortest, delta, 3.5, snap);
    } else if (!snap) {
      globe.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={group} rotation={[REST_TILT, rotationYForLongitude(20), 0]}>
      <Planet />
      <LandDots />
      {pins.map((city, index) => (
        <StepPin
          key={city.id}
          city={city}
          phase={index * 1.3}
          snap={snap}
          emphasis={focus.length === 0 ? 'normal' : focusIds.has(city.id) ? 'focus' : 'dim'}
        />
      ))}
      {pairVectors.length === 2 && (
        <Arc from={pairVectors[0]} to={pairVectors[1]} active={step === 1} snap={snap} />
      )}
      {ranked.map((city) => (
        <Ring key={city.id} city={city} active={step === 2} snap={snap} />
      ))}
    </group>
  );
}

// cities: city objects with coordinates. step: 0, 1 or 2. onReady: called when the
// renderer has started, so the page can fade out the CSS placeholder.
export default function StepGlobeScene({ cities, step, onReady }) {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(true);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={CAMERA}
        gl={{ antialias: true, alpha: true }}
        frameloop={visible && !reducedMotion ? 'always' : 'demand'}
        onCreated={onReady}
      >
        <StoryGlobe cities={cities} step={step} snap={reducedMotion} />
      </Canvas>
    </div>
  );
}