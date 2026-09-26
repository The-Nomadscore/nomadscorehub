// mockData.js
//
// This is the CONTRACT for what api.js hands back to every component.
// It is intentionally shaped exactly like the flattened, camelCase object
// getCityDetail() will produce once it's wired to the live Teleport chain
// (see docs/teleport-api-notes.md for the raw shape this is derived from).
//
// Build your UI against this file. When the live fetch lands on Day 4,
// nothing in your component should need to change.

export const MOCK_CITIES = [
  {
    id: 'lisbon',
    name: 'Lisbon',
    fullName: 'Lisbon, Portugal',
    heroImage: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a',
    imageAttribution: 'Photo by Unsplash',
    summary:
      'A sun-drenched coastal capital with a fast-growing startup scene, ' +
      'strong internet infrastructure, and one of the most walkable old towns in Europe.',
    teleportCityScore: 71.2,
    scores: buildScores({
      Housing: 3.1,
      'Cost of Living': 5.4,
      Startups: 7.8,
      'Venture Capital': 6.0,
      'Travel Connectivity': 7.2,
      Commute: 6.9,
      'Business Freedom': 7.5,
      Safety: 8.4,
      Healthcare: 8.1,
      Education: 7.0,
      'Environmental Quality': 7.6,
      Economy: 6.2,
      Taxation: 4.8,
      'Internet Access': 8.3,
      'Leisure & Culture': 8.9,
      Tolerance: 8.0,
      Outdoors: 7.9,
    }),
  },
  {
    id: 'chiang-mai',
    name: 'Chiang Mai',
    fullName: 'Chiang Mai, Thailand',
    heroImage: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a',
    imageAttribution: 'Photo by Unsplash',
    summary:
      'A long-standing digital nomad hub known for very low cost of living, ' +
      'a dense coworking-cafe culture, and a relaxed pace of life.',
    teleportCityScore: 62.8,
    scores: buildScores({
      Housing: 8.9,
      'Cost of Living': 9.2,
      Startups: 3.1,
      'Venture Capital': 1.5,
      'Travel Connectivity': 4.8,
      Commute: 6.1,
      'Business Freedom': 5.6,
      Safety: 6.0,
      Healthcare: 5.9,
      Education: 4.7,
      'Environmental Quality': 4.3,
      Economy: 3.9,
      Taxation: 6.5,
      'Internet Access': 6.8,
      'Leisure & Culture': 6.4,
      Tolerance: 5.8,
      Outdoors: 8.2,
    }),
  },
  {
    id: 'austin',
    name: 'Austin',
    fullName: 'Austin, United States',
    heroImage: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934',
    imageAttribution: 'Photo by Unsplash',
    summary:
      'A booming tech-industry hub with strong startup and venture capital ' +
      'activity, though cost of living has risen sharply in recent years.',
    teleportCityScore: 74.5,
    scores: buildScores({
      Housing: 4.0,
      'Cost of Living': 4.2,
      Startups: 8.6,
      'Venture Capital': 8.1,
      'Travel Connectivity': 6.5,
      Commute: 4.9,
      'Business Freedom': 8.9,
      Safety: 6.7,
      Healthcare: 7.2,
      Education: 7.8,
      'Environmental Quality': 6.0,
      Economy: 8.0,
      Taxation: 6.9,
      'Internet Access': 8.0,
      'Leisure & Culture': 7.7,
      Tolerance: 7.4,
      Outdoors: 6.6,
    }),
  },
];

function buildScores(map) {
  return Object.entries(map).map(([name, scoreOutOf10]) => ({
    id: name.toUpperCase().replace(/[^A-Z]+/g, '_'),
    name,
    scoreOutOf10,
  }));
}