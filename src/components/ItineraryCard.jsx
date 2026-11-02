// ItineraryCard.jsx — one itinerary. Props documented in docs/prop-contracts.md.

import { buildGoogleCalendarUrl, downloadIcs } from '../utils/calendar.js';

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ItineraryCard({ itinerary, city, onEdit, onDelete }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-card p-6 flex flex-col gap-3">
      <div>
        <h3 className="font-display text-xl text-brand-text">{itinerary.title}</h3>
        <p className="text-brand-muted text-sm mt-1">
          {city ? city.fullName : 'Unknown city'}
        </p>
      </div>

      <div className="self-start px-3 py-1 rounded-pill bg-brand-accentSoft text-brand-accent text-sm font-medium">
        {formatDate(itinerary.startDate)} – {formatDate(itinerary.endDate)}
      </div>

      {itinerary.notes && (
        <p className="text-brand-text text-sm">{itinerary.notes}</p>
      )}

      <div className="flex flex-wrap gap-4 pt-2 mt-auto">
        <button
          onClick={() => downloadIcs(itinerary, city)}
          className="text-sm text-brand-accent hover:opacity-80 transition-opacity"
        >
          Download .ics
        </button>
        <a
          href={buildGoogleCalendarUrl(itinerary, city)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-accent hover:opacity-80 transition-opacity"
        >
          Google Calendar
        </a>
        <button
          onClick={() => onEdit(itinerary.id)}
          className="text-sm text-brand-muted hover:text-brand-text transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(itinerary.id)}
          className="text-sm text-brand-danger hover:opacity-80 transition-opacity"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default ItineraryCard;