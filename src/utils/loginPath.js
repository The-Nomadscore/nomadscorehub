// The sign-in link for the page the user is on (or was heading to), so
// LoginPage can send them back there afterwards (B4, #143).
// LoginPage checks `next` with safeNextPath before using it.
export function loginPathFor(location) {
  const next = `${location.pathname}${location.search}${location.hash}`;
  return `/login?next=${encodeURIComponent(next)}`;
}
