// services/ownerId.js
//
// Anonymous owner identification (Phase 2). The browser generates a random
// UUID v4 once, keeps it in localStorage, and api.js sends it as the
// X-Owner-Id header on user-owned routes (shortlist, itineraries).
//
// This is IDENTIFICATION, not authentication: anyone can send any id.
// Phase 3 replaces it with a real user id. See docs/decisions.md (#3).
//
// Only services/api.js should import this file.

const STORAGE_KEY = 'nomadscore:owner-id';
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Fallback for when localStorage is unavailable (e.g. private browsing):
// the id lasts for this page session, so requests still work.
let memoryId = null;

function generateUuid() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // crypto.randomUUID only exists in secure contexts (https, localhost).
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getOwnerId() {
  if (memoryId) return memoryId;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Reject anything that isn't a valid UUID v4: the backend would 400 it.
    if (stored && UUID_V4.test(stored)) {
      memoryId = stored;
      return memoryId;
    }
  } catch {
    // Storage unavailable: fall through and generate an id.
  }

  memoryId = generateUuid();
  try {
    localStorage.setItem(STORAGE_KEY, memoryId);
  } catch {
    // Storage full or blocked: keep the id in memory only.
  }
  return memoryId;
}