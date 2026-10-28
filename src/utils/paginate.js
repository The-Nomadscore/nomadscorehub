// paginate.js — browser-side paging for the cities list (C2, #145).
// Paging happens in the browser for now; the whole filtered list is already
// loaded, so a page is just a slice of it.

/**
 * Returns one page of `items`. An out-of-range `page` is clamped, so the
 * caller never gets an empty page while items exist.
 * @returns {{ items: any[], page: number, pageCount: number, total: number,
 *             start: number, end: number }} start/end are 1-based and inclusive
 *             (both 0 when there are no items), ready for "Showing X to Y of N".
 */
export function paginate(items, page, pageSize) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const offset = (current - 1) * pageSize;
  const pageItems = items.slice(offset, offset + pageSize);
  return {
    items: pageItems,
    page: current,
    pageCount,
    total,
    start: total === 0 ? 0 : offset + 1,
    end: offset + pageItems.length,
  };
}

/**
 * Page numbers to show as buttons, with 'gap' where pages are skipped,
 * e.g. pageNumbers(5, 20) -> [1, 'gap', 4, 5, 6, 'gap', 20].
 * Shows every page when there are 7 or fewer.
 */
export function pageNumbers(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  // Keep the strip the same length near either end.
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}
