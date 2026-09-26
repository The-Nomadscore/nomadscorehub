// services/api.js
//
// THE RULE: this is the ONLY file in the app that calls fetch() for city
// data. Components never call fetch() directly (see docs/prop-contracts.md
// and the integration rule in the project README).
//
// Why: when Phase 2 swaps Teleport for our own Flask backend, this file is
// the only thing that changes. Every component keeps working unmodified.
//
// Set VITE_USE_MOCK_DATA=true in .env to develop against mockData.js
// without hitting the network at all (see docs/teleport-api-notes.md for
// why that's useful while the live chain is still being hardened).

import { MOCK_CITIES } from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.teleport.org/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/** Thrown for any failure so components can branch on a single error shape. */
export class ApiError extends Error {
  constructor(message, { status = null, cause = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // e.g. 429 for rate limiting — UI should special-case this
    this.cause = cause;
  }
}

async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new ApiError('Network request failed.', { cause: err });
  }
  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, {
      status: response.status,
    });
  }
  return response.json();
}

/**
 * Search for cities by name.
 * @param {string} query
 * @returns {Promise<Array<{ id: string, name: string, fullName: string }>>}
 */
export async function searchCities(query) {
  if (USE_MOCK) {
    return MOCK_CITIES.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    ).map(({ id, name, fullName }) => ({ id, name, fullName }));
  }

  const data = await fetchJson(
    `${BASE_URL}/cities/?search=${encodeURIComponent(query)}`
  );
  const results = data._embedded?.['city:search-results'] ?? [];

  return results.map((result) => ({
    id: extractSlugFromLink(result._links?.['city:item']?.href),
    name: result.matching_full_name?.split(',')[0] ?? result.matching_full_name,
    fullName: result.matching_full_name,
    _cityLink: result._links?.['city:item']?.href, // needed by getCityDetail
  }));
}

/**
 * Fetch the full liveability profile for one city.
 * Returns data shaped exactly like an entry in mockData.js — build UI
 * against that file, this function's real output matches it.
 * @param {string} cityLinkOrId
 */
export async function getCityDetail(cityLinkOrId) {
  if (USE_MOCK) {
    const city = MOCK_CITIES.find((c) => c.id === cityLinkOrId);
    if (!city) throw new ApiError(`Unknown mock city id: ${cityLinkOrId}`);
    return city;
  }

  const cityData = await fetchJson(cityLinkOrId);
  const urbanAreaLink = cityData._links?.['city:urban_area']?.href;
  if (!urbanAreaLink) {
    throw new ApiError('This city has no liveability data available.', {
      status: 404,
    });
  }

  const urbanArea = await fetchJson(urbanAreaLink);
  const scoresLink = urbanArea._links?.['ua:scores']?.href;
  const imagesLink = urbanArea._links?.['ua:images']?.href;

  const [scoresData, imagesData] = await Promise.all([
    scoresLink ? fetchJson(scoresLink) : Promise.resolve(null),
    imagesLink ? fetchJson(imagesLink) : Promise.resolve(null),
  ]);

  const firstPhoto = imagesData?.photos?.[0];

  return {
    id: extractSlugFromLink(urbanAreaLink),
    name: urbanArea.name,
    fullName: urbanArea.full_name,
    heroImage: firstPhoto?.image?.web ?? null,
    imageAttribution: firstPhoto?.attribution ?? null,
    summary: urbanArea.full_name ? `${urbanArea.name} liveability profile.` : '',
    // Teleport doesn't provide prose summary text on this endpoint — flag
    // for the team: if the blueprint's "AI-generated breakdown" needs real
    // prose, that's a Phase 2/3 backend concern, not something Teleport supplies.
    teleportCityScore: scoresData?.teleport_city_score ?? null,
    scores: (scoresData?.categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      scoreOutOf10: c.score_out_of_10,
    })),
  };
}

/** Convenience for grid views that just need the full mock/default set. */
export async function getCities() {
  if (USE_MOCK) return MOCK_CITIES;
  throw new ApiError(
    'getCities() live mode not yet implemented — see Day 4 ticket.'
  );
}

function extractSlugFromLink(href) {
  if (!href) return null;
  const match = href.match(/([^/]+)\/?$/);
  return match ? match[1] : href;
}