// services/api.js
//
// THE RULE: the ONLY file that calls fetch() for city data. Components never
// call fetch() directly. Phase 2 swaps this file's internals for our Flask
// backend; nothing else changes.
//
// Sources (Teleport was retired, TM approved the change):
//   - Wikipedia REST API       -> summary text, hero image, source link
//   - Open-Meteo geocoding     -> city search + coordinates
//   - our backend /api/cities  -> the 17 liveability scores
//
// VITE_USE_MOCK_DATA=true serves mockData.js with zero network calls.

import { MOCK_CITIES } from './mockData';
import { getOwnerId } from './ownerID.js'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const WIKI_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/** Single error shape for components. status 429 = rate limited. */
export class ApiError extends Error {
  constructor(message, { status = null, code = null, cause = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code; // e.g. 'already_in_shortlist' (see docs/api-contract.md)
    this.cause = cause;
  }
}

async function fetchJson(url, { method = 'GET', body, headers = {} } = {}) {
  const init = { method, headers: { ...headers } };
  if (body !== undefined) {
    // Content-Type is only set when there is a body, so plain GETs to
    // Wikipedia/Open-Meteo stay simple requests (no CORS preflight).
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    throw new ApiError('Network request failed.', { cause: err });
  }
  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // Not JSON (e.g. an upstream HTML error page): fall back to the status.
    }
    throw new ApiError(
      payload?.error?.message ?? `Request failed with status ${response.status}`,
      { status: response.status, code: payload?.error?.code ?? null }
    );
  }
  if (response.status === 204) return null; // DELETE: no body to parse
  return response.json();
}

// ---- Wikipedia (cached per session so revisits cost nothing) --------------

const wikiCache = new Map();

function fetchWikiSummary(title) {
  if (!title) return Promise.resolve(null); // backend sends "" when a city has no article
  if (wikiCache.has(title)) return wikiCache.get(title);

  const request = fetchJson(
    WIKI_SUMMARY_URL + encodeURIComponent(title.replace(/ /g, '_'))
  )
    .then((d) =>
      d.type === 'disambiguation'
        ? null
        : {
            summary: d.extract ?? '',
            heroImage: d.originalimage?.source ?? d.thumbnail?.source ?? null,
            sourceUrl: d.content_urls?.desktop?.page ?? null,
          }
    )
    .catch((err) => {
      if (err.status === 404) return null; // no article: degrade, don't fail
      wikiCache.delete(title); // don't cache real failures
      throw err;
    });

  wikiCache.set(title, request);
  return request;
}

// ---- Building the City object every component consumes --------------------

// One shared request per page load. A failure isn't cached, so a retry works.
let citiesRequest = null;

function fetchBackendCities() {
  if (!citiesRequest) {
    citiesRequest = fetchJson(`${API_BASE_URL}/cities`)
      .then((data) => data.cities)
      .catch((err) => {
        citiesRequest = null;
        throw err;
      });
  }
  return citiesRequest;
}

function toCity(base, wiki) {
  const scores = base.scores ?? [];

  return {
    id: base.id,
    name: base.name,
    fullName: base.country ? `${base.name}, ${base.country}` : base.name,
    latitude: base.latitude ?? null,
    longitude: base.longitude ?? null,
    heroImage: wiki?.heroImage ?? null,
    imageAttribution: wiki?.sourceUrl ? 'Wikipedia' : null,
    sourceUrl: wiki?.sourceUrl ?? null,
    summary: wiki?.summary ?? '',
    teleportCityScore: base.teleportCityScore ?? null,
    scores,
    hasScores: scores.length > 0,
    isSampleData: Boolean(base.isSampleData),
  };
}

function withFlags(mockCity) {
  return {
    latitude: null,
    longitude: null,
    sourceUrl: null,
    ...mockCity,
    hasScores: mockCity.scores.length > 0,
    isSampleData: true,
  };
}

// ---- Public API ------------------------------------------------------------

/** The default grid: every curated city, with live Wikipedia text + photo. */
export async function getCities() {
  if (USE_MOCK) return MOCK_CITIES.map(withFlags);

  const cities = await fetchBackendCities();

  // Each city degrades independently: if Wikipedia fails for one, the card
  // still renders (no photo) instead of breaking the whole grid.
  return Promise.all(
    cities.map(async (c) => {
      const wiki = await fetchWikiSummary(c.wikiTitle).catch(() => null);
      return toCity(c, wiki);
    })
  );
}

/**
 * Search any city in the world. Curated cities come first (they have scores).
 * @returns {Promise<Array<{id, name, country, fullName, latitude, longitude, hasScores}>>}
 */
export async function searchCities(query) {
  const q = query.trim();
  if (!q) return [];
  const needle = q.toLowerCase();

  const source = USE_MOCK ? MOCK_CITIES : await fetchBackendCities();
  const curatedMatches = source
    .filter((c) => c.name.toLowerCase().includes(needle))
    .map((c) => {
      const country = c.country ?? c.fullName?.split(', ')[1] ?? '';
      return {
        id: c.id,
        name: c.name,
        country,
        fullName: c.fullName ?? `${c.name}, ${country}`,
        latitude: c.latitude ?? null,
        longitude: c.longitude ?? null,
        hasScores: true,
      };
    });
  if (USE_MOCK) return curatedMatches;

  let places = [];
  try {
    const data = await fetchJson(
      `${GEOCODING_URL}?name=${encodeURIComponent(q)}&count=8&language=en&format=json`
    );
    places = data.results ?? [];
  } catch (err) {
    if (curatedMatches.length === 0) throw err; // nothing to fall back on
  }

  const seen = new Set(
    curatedMatches.map((c) => `${c.name}|${c.country}`.toLowerCase())
  );
  const geocoded = places
    .filter((p) => !seen.has(`${p.name}|${p.country}`.toLowerCase()))
    .map((p) => ({
      id: `geo-${p.id}`,
      name: p.name,
      country: p.country ?? '',
      fullName: p.country ? `${p.name}, ${p.country}` : p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      hasScores: false,
    }));

  return [...curatedMatches, ...geocoded];
}

/**
 * Full profile for one city. Accepts a curated id string, or a stub from
 * searchCities() for cities outside the curated list (those come back with
 * empty scores and hasScores: false, so the UI shows a "limited data" state).
 */
export async function getCityDetail(idOrStub) {
  const stub = typeof idOrStub === 'string' ? { id: idOrStub } : idOrStub;

  if (USE_MOCK) {
    const city = MOCK_CITIES.find((c) => c.id === stub.id);
    if (!city) throw new ApiError(`Unknown mock city id: ${stub.id}`, { status: 404 });
    return withFlags(city);
  }

  const curated = (await fetchBackendCities()).find((c) => c.id === stub.id);
  if (curated) {
    // Errors propagate here on purpose so the UI can show a 429 banner.
    return toCity(curated, await fetchWikiSummary(curated.wikiTitle));
  }

  if (!stub.name) {
    throw new ApiError(`Unknown city: ${stub.id}`, { status: 404 });
  }
  return toCity({ ...stub, scores: null }, await fetchWikiSummary(stub.name));
}

/** Pings the Flask backend. Resolves to { status: 'ok' } when reachable. */
export async function checkBackendHealth() {
  return fetchJson(`${API_BASE_URL}/health`);
}

// ---- Shortlist (Flask backend, scoped by X-Owner-Id) -----------------------

function ownerRequest(path, options = {}) {
  return fetchJson(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...options.headers, 'X-Owner-Id': getOwnerId() },
  });
}

/** @returns {Promise<Array<{city_id: string, position: number}>>} */
export async function fetchShortlist() {
  const data = await ownerRequest('/shortlist');
  return data.items;
}

export function addShortlistItem(cityId) {
  return ownerRequest('/shortlist', { method: 'POST', body: { city_id: cityId } });
}

/** Resolves to null (the server replies 204). */
export function removeShortlistItem(cityId) {
  return ownerRequest(`/shortlist/${encodeURIComponent(cityId)}`, { method: 'DELETE' });
}

/** @param {string[]} cityIds the full list, in the new order */
export async function saveShortlistOrder(cityIds) {
  const data = await ownerRequest('/shortlist/order', {
    method: 'PUT',
    body: { city_ids: cityIds },
  });
  return data.items;
}
// ---- Itineraries (Flask backend, scoped by X-Owner-Id) ---------------------
// Fields are snake_case, exactly as docs/api-contract.md section 3.4 returns
// them. Like the shortlist functions, these always call the backend (they do
// not use mock data). Failures surface as ApiError via fetchJson.

/**
 * @typedef {Object} Itinerary
 * @property {number} id
 * @property {string} city_id
 * @property {string} title
 * @property {string} start_date  YYYY-MM-DD
 * @property {string} end_date    YYYY-MM-DD
 * @property {string} notes       empty string when none
 */

/** @returns {Promise<Itinerary[]>} */
export async function fetchItineraries() {
  const data = await ownerRequest('/itineraries');
  return data.itineraries;
}

/**
 * @param {{city_id: string, title: string, start_date: string, end_date: string, notes?: string}} itinerary
 * @returns {Promise<Itinerary>} the created itinerary, including its id
 */
export function createItinerary(itinerary) {
  return ownerRequest('/itineraries', { method: 'POST', body: itinerary });
}

/**
 * Partial update: send only the fields to change (title, start_date,
 * end_date, notes). id and city_id cannot be changed.
 * @param {number} id
 * @param {{title?: string, start_date?: string, end_date?: string, notes?: string}} changes
 * @returns {Promise<Itinerary>} the full updated itinerary
 */
export function updateItinerary(id, changes) {
  return ownerRequest(`/itineraries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: changes,
  });
}

/**
 * @param {number} id
 * Resolves to null (the server replies 204).
 */
export function deleteItinerary(id) {
  return ownerRequest(`/itineraries/${encodeURIComponent(id)}`, { method: 'DELETE' });
}