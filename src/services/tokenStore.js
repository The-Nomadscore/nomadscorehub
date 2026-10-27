// services/tokenStore.js
//
// Where the login token lives in the browser (docs/api-contract.md, section 1.1).
// It is kept in localStorage: simple, works with the Authorization header, but
// any script on the page can read it, so a cross-site scripting bug would
// expose it. The 1 hour token lifetime limits the damage.
//
// Only services/api.js should import this file.

const STORAGE_KEY = 'nomadscore:auth-token';

// Fallback for when localStorage is unavailable (e.g. private browsing):
// the token lasts for this page session, so login still works.
let memoryToken = null;

export function getToken() {
  try {
    // Read storage every time (not a cached copy), so signing out in one tab
    // also signs out the others on their next request.
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryToken;
  }
}

export function setToken(token) {
  memoryToken = token;
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Storage blocked or full: the in-memory copy still works.
  }
}

export function clearToken() {
  memoryToken = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}