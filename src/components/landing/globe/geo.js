// Converts a latitude/longitude (degrees) to a point on a sphere. With no
// rotation applied, longitude -90 faces the camera (which looks down -z).
export function latLonToVector3(lat, lon, radius = 1) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

// The Y rotation (radians) that turns a given longitude toward the camera.
export function rotationYForLongitude(lon) {
  return -((lon + 90) * Math.PI) / 180;
}

export function hasCoordinates(city) {
  return Number.isFinite(city.latitude) && Number.isFinite(city.longitude);
}