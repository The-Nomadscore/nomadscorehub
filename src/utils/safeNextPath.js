// Where to go after signing in. The value comes from the address bar
// (/login?next=/itineraries), so anyone can put anything in it. Only a path on
// this site is accepted; anything else (https://evil.example, //evil.example,
// a path with a backslash) falls back to the default.
export function safeNextPath(raw, fallback = '/explore') {
  if (typeof raw !== 'string') return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return fallback;
  // Never send people back to the sign-in pages: that would loop.
  if (/^\/(login|register)(\/|\?|#|$)/.test(raw)) return fallback;
  return raw;
}