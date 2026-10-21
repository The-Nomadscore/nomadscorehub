/* eslint-disable react/no-unknown-property -- react-three-fiber tags use props such as args and position */
import { useMemo } from 'react';
import { BackSide, CanvasTexture } from 'three';
import landDots from './landDots.json';
import { latLonToVector3 } from './geo.js';

// Pieces shared by the hero globe and the "How it works" globe.

const stopPropagation = (event) => event.stopPropagation();

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
export function LandDots() {
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
export function Planet() {
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