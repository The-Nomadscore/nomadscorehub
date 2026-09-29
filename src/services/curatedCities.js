// curatedCities.js


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
  {
    id: 'nairobi',
    name: 'Nairobi',
    country: 'Kenya',
    wikiTitle: 'Nairobi',
    latitude: -1.2921,
    longitude: 36.8219,
    isSampleData: true,
    scoreSource:
      'Internet Access: Ookla Speedtest Global Index, Feb 2026 (45.37 Mbps median mobile; ' +
      'note speedof.me reports a much lower 4.4 Mbps via a different browser-test method). ' +
      'Cost of Living: Numbeo Cost of Living Index, Jan 2026 (28.9). ' +
      'Safety: Numbeo Safety Index, mid-2026 (~40.6). ' +
      'All other 14 metrics are unsourced estimates — needs real data before isSampleData can be false.',
    scores: {
      Housing: 6.5,
      'Cost of Living': 7.1,
      Startups: 6.8,
      'Venture Capital': 4.5,
      'Travel Connectivity': 6.0,
      Commute: 3.0,
      'Business Freedom': 5.5,
      Safety: 4.1,
      Healthcare: 5.0,
      Education: 5.5,
      'Environmental Quality': 5.0,
      Economy: 5.5,
      Taxation: 5.0,
      'Internet Access': 4.5,
      'Leisure & Culture': 6.0,
      Tolerance: 5.5,
      Outdoors: 8.0,

  },
},
{
  id: 'tbilisi',
  name: 'Tbilisi',
  country: 'Georgia',
  wikiTitle: 'Tbilisi',
  latitude: 41.7151,
  longitude: 44.8271,
  isSampleData: true,
  scoreSource:
    'Internet Access: ~50-55 Mbps download, corroborated by two independent sources ' +
    '(one outlier source claimed 30 Mbps, not used). ' +
    'Cost of Living: city-level Cost Index 15 (GeoStat/World Bank aggregation, March 2026) — ' +
    'notably lower than a separate national Numbeo figure of 23.2, not fully reconciled. ' +
    'Safety: city-level safety score 73/100 (2026 source); an old 2018 Numbeo figure (80.19) ' +
    'was not used as too stale. All other 14 metrics are unsourced estimates.',
  scores: {
    Housing: 7.0,
    'Cost of Living': 8.5,          // sourced, with caveat
    Startups: 5.0,
    'Venture Capital': 3.0,
    'Travel Connectivity': 5.0,
    Commute: 6.0,
    'Business Freedom': 6.5,        // Georgia known for easy business registration, unsourced
    Safety: 7.3,                     // sourced
    Healthcare: 5.5,
    Education: 5.0,
    'Environmental Quality': 6.0,
    Economy: 5.0,
    Taxation: 7.0,                   // low flat tax regime reputation, unsourced
    'Internet Access': 5.0,          // sourced
    'Leisure & Culture': 7.0,
    Tolerance: 5.0,
    Outdoors: 7.0,
  },
},
{
  id: 'medellin',
  name: 'Medellín',
  country: 'Colombia',
  wikiTitle: 'Medellín',
  latitude: 6.2442,
  longitude: -75.5812,
  isSampleData: true,
  scoreSource:
    'Internet Access: Ookla Speedtest Global Index via nomad data aggregator, ~214 Mbps ' +
    'download, March 2026 (a later snapshot showed 308 Mbps — inconsistent, unclear why). ' +
    'Cost of Living: Colombia country-level Cost Index 28 (WhereNext 2026, World Bank/OECD ' +
    'aggregation) — city-level Numbeo number not directly found, worth verifying. ' +
    'Safety: sources disagree (32 country-level, 43 city-level, 52 another comparator) — ' +
    'used 43 as the city-level estimate, needs a direct Numbeo check. ' +
    'All other 14 metrics are unsourced estimates.',
  scores: {
    Housing: 6.0,
    'Cost of Living': 7.2,          // sourced, country-level caveat
    Startups: 6.5,
    'Venture Capital': 4.0,
    'Travel Connectivity': 5.5,
    Commute: 5.5,                    // metro system is decent, unsourced
    'Business Freedom': 5.0,
    Safety: 4.3,                     // sourced, conflicting figures
    Healthcare: 6.5,
    Education: 5.0,
    'Environmental Quality': 6.0,
    Economy: 5.0,
    Taxation: 5.5,
    'Internet Access': 10.0,         // sourced
    'Leisure & Culture': 7.0,
    Tolerance: 5.5,
    Outdoors: 7.5,                   // "City of Eternal Spring" climate, unsourced
  },
},
];