// Pagination.jsx — Johnson (C2, #145).
// "Showing X to Y of N cities" plus numbered page buttons with
// Previous / Next. N is the count after search and filters.
// Props: see docs/prop-contracts.md.

import { pageNumbers } from '../utils/paginate.js';

const pageButton =
  'min-w-9 h-9 px-3 rounded-pill text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

function Pagination({ page, pageCount, total, start, end, onPageChange, label = 'cities' }) {
  if (total === 0) return null;

  return (
    <nav
      aria-label="Cities pages"
      className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <p className="text-sm text-brand-muted" aria-live="polite">
        Showing <span className="text-brand-text font-medium">{start}</span> to{' '}
        <span className="text-brand-text font-medium">{end}</span> of{' '}
        <span className="text-brand-text font-medium">{total}</span> {label}
      </p>

      {pageCount > 1 && (
        <ul className="flex flex-wrap items-center justify-center gap-1">
          <li>
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className={`${pageButton} text-brand-muted hover:text-brand-text`}
            >
              Previous
            </button>
          </li>
          {pageNumbers(page, pageCount).map((p, i) =>
            p === 'gap' ? (
              <li key={`gap-${i}`} className="px-1 text-brand-muted" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={p === page ? 'page' : undefined}
                  aria-label={`Page ${p}`}
                  className={`${pageButton} ${
                    p === page
                      ? 'bg-brand-accent text-brand-bg font-medium'
                      : 'text-brand-muted hover:text-brand-text border border-brand-border'
                  }`}
                >
                  {p}
                </button>
              </li>
            ),
          )}
          <li>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page === pageCount}
              className={`${pageButton} text-brand-muted hover:text-brand-text`}
            >
              Next
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}

export default Pagination;
