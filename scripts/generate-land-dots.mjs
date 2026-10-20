// One-off generator for the landing page globe. Run it manually; the app never
// imports this file. It samples points evenly over a sphere and keeps the ones
// that fall on land, then writes [lat, lon] pairs for the 3D globe to draw.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';

const SAMPLES = 9000;
const OUT_DIR = 'src/components/landing/globe';

const topology = JSON.parse(readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'));
const land = feature(topology, topology.objects.land);

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const dots = [];

for (let i = 0; i < SAMPLES; i += 1) {
  const y = 1 - (2 * (i + 0.5)) / SAMPLES; // runs from +1 (north) to -1 (south)
  const lat = (Math.asin(y) * 180) / Math.PI;
  let lon = (((i * GOLDEN_ANGLE) * 180) / Math.PI) % 360;
  if (lon > 180) lon -= 360;

  if (geoContains(land, [lon, lat])) {
    dots.push([Number(lat.toFixed(1)), Number(lon.toFixed(1))]);
  }
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(`${OUT_DIR}/landDots.json`, JSON.stringify(dots));
console.log(`${dots.length} land dots written to ${OUT_DIR}/landDots.json`);