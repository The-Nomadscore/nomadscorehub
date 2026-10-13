// mockItineraries.js — mock data for the itinerary shells (issue #90).
// Shape matches the Itinerary object in docs/prop-contracts.md.
// The backend sends snake_case; services/api.js will convert later.
// cityId values match MOCK_CITIES in mockData.js.

export const MOCK_ITINERARIES = [
  {
    id: 12,
    cityId: 'lisbon',
    title: 'Lisbon workation',
    startDate: '2026-11-03',
    endDate: '2026-11-17',
    notes: 'Book coworking near Baixa.',
  },
  {
    id: 13,
    cityId: 'chiang-mai',
    title: 'Chiang Mai month',
    startDate: '2026-12-01',
    endDate: '2026-12-31',
    notes: 'Check visa rules and find a long-stay apartment.',
  },
  {
    id: 14,
    cityId: 'austin',
    title: 'Austin conference week',
    startDate: '2027-03-08',
    endDate: '2027-03-14',
    notes: '',
  },
];

// Use this to test the empty state.
export const EMPTY_ITINERARIES = [];