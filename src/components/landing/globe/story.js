import { hasCoordinates, latLonToVector3, rotationYForLongitude } from './geo.js';

// The best-scored cities that can be placed on the globe.
export function topCities(cities, count) {
  return cities
    .filter((city) => hasCoordinates(city) && city.teleportCityScore != null)
    .sort((a, b) => b.teleportCityScore - a.teleportCityScore)
    .slice(0, count);
}

export function cityVector(city, radius = 1) {
  return latLonToVector3(city.latitude, city.longitude, radius);
}

// The globe rotation (radians) that brings the middle of a set of points to the
// centre of the view. Returns null when there is no meaningful middle.
export function viewFor(vectors) {
  if (vectors.length === 0) return null;
  const sum = vectors.reduce((acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]], [0, 0, 0]);
  const length = Math.hypot(sum[0], sum[1], sum[2]);
  if (length < 0.1) return null;
  const lat = Math.asin(sum[1] / length);
  const theta = Math.atan2(sum[2], -sum[0]);
  const lon = (theta * 180) / Math.PI - 180;
  return {
    rotationX: Math.max(-0.7, Math.min(0.7, lat)),
    rotationY: rotationYForLongitude(lon),
  };
}

// A flat array of x,y,z values along the great circle between two unit
// vectors, lifted off the surface in the middle so it reads as an arc.
export function arcPoints(from, to, segments = 64) {
  const dot = Math.min(1, Math.max(-1, from[0] * to[0] + from[1] * to[1] + from[2] * to[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-3 || omega > Math.PI - 1e-3) return [];
  const lift = 0.12 + 0.25 * (omega / Math.PI);
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const a = Math.sin((1 - t) * omega) / Math.sin(omega);
    const b = Math.sin(t * omega) / Math.sin(omega);
    const radius = 1.005 + lift * Math.sin(Math.PI * t);
    for (let k = 0; k < 3; k += 1) points.push((from[k] * a + to[k] * b) * radius);
  }
  return points;
}