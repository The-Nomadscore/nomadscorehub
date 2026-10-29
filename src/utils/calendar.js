// utils/calendar.js
//
// Turns an itinerary into a downloadable .ics file and a Google Calendar link
// (issue #146). Pure functions, no network calls.
//
// KEY RULE: itinerary.endDate is INCLUSIVE (the last day of the trip), but
// all-day events in .ics (DTEND) and Google links (dates=) treat the end as
// EXCLUSIVE. So the end we send is always endDate + 1 day.

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Adds days to a 'YYYY-MM-DD' string. Uses UTC math so time zones and
 *  daylight saving can never shift the date. */
export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** 'YYYY-MM-DD' -> 'YYYYMMDD' */
function compact(iso) {
  return iso.replace(/-/g, '');
}

/** The two all-day values calendars expect: start, and the day AFTER the last day. */
function allDayRange(itinerary) {
  return {
    start: compact(itinerary.startDate),
    end: compact(addDays(itinerary.endDate, 1)),
  };
}

// ---- .ics ------------------------------------------------------------------

/** Escapes text values as RFC 5545 requires. */
function escapeText(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/** Lines in .ics must be at most 75 bytes. Longer ones are folded: a line
 *  break followed by one space. Counts bytes, so accents and emoji are safe. */
function foldLine(line) {
  const encoder = new TextEncoder();
  const parts = [];
  let current = '';
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = ch;
      bytes = size;
      limit = 74; // the leading space on continuation lines uses 1 byte
    } else {
      current += ch;
      bytes += size;
    }
  }
  parts.push(current);
  return parts.join('\r\n ');
}

function utcStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * @param {{id: number, title: string, startDate: string, endDate: string, notes?: string}} itinerary
 * @param {{fullName?: string} | null} [city] used for the event location
 * @param {Date} [now] only here so tests can pass a fixed time
 * @returns {string} the contents of the .ics file
 */
export function buildIcs(itinerary, city = null, now = new Date()) {
  const { start, end } = allDayRange(itinerary);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NomadScore//Itinerary//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:itinerary-${itinerary.id}@nomadscore`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeText(itinerary.title)}`,
  ];
  if (city?.fullName) lines.push(`LOCATION:${escapeText(city.fullName)}`);
  if (itinerary.notes) lines.push(`DESCRIPTION:${escapeText(itinerary.notes)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.map(foldLine).join('\r\n') + '\r\n';
}

/** A safe file name from the title, e.g. "Lisbon workation" -> "lisbon-workation.ics" */
function icsFileName(title) {
  const slug = String(title)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'itinerary'}.ics`;
}

/** Builds the file in the browser and starts the download. */
export function downloadIcs(itinerary, city = null) {
  const blob = new Blob([buildIcs(itinerary, city)], {
    type: 'text/calendar;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = icsFileName(itinerary.title);
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked a moment later so slower browsers can start the download first.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- Google Calendar -------------------------------------------------------

/** @returns {string} a link that opens Google Calendar's "new event" screen, pre-filled */
export function buildGoogleCalendarUrl(itinerary, city = null) {
  const { start, end } = allDayRange(itinerary);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: itinerary.title,
  });
  if (itinerary.notes) params.set('details', itinerary.notes);
  if (city?.fullName) params.set('location', city.fullName);
  // dates is added by hand so the "/" between the two dates stays readable.
  return `https://calendar.google.com/calendar/render?${params.toString()}&dates=${start}/${end}`;
}