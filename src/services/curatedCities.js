// curatedCities.js
//
// Hand-curated liveability scores (0-10) for the cities in the default grid.
// No free live API provides these 17 metrics (Teleport was retired), so they
// live here. Summaries and photos come live from Wikipedia via api.js.
//
// TO ADD A CITY: copy an entry, give it a unique `id`, set `wikiTitle` to the
// exact Wikipedia article title, and fill in all 17 scores.
// Set isSampleData: false only when the numbers come from a real source
// (and cite it in scoreSource).

export const CURATED_CITIES = [
  {
    id: 'lisbon',
    name: 'Lisbon',
    country: 'Portugal',
    wikiTitle: 'Lisbon',
    latitude: 38.7223,
    longitude: -9.1393,
    isSampleData: true,
    scoreSource: 'Placeholder estimates. Replace with sourced figures.',
    teleportCityScore: 71.2,
    scores: {
      Housing: 3.1, 'Cost of Living': 5.4, Startups: 7.8, 'Venture Capital': 6.0,
      'Travel Connectivity': 7.2, Commute: 6.9, 'Business Freedom': 7.5, Safety: 8.4,
      Healthcare: 8.1, Education: 7.0, 'Environmental Quality': 7.6, Economy: 6.2,
      Taxation: 4.8, 'Internet Access': 8.3, 'Leisure & Culture': 8.9,
      Tolerance: 8.0, Outdoors: 7.9,
    },
  },
  {
    id: 'chiang-mai',
    name: 'Chiang Mai',
    country: 'Thailand',
    wikiTitle: 'Chiang Mai',
    latitude: 18.7883,
    longitude: 98.9853,
    isSampleData: true,
    scoreSource: 'Placeholder estimates. Replace with sourced figures.',
    teleportCityScore: 62.8,
    scores: {
      Housing: 8.9, 'Cost of Living': 9.2, Startups: 3.1, 'Venture Capital': 1.5,
      'Travel Connectivity': 4.8, Commute: 6.1, 'Business Freedom': 5.6, Safety: 6.0,
      Healthcare: 5.9, Education: 4.7, 'Environmental Quality': 4.3, Economy: 3.9,
      Taxation: 6.5, 'Internet Access': 6.8, 'Leisure & Culture': 6.4,
      Tolerance: 5.8, Outdoors: 8.2,
    },
  },
  {
    id: 'austin',
    name: 'Austin',
    country: 'United States',
    wikiTitle: 'Austin, Texas',
    latitude: 30.2672,
    longitude: -97.7431,
    isSampleData: true,
    scoreSource: 'Placeholder estimates. Replace with sourced figures.',
    teleportCityScore: 74.5,
    scores: {
      Housing: 4.0, 'Cost of Living': 4.2, Startups: 8.6, 'Venture Capital': 8.1,
      'Travel Connectivity': 6.5, Commute: 4.9, 'Business Freedom': 8.9, Safety: 6.7,
      Healthcare: 7.2, Education: 7.8, 'Environmental Quality': 6.0, Economy: 8.0,
      Taxation: 6.9, 'Internet Access': 8.0, 'Leisure & Culture': 7.7,
      Tolerance: 7.4, Outdoors: 6.6,
    },
  },
];