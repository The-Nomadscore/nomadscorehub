// usePersistedShortlist.js — Day 3 (Erick). Issue #15.
// Holds the shortlist ids and mirrors them to localStorage so the shortlist
// survives a refresh. Stores ids only; the curated city list stays the
// source of truth.
import { useCallback, useEffect, useState } from 'react';

export const SHORTLIST_STORAGE_KEY = 'nomadscore:shortlist:v1';

function readStoredIds() {
  try {
    const raw = window.localStorage.getItem(SHORTLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop anything that isn't a string id, and de-duplicate.
    return [...new Set(parsed.filter((id) => typeof id === 'string'))];
  } catch {
    // Storage blocked (private mode), or the saved JSON is corrupted.
    return [];
  }
}

function writeStoredIds(ids) {
  try {
    window.localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Quota exceeded or storage unavailable. The shortlist keeps working
    // in memory for this session; it just won't survive a refresh.
  }
}

export default function usePersistedShortlist() {
  const [ids, setIds] = useState(readStoredIds);

  useEffect(() => {
    writeStoredIds(ids);
  }, [ids]);

  const add = useCallback((cityId) => {
    setIds((prev) => (prev.includes(cityId) ? prev : [...prev, cityId]));
  }, []);

  const remove = useCallback((cityId) => {
    setIds((prev) => prev.filter((id) => id !== cityId));
  }, []);

  return { ids, add, remove };
}